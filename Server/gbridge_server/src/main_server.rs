
mod data_structure;
mod utils;
mod database;
mod session;
use crate::ServerConfig;
use data_structure::{RequestQueue, ResponseQueue, Json};
use mongodb::bson::{doc, ser};
use serde_json::json;
use tokio::sync::SetError;

use std::sync::Arc;
use tokio::sync::{Mutex};
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

use self::database::Db;
use self::session::Session;

pub struct MainServer
{
  config: ServerConfig,
  request_queue: Arc<Mutex<RequestQueue>>,
  response_queue: Arc<Mutex<ResponseQueue>>,
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
        "user": username,
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
      sessions.lock().await.add_session(username.to_string());
      return Ok(json!({
        "type": "login",
        "status": 200,
        "user": username,
        "preserved": preserved
      }));
    }
  }

  async fn logout_worker(request : &Json, db : Arc<Db>, 
    sessions :Arc<Mutex<session::Sessions>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let username = content.get("username").and_then(|u| u.as_str());

    if username.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved").and_then(|p| p.as_object());

    let username = username.unwrap();
    
    sessions.lock().await.remove_session(username);

    return Ok(json!({
      "type": "logout",
      "status": 200,
      "user": username,
      "preserved": preserved
    }));
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
    let username = content.get("username").and_then(|u| u.as_str());

    if username.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved").and_then(|p| p.as_object());

    let username = username.unwrap();
    let mut vector:Vec<String> = Vec::new();

    for (key, value) in content.iter() {
      match key.as_str() {
        "portrait" => {
          vector.push("portrait".to_string());
          session.lock().await.portrait = value.as_str().map(|s| s.to_string());
        },
        "money" => {
          vector.push("money".to_string());
          session.lock().await.money = value.as_i64();
        },
        _ => {panic!("Invalid item");}
      }
    }

    session.lock().await.update_to_db(db.clone(), &vector).await;

    return Ok(json!({
      "type": "update_user_info",
      "status": 200,
      "user": username,
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
    let username = content.get("username").and_then(|u| u.as_str());

    if username.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved").and_then(|p| p.as_object());

    let username = username.unwrap();
    let mut vector:Vec<String> = Vec::new();

    for (key, value) in content.iter() {
      match key.as_str() {
        "portrait" => {
          vector.push("portrait".to_string());
          session.lock().await.portrait = value.as_str().map(|s| s.to_string());
        },
        "money" => {
          vector.push("money".to_string());
          session.lock().await.money = value.as_i64();
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
        "money" => {
          content["money"] = session.
          lock().await.money.map(|s| json!(s)).unwrap_or(json!(null));
        },
        _ => {panic!("Invalid item");}
      }
    }

    return Ok(json!({
      "type": "get_user_info",
      "status": 200,
      "user": username,
      "preserved": preserved,
      "content": content
    }));
  }


  async fn handle_stream(mut stream : TcpStream, db : Arc<Db>,
    sessions : Arc<Mutex<session::Sessions>>)
  {
    
    let mut buf = [0; 1024];
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
      let mut ok = true;
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
          let user_name = 
          request_json.get("content").and_then(|c| c.get("username")).
          and_then(|u| u.as_str());

          let session = sessions.lock().await.get_session(user_name.unwrap());

          let response : Result<Json, ()> = match request_type {
            "register" => {
              Self::register_worker(&request_json, db.clone()).await
            }
            "login" => {
              Self::login_worker(&request_json, db.clone(), sessions.clone()).await
            }
            "logout" => {
              Self::logout_worker(&request_json, db.clone(), sessions.clone()).await
            }
            "update_user_info" => {
              
              Self::update_user_info(&request_json, db.clone(),
              session.unwrap()
            ).await
            }
            "get_user_info" => {
              Self::get_user_info(&request_json, db.clone(), session.unwrap()).await
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
            let response = response.unwrap();
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
  }

  pub async fn run(mut self) {
    self.initialize().await;

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
      request_queue: Arc::new(Mutex::new(RequestQueue::new())),
      response_queue: Arc::new(Mutex::new(ResponseQueue::new())),
      config: server_config.clone(),
      db: None,
      listener: None,
      sessions: Arc::new(Mutex::new(session::Sessions::new()))
    }
  }
}