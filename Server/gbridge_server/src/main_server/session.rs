use std::{collections::HashMap, sync::Arc, vec};
use chrono::{DateTime, Utc};
use crate::main_server::database::Db;

use tokio::sync::Mutex;
use mongodb::bson::doc;
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

  pub async fn add_session(&mut self, username: String)
  {
    if let Some(s) = self.get_session(username.as_str()).await {
      s.lock().await.update_last_active_time();
      return;
    }
    let session = Arc::new(Mutex::new(Session::new(username.clone())));
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

  pub async fn clean_outdated_sessions(&mut self)
  {
    println!("Cleaning outdated sessions");
    let mut to_remove = Vec::new();
    for (username, session) in self.sessions.iter() {
      let s = session.lock().await;
      if s.get_last_active_time().timestamp() + 3600 < Utc::now().timestamp() {
        to_remove.push(username.clone());
      }
    }
    for username in to_remove {
      self.sessions.remove(username.as_str());
    }
  }
    
}

impl Session {
  pub fn new(username: String) -> Self
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
      last_active_time: Utc::now(),
    }
  }

  pub async fn retrive_from_db(&mut self, db: Arc<Db>, items : & Vec<String>)
  {
    let received = db.users_base_info.find_one(doc! {
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
        "money" => {
          let receive_item = received.get("money");
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
        _ => {panic!("Invalid item");}
      }
    }
  }

  pub async fn update_to_db(&self, db: Arc<Db>, items : & Vec<String>)
  {
    let received = db.users_base_info.find_one(doc! {
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
        "money" => {
          if self.cash.is_some() {
            update.insert("money", self.cash.as_ref().unwrap());
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

    db.users_base_info.update_one(doc! {
      "username": &self.username
    }, doc! {
      "$set": update
    }, None).await.unwrap();
  }

  pub fn estimate_score(&self) -> f64
  {
    let mut score = 0.0;
    if self.cash.is_some() {
      score += self.cash.unwrap();
    }
    if self.income.is_some() {
      score += 12.0 * self.income.unwrap();
    }
    if self.expenditure.is_some() {
      score -= 12.0 * self.expenditure.unwrap();
    }
    if self.debt.is_some() {
      score -= self.debt.unwrap();
    }
    if self.assets.is_some() {
      score += self.assets.unwrap();
    }
    score = (score + 1000000.0) / 2000000.0;
    score = f64::max(f64::min(score, 1.0), 0.0);
    if self.income.is_some() && self.expenditure.is_some() {
      score = score * (self.income.unwrap() + 500.0) / (self.expenditure.unwrap() + 500.0);
    }
    if self.debt.is_some() && self.assets.is_some(){
      score = score * (self.assets.unwrap() + 500.0) / (self.debt.unwrap() + 500.0);
    }

    if self.debt.is_some() && self.cash.is_some(){
      score = score * (self.cash.unwrap() + 500.0) / (self.debt.unwrap() + 500.0);
    }
    if score > 1.0 {
      score = 1.0;
    }
    if score < 0.0 {
      score = 0.0;
    }
    score = f64::max(f64::min(score, 1.0), 0.0);
    score
  }

  pub fn update_last_active_time(&mut self)
  {
    self.last_active_time = Utc::now();
  }

  pub fn get_last_active_time(&self) -> DateTime<Utc>
  {
    self.last_active_time
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
}