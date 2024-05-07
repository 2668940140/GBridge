mod data_structure;
mod utils;
mod database;
mod session;
use crate::ServerConfig;
use data_structure::Json;
use mongodb::bson::doc;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

use self::database::Db;
use self::session::{Session, FINANCIAL_FILEDS};
use std::time::Duration;

pub struct MainServer
{
  config: ServerConfig,
  db : Option<Arc<database::Db>>,
  listener : Option<TcpListener>,
  sessions: Arc<Mutex<session::Sessions>>
}

impl MainServer {
  async fn initialize(&mut self)
  {
    self.db = Some(Arc::new(database::Db::new(&self.config.db_uri).await));
    self.listener = Some(
      TcpListener::bind(format!("127.0.0.1:{}", self.config.port))
        .await.unwrap());
    println!("Server started at {}", self.config.port);
  }

  async fn register_worker(request : &Json, db : Arc<Db>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let email = content.get("email").and_then(|e| e.as_str());
    let username = content.get("username").and_then(|u| u.as_str());
    let password = content.get("password").and_then(|p| p.as_str());

    if email.is_none() || username.is_none() || password.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved").and_then(|p| p.as_object());


    let email = email.unwrap();
    let username = username.unwrap();
    let password = password.unwrap();

    let response = db.users_base_info.insert_one(doc! {
      "email": email,
      "username": username,
      "password": password,
    }, None).await;

    if response.is_err() {
      return Err(());
    }
    else
    {
      return Ok(json!({
        "type": "register",
        "status": 200,
        "preserved": preserved,
      }));
    }
  }

  async fn login_worker(request : &Json, db : Arc<Db>, 
  sessions :Arc<Mutex<session::Sessions>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let username = content.get("username").and_then(|u| u.as_str());
    let password = content.get("password").and_then(|p| p.as_str());

    if username.is_none() || password.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved").and_then(|p| p.as_object());

    let username = username.unwrap();
    let password = password.unwrap();
    
    let response = db.users_base_info.find_one(doc! {
      "username": username,
      "password": password
    }, None).await;

    if response.is_err() || response.unwrap().is_none() {
      return Err(());
    }
    else
    {
      sessions.lock().await.add_session(username.to_string()).await;
      return Ok(json!({
        "type": "login",
        "status": 200,
        "preserved": preserved
      }));
    }
  }

  async fn update_user_info(request : &Json, db : Arc<Db>, 
    session: Arc<Mutex<Session>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();

    let preserved = request.get("preserved").and_then(|p| p.as_object());

    let mut vector:Vec<String> = Vec::new();

    for (key, value) in content.iter() {
      match key.as_str() {
        "portrait" => {
          vector.push("portrait".to_string());
          session.lock().await.portrait = value.as_str().map(|s| s.to_string());
        },
        "cash" => {
          vector.push("cash".to_string());
          session.lock().await.cash = value.as_f64();
        },
        "income" => {
          vector.push("income".to_string());
          session.lock().await.income = value.as_f64();
        },
        "expenditure" => {
          vector.push("expenditure".to_string());
          session.lock().await.expenditure = value.as_f64();
        },
        "debt" => {
          vector.push("debt".to_string());
          session.lock().await.debt = value.as_f64();
        },
        "assets" => {
          vector.push("assets".to_string());
          session.lock().await.assets = value.as_f64();
        },
        _ => {panic!("Invalid item");}
      }
    }

    session.lock().await.update_to_db(db.clone(), &vector).await;

    return Ok(json!({
      "type": "update_user_info",
      "status": 200,
      "preserved": preserved,
    }));
  }

