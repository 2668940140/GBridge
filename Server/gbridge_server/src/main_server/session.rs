use std::{collections::HashMap, sync::Arc, vec};
use crate::main_server::database::Db;

use tokio::sync::Mutex;
use mongodb::bson::doc;
pub struct Session
{
  pub username : String,
  pub portrait : Option<String>,
  pub money : Option<i64>
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

  pub fn add_session(&mut self, username: String)
  {
    let session = Arc::new(Mutex::new(Session::new(username.clone())));
    self.sessions.insert(username, session);
  }

  pub fn get_session(&self, username: &str) -> Option<Arc<Mutex<Session>>>
  {
    self.sessions.get(username).map(|s| s.clone())
  }

  pub fn remove_session(&mut self, username: &str)
  {
    self.sessions.remove(username);
  }
    
}

impl Session {
  pub fn new(username: String) -> Self
  {
    Session {
      username,
      portrait: None,
      money: None,
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
            self.money = receive_item.unwrap().as_i64();
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
          if self.money.is_some() {
            update.insert("money", self.money.as_ref().unwrap());
          }
        },
        _ => {panic!("Invalid item");}
      }
    }

    db.users_base_info.update_one(doc! {
      "username": &self.username
    }, doc! {
      "$set": update
    }, None).await.unwrap();
  }
}