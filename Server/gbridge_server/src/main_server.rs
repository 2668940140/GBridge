mod data_structure;
mod utils;
mod database;
mod session;
mod workers;
pub mod chatter;
use crate::ServerConfig;
use data_structure::Json;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

use self::database::Db;
use self::session::Session;
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
      TcpListener::bind(format!("0.0.0.0:{}", self.config.port))
        .await.unwrap());
    println!("Server started at {}", self.config.port);
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
              Self::login_worker(&request_json, db.clone(), sessions.clone(),
              &mut username).await;
              println!("username {} logined", username.clone().unwrap_or("None".to_string()));
              if tmp_response.is_ok() {
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
                Self::get_user_info_worker(&request_json, db.clone(), session).await
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
                Self::submit_market_post_worker(&request_json, db.clone(), session).await
              }
              else {
                Err(())
              }
            }
            "get_market_posts" => {
              if session.is_some()
              {
                Self::get_market_posts_worker(&request_json, db.clone()).await
              }
              else {
                Err(())
              }
            }
            "make_deal" => {
              if let Some(session) = session.clone()
              {
                Self::make_deal_worker(&request_json, db.clone(), session).await
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
            insert(String::from("time"), json!(chrono::Utc::now().to_rfc3339()));
            
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