  async fn get_user_info(request : &Json, db : Arc<Db>, 
    session: Arc<Mutex<Session>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();

    let preserved = request.get("preserved").and_then(|p| p.as_object());

    let mut vector:Vec<String> = Vec::new();

    for (key, value) in content.iter() {
      match key.as_str() {
        "portrait" => {
          vector.push("portrait".to_string());
          session.lock().await.portrait = value.as_str().map(|s| s.to_string());
        },
        "cash" => {
          vector.push("cash".to_string());
          session.lock().await.cash = value.as_f64();
        },
        "income" => {
          vector.push("income".to_string());
          session.lock().await.income = value.as_f64();
        },
        "expenditure" => {
          vector.push("expenditure".to_string());
          session.lock().await.expenditure = value.as_f64();
        },
        "debt" => {
          vector.push("debt".to_string());
          session.lock().await.debt = value.as_f64();
        },
        "assets" => {
          vector.push("assets".to_string());
          session.lock().await.assets = value.as_f64();
        },
        _ => {panic!("Invalid item");}
      }
    }

    session.lock().await.retrive_from_db(db.clone(), &vector).await;

    let mut content =  serde_json::json!({});

    for item in vector {
      match item.as_str() {
        "portrait" => {
          content["portrait"] = session.
          lock().await.portrait.as_ref().map(|s| json!(s)).unwrap_or(json!(null));
        },
        "cash" => {
          content["cash"] = session.
          lock().await.cash.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "income" => {
          content["income"] = session.
          lock().await.income.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "expenditure" => {
          content["expenditure"] = session.
          lock().await.expenditure.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "debt" => {
          content["debt"] = session.
          lock().await.debt.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "assets" => {
          content["assets"] = session.
          lock().await.assets.map(|s| json!(s)).unwrap_or(json!(null));
        }
        _ => {panic!("Invalid item");}
      }
    }

    return Ok(json!({
      "type": "get_user_info",
      "status": 200,
      "preserved": preserved,
      "content": content
    }));
  }

  async fn estimate_score_worker(request : &Json, db : Arc<Db>, session : Arc<Mutex<Session>>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved").and_then(|p| p.as_object());

    session.lock().await.retrive_from_db(db.clone(), &FINANCIAL_FILEDS).await;
    let score = session.lock().await.estimate_score();
    return Ok(json!({
      "type": "estimate_score",
      "status": 200,
      "preserved": preserved,
      "content": {
        "score": score
      }
    }));
  }

  async fn submit_market_post(request : &Json, db : Arc<Db>, session : Arc<Mutex<Session>>)
  -> Result<Json, ()>
  {
    let preserved = request.get("preserved").and_then(|p| p.as_object());
    let content = request.get("content");
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
  
    let post_type = content.get("type").and_then(|t| t.as_str());
    let poster = content.get("poster").and_then(|c| c.as_str());
    let amount = content.get("amount").and_then(|a| a.as_f64());
    let interest = content.get("interest").and_then(|i| i.as_f64());
    let period = content.get("period").and_then(|p| p.as_i64());
    let method = content.get("method").and_then(|m| m.as_str());
    let description = content.get("description").and_then(|d| d.as_str());
    let extra = content.get("extra").and_then(|e| e.as_str());
    
    if post_type.is_none() || poster.is_none() ||
     amount.is_none() || interest.is_none() ||
      period.is_none() || method.is_none() || description.is_none() {
      return Err(());
    }
    let post_type = post_type.unwrap();
    let poster = poster.unwrap();
    let amount = amount.unwrap();
    let interest = interest.unwrap();
    let period = period.unwrap();
    let method = method.unwrap();
    let description = description.unwrap();

    if post_type != "lend" && post_type != "borrow" {
      return Err(());
    }
    let username = session.lock().await.username.clone();
    let entry = doc! {
      "username": username,
      "type": post_type,
      "poster": poster,
      "amount": amount,
      "interest": interest,
      "period": period,
      "method": method,
      "description": description,
      "extra": extra
    };

    let response = db.public_market.insert_one(entry, None).await;
    match response {
      Ok(_) => {
        return Ok(json!({
          "type": "submit_market_post",
          "status": 200,
          "preserved": preserved
        }));
      },
      Err(_) => {
        return Err(());
      }
        
    }
  }

  async fn handle_stream(mut stream : TcpStream, db : Arc<Db>,
    sessions : Arc<Mutex<session::Sessions>>)
  {
    let mut buf = [0; 1024];
    let mut session : Option<Arc<Mutex<Session>>> = None;
    let mut username : Option<String> = None;

    loop {
      println!("Reading");
      let n = stream.read(&mut buf).await;
      if n.is_err() {
        break;
      }
      let n = n.unwrap();
      println!("Read {} bytes", n);
      if n == 0 {
        break;
      }

      let request = String::from_utf8_lossy(&buf[..n]);
      
      let request_json: Result<Json, _> = serde_json::from_str(&request);
      let ok;

      if request_json.is_err()
      {
        ok = false;
      }
      else {
        let request_json = request_json.unwrap();
        let requset_type = request_json.get("type");
        if requset_type.is_none()
        {
          ok = false;
        }
        else
        {
          let request_type = requset_type.unwrap().as_str().unwrap();

          let response : Result<Json, ()> = match request_type {
            "register" => {
              Self::register_worker(&request_json, db.clone()).await
            }
            "login" => {
              let tmp_response = 
              Self::login_worker(&request_json, db.clone(), sessions.clone()).await;

              if tmp_response.is_ok() {
                let content = tmp_response.clone().unwrap();
                username = 
                content.get("username").and_then(|u| u.as_str())
                .map(|s| s.to_string());
                session = sessions.lock().await.get_session(username.as_ref().unwrap()).await;
              }
              else {
                session = None;
              }

              tmp_response
            }
            "update_user_info" => {
              if let Some(session) = session.clone()
              {
                Self::update_user_info(&request_json, db.clone(), session).await
              }
              else {
                Err(())
              }
            }
            "get_user_info" => {
              if let Some(session) = session.clone()
              {
                Self::get_user_info(&request_json, db.clone(), session).await
              }
              else {
                Err(())
              }
            }
            "estimate_score" => {
              if let Some(session) = session.clone()
              {
                Self::estimate_score_worker(&request_json, db.clone(), session).await
              }
              else {
                Err(())
              }
            }
            "submit_market_post" => {
              if let Some(session) = session.clone()
              {
                Self::submit_market_post(&request_json, db.clone(), session).await
              }
              else {
                Err(())
              }
            }
            _ => {
              Err(())
            }
          };
          if response.is_err()
          {
            ok = false;
          }
          else {
            let mut response = response.unwrap();
            response.as_object_mut().unwrap().
            insert(String::from("username"), json!(username.clone()));
            response.as_object_mut().unwrap().
            insert(String::from("time"), json!(chrono::Utc::now().timestamp()));
            
            let response = serde_json::to_string(&response).unwrap();
            stream.write_all(response.as_bytes()).await.unwrap();
            ok = true;
          }
        }
      }


      if !ok {
        let response = serde_json::json!({
          "status": 404,
        });
        let response = serde_json::to_string(&response).unwrap();
        stream.write_all(response.as_bytes()).await.unwrap();
      }
    }

    println!("Connection closed");

  }

  pub async fn run(mut self) {
    self.initialize().await;

    tokio::spawn(Self::clean_outdated_sessions(self.sessions.clone()));

    loop {
      println!("Waiting for connection");
      let (stream, _) = self.listener.as_mut().unwrap().accept().await.unwrap();
      println!("New connection");        // Clone the Arc<Mutex<Sessions>> here
      let sessions_clone = self.sessions.clone();

      tokio::spawn(
          // Now you can call handle_stream with the cloned Arc<Mutex<Sessions>>
          Self::handle_stream(stream, self.db.clone().unwrap(), sessions_clone)
      );
    }
  }

  pub fn new(server_config : &ServerConfig) -> MainServer {
    MainServer {
      config: server_config.clone(),
      db: None,
      listener: None,
      sessions: Arc::new(Mutex::new(session::Sessions::new()))
    }
  }

  async fn clean_outdated_sessions(sessions : Arc<Mutex<session::Sessions>>)
  {
    loop {
      tokio::time::sleep(Duration::from_secs(600)).await;
      sessions.lock().await.clean_outdated_sessions().await;
    }
  }
}