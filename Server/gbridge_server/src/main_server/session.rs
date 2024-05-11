use std::{collections::HashMap, io::SeekFrom, string, sync::Arc, vec};
use chrono::{DateTime, Utc};
use serde_json::json;
use crate::main_server::database::Db;
use chatgpt::converse;
use chatgpt::client::ChatGPT;
use chatgpt;
use tempfile;

use tokio::sync::Mutex;
use mongodb::{bson::doc, change_stream::session};
use crate::main_server::data_structure::Json;
use lazy_static::lazy_static;

pub struct Session
{
  pub username : String,
  pub portrait : Option<String>,
  pub cash : Option<f64>,
  pub income : Option<f64>, // monthly income
  pub expenditure : Option<f64>, // monthly expenditure
  pub debt : Option<f64>,
  pub assets : Option<f64>,
  pub email : Option<String>,
  pub password : Option<String>,
  pub bot_conversation : Option<converse::Conversation>,
  pub adviser_conversation : Option<Json>,
  last_adviser_conversation_retrieve_time: Option<DateTime<Utc>>,
  db : Arc<Db>,
  last_active_time: DateTime<Utc>,
}

lazy_static! {
  pub static ref FINANCIAL_FILEDS : Vec<String> = vec![
      "cash".to_string(),
      "income".to_string(),
      "expenditure".to_string(),
      "debt".to_string(),
      "assets".to_string()
  ];
}


pub struct Sessions
{
  sessions: HashMap<String, Arc<Mutex<Session>>>,
}

impl Sessions
{
  pub fn new() -> Self
  {
    Sessions {
      sessions: HashMap::new(), 
    }
  }

  pub async fn add_session(&mut self, username: String, db: Arc<Db>)
  {
    if let Some(s) = self.get_session(username.as_str()).await {
      s.lock().await.update_last_active_time();
      return;
    }
    let session = Arc::new(
      Mutex::new(Session::new(username.clone(), db.clone())));
    self.sessions.insert(username, session);
  }

  pub async fn get_session(&self, username: &str) -> Option<Arc<Mutex<Session>>>
  {
    let session = self.sessions.get(username).map(|s| s.clone());
    if let Some(s) = session.clone() {
        s.lock().await.update_last_active_time();
    }
    session
  }

  pub async fn clear_sessions(&mut self)
  {
    for (_, session) in self.sessions.iter() {
      session.lock().await.finish().await;
    }
    self.sessions.clear();
  }

  pub async fn clean_outdated_sessions(&mut self)
  {
    let mut to_remove = Vec::new();
    for (username, session) in self.sessions.iter() {
      let s = session.lock().await;
      if s.get_last_active_time().timestamp() + 3600 < Utc::now().timestamp() {
        to_remove.push(username.clone());
      }
    }
    for username in to_remove {
      let session = self.sessions.get(&username).unwrap();
      session.lock().await.finish().await;
      self.sessions.remove(username.as_str());
    }
  }
}


impl Session {
  pub fn new(username: String, db : Arc<Db>) -> Self
  {
    Session {
      username,
      portrait: None,
      cash: None,
      income: None,
      expenditure: None,
      debt: None,
      assets: None,
      email: None,
      bot_conversation: None,
      adviser_conversation: None,
      password: None,
      db: db,
      last_active_time: Utc::now(),
      last_adviser_conversation_retrieve_time: None,
    }
  }
  async fn finish(&self)
  {
    self.send_bot_conversation_to_db().await;
    if self.adviser_conversation.is_some() {
      self.send_adviser_conversation_to_db().await;
    }
  }

