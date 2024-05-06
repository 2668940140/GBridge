
mod data_structure;
mod utils;
mod database;
mod session;
use crate::main_server::data_structure::Response;
use crate::ServerConfig;
use config::Value;
use data_structure::{RequestQueue, ResponseQueue, Json};
use futures::future::err;
use mongodb::bson::doc;
use serde_json::json;

use std::f64::consts::E;
use std::sync::{Arc, Mutex};
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::spawn;

use self::data_structure::Request;

pub struct MainServer
{
  config: ServerConfig,
  request_queue: Arc<Mutex<RequestQueue>>,
  response_queue: Arc<Mutex<ResponseQueue>>,
  db : Option<database::Db>,
  listener : Option<TcpListener>
}

impl MainServer {
  async fn initialize(&mut self)
  {
    self.db = Some(database::Db::new(&self.config.db_uri).await);
    self.listener = Some(
      TcpListener::bind(format!("127.0.0.1:{}", self.config.port))
        .await.unwrap());
    println!("Server started at {}", self.config.port);
  }

  async fn register_worker(&mut self ,request : &Json) -> Result<Json,()>
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
    let verificationcode = content.get("verificationcode").and_then(|v| v.as_str());

    if email.is_none() || username.is_none() || password.is_none() || verificationcode.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved").and_then(|p| p.as_object());


    let email = email.unwrap();
    let username = username.unwrap();
    let password = password.unwrap();
    let verificationcode = verificationcode.unwrap();

    let db = self.db.as_ref().unwrap();
    let response = db.users_base_info.insert_one(doc! {
      "email": email,
      "username": username,
      "password": password,
      "verificationcode": verificationcode
    }, None).await;
    if response.is_err() {
      return Err(());
    }
    else
    {
      return Ok(json!({
        "status": 200,
        "user": username,
        "sessionExpired": false,
        "preserved": preserved,
        "content": {
            "success": true, 
        }
      }));
    }
  }

  async fn handle_stream(&mut self, mut stream : TcpStream)
  {
    let mut buf = [0; 1024];
    loop {
      let n = stream.read(&mut buf).await.unwrap();
      if n == 0 {
        return;
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
          let response : Result<Json, ()> = match request_type {
            "register" => {
              self.register_worker(&request_json).await
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
          "status": "error",
        });
        let response = serde_json::to_string(&response).unwrap();
        stream.write_all(response.as_bytes()).await.unwrap();
      }
    }
    
  }


  pub async fn run(&mut self) {
    self.initialize().await;

    loop {
      let (mut stream, _) = self.listener.as_ref().unwrap().accept().await.unwrap();
      self.handle_stream(stream);
    }
  }

  pub fn new(server_config : &ServerConfig) -> MainServer {
    MainServer {
      request_queue: Arc::new(Mutex::new(RequestQueue::new())),
      response_queue: Arc::new(Mutex::new(ResponseQueue::new())),
      config: server_config.clone(),
      db: None,
      listener: None
    }
  }
}