  async fn send_bot_conversation_to_db(&self)
  {
    if self.bot_conversation.is_none() {
      return;
    }
    let conversation = self.bot_conversation.as_ref().unwrap();
    let file = tempfile::NamedTempFile::new().unwrap();
    let path = file.path().to_str().unwrap().to_string();
    conversation.save_history_json(path.clone()).await.unwrap();
    let content = std::fs::read_to_string(path).unwrap();
    
    let existing_doc = self.db.users_bot_conversation.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap();

    if existing_doc.is_some() {
      self.db.users_bot_conversation.update_one(doc! {
        "username": &self.username
      }, doc! {
        "$set": {
          "content": content,
          "time": Utc::now().to_rfc3339()
        }
      }, None).await.unwrap();
    } else {
      self.db.users_bot_conversation.insert_one(doc! {
        "username": &self.username,
        "content": content,
        "time": Utc::now().to_rfc3339()
      }, None).await.unwrap();
    }
  }

  pub async fn retrieve_adviser_conversation(&mut self)
  {
    if self.last_adviser_conversation_retrieve_time.is_some()
    {
      return;
    }

    self.last_adviser_conversation_retrieve_time = Some(Utc::now());
    let received = self.db.users_adviser_conversation.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap();
    if received.is_none() {
      return;
    }
    let received = received.unwrap();
    let content = received.get("content").unwrap().as_str().unwrap();
    let conversation = serde_json::from_str(content).unwrap();
    self.adviser_conversation = Some(conversation);
  }

  pub async fn send_adviser_conversation_to_db(&self)
  {
    if self.adviser_conversation.is_none() {
      return;
    }
    let conversation = self.adviser_conversation.as_ref().unwrap();
    let content = serde_json::to_string(conversation).unwrap();
    let existing_doc = self.db.users_adviser_conversation.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap();

    if existing_doc.is_some() {
      self.db.users_adviser_conversation.update_one(doc! {
        "username": &self.username
      }, doc! {
        "$set": {
          "content": content,
          "time": Utc::now().to_rfc3339()
        }
      }, None).await.unwrap();
    } else {
      self.db.users_adviser_conversation.insert_one(doc! {
        "username": &self.username,
        "content": content,
        "time": Utc::now().to_rfc3339()
      }, None).await.unwrap();
    }
  }

  pub async fn append_adviser_conversation(&mut self, 
    msg : String, role : String)
  {
    if self.last_adviser_conversation_retrieve_time.is_none() {
      self.retrieve_adviser_conversation().await;
    }
    if self.adviser_conversation.is_none() {
      self.adviser_conversation = Some(json!([]));
    }
    assert!(role == "user" || role == "adviser");
    let entry = json!(
      {
        "role": role,
        "msg": msg,
        "time": Utc::now().to_rfc3339()
      }
    );
    let conversation = self.adviser_conversation.as_mut().unwrap();
    conversation.as_array_mut().unwrap().push(entry);
  }

  async fn retrieve_bot_conversation(&mut self, 
    client: Arc<ChatGPT>)
  {
    let received = self.db.users_bot_conversation.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap();
    if received.is_none() {
      return;
    }
    let received = received.unwrap();
    let content = received.get("content").unwrap().as_str().unwrap();
    let file = tempfile::NamedTempFile::new().unwrap();
    
    std::io::Write::write_all(&mut &file, content.as_bytes()).unwrap();
    
    let path = file.into_temp_path();
    let conversation = client.
    restore_conversation_json(path).await.unwrap();
    self.bot_conversation = Some(conversation);
  }

  pub async fn speak_to_bot(&mut self, bot: Arc<ChatGPT>, 
    message: String)
  -> String
  {
    if self.bot_conversation.is_none() {
      self.retrieve_bot_conversation(bot.clone()).await;
    }
    if self.bot_conversation.is_none()
    {
      let mut conversation = bot.new_conversation();
      conversation.send_role_message(chatgpt::types::Role::System, 
    format!("You are a financial advisor helping user {}",
      self.username)).await.unwrap();
      self.bot_conversation = Some(conversation);
    }
    let merged_msg = format!("System: {}\nUser: {}", 
    self.get_financial_summary().await, message);

    let conversation = self.bot_conversation.as_mut().unwrap();
    
    let response = conversation.send_message(merged_msg).await
    .unwrap();
    response.message().content.clone()
  }

  pub async fn retrive_from_db(&mut self, items : & Vec<String>)
  {
    let received = self.db.users_base_info.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap().unwrap();
    
    for item in items {
      match item.as_str() {
        "portrait" => {
          let receive_item = received.get("portrait");
          if receive_item.is_some() {
            self.portrait = receive_item.unwrap().as_str().map(|s| s.to_string());
          }
        },
        "cash" => {
          let receive_item = received.get("cash");
          if receive_item.is_some() {
            self.cash = receive_item.unwrap().as_f64();
          }
        },
        "income" => {
          let receive_item = received.get("income");
          if receive_item.is_some() {
            self.income = receive_item.unwrap().as_f64();
          }
        },
        "expenditure" => {
          let receive_item = received.get("expenditure");
          if receive_item.is_some() {
            self.expenditure = receive_item.unwrap().as_f64();
          }
        },
        "debt" => {
          let receive_item = received.get("debt");
          if receive_item.is_some() {
            self.debt = receive_item.unwrap().as_f64();
          }
        },
        "assets" => {
          let receive_item = received.get("assets");
          if receive_item.is_some() {
            self.assets = receive_item.unwrap().as_f64();
          }
        },
        "email" => {
          let receive_item = received.get("email");
          if receive_item.is_some() {
            self.email = receive_item.unwrap().as_str().map(|s| s.to_string());
          }
        },
        "password" =>
        {
          let receive_item = received.get("password");
          if receive_item.is_some() {
            self.password = receive_item.unwrap().as_str().map(|s| s.to_string());
          }
        }
        _ => {panic!("Invalid item");}
      }
    }
  }

  pub async fn update_to_db(&self, items : & Vec<String>)
  {
    let received = self.db.users_base_info.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap().unwrap();

    let mut update = received.clone();

    for item in items {
      match item.as_str() {
        "portrait" => {
          if self.portrait.is_some() {
            update.insert("portrait", self.portrait.as_ref().unwrap());
          }
        },
        "cash" => {
          if self.cash.is_some() {
            update.insert("cash", self.cash.as_ref().unwrap());
          }
        },
        "income" => {
          if self.income.is_some() {
            update.insert("income", self.income.as_ref().unwrap());
          }
        },
        "expenditure" => {
          if self.expenditure.is_some() {
            update.insert("expenditure", self.expenditure.as_ref().unwrap());
          }
        },
        "debt" => {
          if self.debt.is_some() {
            update.insert("debt", self.debt.as_ref().unwrap());
          }
        },
        "assets" => {
          if self.assets.is_some() {
            update.insert("assets", self.assets.as_ref().unwrap());
          }
        },
        _ => {panic!("Invalid item");}
      }
    }
    update.insert("time", Utc::now().to_rfc3339());

    self.db.users_base_info.update_one(doc! {
      "username": &self.username
    }, doc! {
      "$set": update
    }, None).await.unwrap();
  }

  pub fn pridict(cash : Option<f64>,
  income : Option<f64>,
  expenditure : Option<f64>,
  debt : Option<f64>,
  assets: Option<f64>) -> f64
  {
    let mut score = 0.0;
    if let Some(cash_val) = cash {
      score += cash_val;
    }
    if let Some(income_val) = income {
      score += 12.0 * income_val;
    }
    if let Some(expenditure_val) = expenditure {
      score -= 12.0 * expenditure_val;
    }
    if let Some(debt_val) = debt {
      score -= debt_val;
    }
    if let Some(assets_val) = assets {
      score += assets_val;
    }
    score = (score + 1000000.0) / 2000000.0;
    score = f64::max(f64::min(score, 1.0), 0.0);
    if let (Some(income_val), Some(expenditure_val)) = (income, expenditure) {
      score = score * (income_val + 500.0) / (expenditure_val + 500.0);
    }
    if let (Some(debt_val), Some(assets_val)) = (debt, assets) {
      score = score * (assets_val + 500.0) / (debt_val + 500.0);
    }
    
    if let (Some(cash_val), Some(assets_val)) = (cash, assets) {
      score = score *  f64::min(f64::max(
        (cash_val * 10.0 + 500.0) / (assets_val + 500.0)
        , 0.5),1.2);
    }
    if let (Some(debt_val), Some(cash_val)) = (debt, cash) {
      score = score * (cash_val + 500.0) / (debt_val + 500.0);
    }
    score = f64::max(f64::min(score, 1.0), 0.0);
    score
  }

  pub async fn estimate_score(&mut self) -> f64
  {
    self.retrive_from_db(&FINANCIAL_FILEDS).await;
    Session::pridict(self.cash, self.income, 
    self.expenditure, self.debt, self.assets)
  }

  pub async fn estimate_post_score(&mut self,
  post_type : String,
  amount : f64,
  interest : f64,
  period : i64,
  method : String) -> f64
  {
    if !self.is_financial_info_complete().await {
      return -1.0;
    }
    let mut cash = self.cash.unwrap();
    let mut debt = self.debt.unwrap();
    let mut assets = self.assets.unwrap();
    let mut income = self.income.unwrap();
    let mut expenditure = self.expenditure.unwrap();
    if post_type == "lend"
    {
      cash -= amount;
      if cash < 0.0 {
        return 0.0;
      }
      assets -= amount;
      if assets < 0.0 {
        return 0.0;
      }
      income += amount * interest / 12.0;
    }
    else if post_type == "borrow"
    {
      if amount - amount * interest / 12.0 * period as f64 <= 0.0
      {
        // Too long or interet too high
        return 0.0;
      }
      cash += amount - amount * interest / 12.0 * period as f64;
      assets += amount - amount * interest / 12.0 * period as f64;
      debt += amount;
      expenditure += amount * interest / 12.0;
    }
    else
    {
      panic!("Invalid post type")
    }
    Self::pridict(Some(cash), Some(income),
    Some(expenditure), Some(debt), Some(assets))

  }

  pub fn update_last_active_time(&mut self)
  {
    self.last_active_time = Utc::now();
  }

  pub fn get_last_active_time(&self) -> DateTime<Utc>
  {
    self.last_active_time
  }

  pub async fn get_financial_summary(&mut self) -> String
  {
    self.retrive_from_db(&FINANCIAL_FILEDS).await;
    let mut string_info = format!("User {} financial summary: ", self.username); 
    if self.cash.is_some() {
      string_info.push_str(&format!("cash: ${}, ", self.cash.unwrap()));
    }
    if self.income.is_some() {
      string_info.push_str(&format!("income: ${}/month, ", self.income.unwrap()));
    }
    if self.expenditure.is_some() {
      string_info.push_str(&format!("expenditure: ${}/month, ", self.expenditure.unwrap()));
    }
    if self.debt.is_some() {
      string_info.push_str(&format!("debt: ${}, ", self.debt.unwrap()));
    }
    if self.assets.is_some() {
      string_info.push_str(&format!("assets: ${}, ", self.assets.unwrap()));
    }
    if string_info.len() == 0
    {
      string_info.push_str("no financial information");
    }
    return string_info;
}

  pub async fn get_last_update_time(&self, db: Arc<Db>)
  -> DateTime<Utc>
  {
    let received = db.users_base_info.find_one(doc! {
      "username": &self.username
    }, None).await.unwrap().unwrap();
    let time = received.get("time").unwrap().as_str().unwrap();
    DateTime::parse_from_rfc3339(time).unwrap().with_timezone(&Utc)
  }

  pub async fn is_financial_info_complete(&mut self) -> bool
  {
    self.retrive_from_db(&FINANCIAL_FILEDS).await;
    self.cash.is_some() && self.income.is_some() && 
    self.expenditure.is_some() && self.debt.is_some() && 
    self.assets.is_some()
  }
}
