mod data_structure;
mod utils;
mod database;
mod session;
mod workers;

use crate::ServerConfig;
use chrono::Utc;
use data_structure::Json;
use futures::FutureExt;
use mongodb::bson::{bson, doc};
use serde_json::json;
use tokio::signal::ctrl_c;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use chatgpt::client::ChatGPT;

use self::database::Db;
use self::session::Session;
use std::time::Duration;

pub struct MainServer
{
  config: ServerConfig,
  db : Option<Arc<database::Db>>,
  listener : Option<TcpListener>,
  sessions: Arc<Mutex<session::Sessions>>,
  gptbot : Option<Arc<ChatGPT>>,
  adviser : Arc<Mutex<Option<Arc<Mutex<TcpStream>>>>>
}

impl MainServer {
  async fn initialize(&mut self)
  {
    self.db = Some(Arc::new(database::Db::new(&self.config.db_uri).await));
    self.listener = Some(
      TcpListener::bind(format!("0.0.0.0:{}", self.config.port))
        .await.unwrap());
    let bot = ChatGPT::new(self.config.openai_key.clone()).unwrap();
    self.gptbot = Some(Arc::new(bot));
    println!("Server started at {}", self.config.port);
  }

  async fn handle_adviser_stream(db : Arc<Db>,
    sessions : Arc<Mutex<session::Sessions>>,
    adviser : Arc<Mutex<Option<Arc<Mutex<TcpStream>>>>>)
  {
    println!("Adviser connected");

    let mut buf = [0; 1024];
    loop {
        tokio::time::sleep(Duration::from_secs(1)).await;
        let mut adviser = adviser.lock().await;
        if adviser.is_none() {
          break;
        }
        let adviser = adviser.as_mut().unwrap();
        let mut adviser = adviser.lock().await;
        let n = adviser.read(&mut buf).await;
        if n.is_err() {
          break;
        }
        let n = n.unwrap();
        if n == 0 {
          break;
        }
        let received : Json = serde_json::from_slice(&buf[..n]).unwrap();
        let username = received.get("username").and_then(|x| x.as_str());
        let message = received.get("message").and_then(|x| x.as_str());
        if username.is_none() || message.is_none() {
          continue;
        }
        let username = username.unwrap();
        let message = message.unwrap();
        let session = sessions.lock().await.get_session(username).await;
        if session.is_none() {
          // update db
          let response = db.users_adviser_conversation.find_one
          (doc! {"username" : username} ,None).await;
          if response.is_err() {
            continue;
          }
          let response = response.unwrap();
          if response.is_none() {
            let result = db.users_adviser_conversation.insert_one(
                doc! {"username" : username, 
                "content" : [message.to_string()]
                }, None).await;
            result.unwrap();
          }
          else {
            let entry = bson!({"role": "adviser",
            "msg":message.to_string(),
            "time": Utc::now().to_rfc3339()});
            let result = db.users_adviser_conversation.update_one(
              doc! {"username" : username},
              doc! {"$push": {"content": entry}},
              None).await;
            result.unwrap();
          }
        }
        else 
        {
          // update session
          session.unwrap().lock().await.append_adviser_conversation(message.to_string(), 
          "adviser".to_string()).await;   
        }
    }
  }

  async fn handle_stream(mut stream : TcpStream, db : Arc<Db>,
    sessions : Arc<Mutex<session::Sessions>>,
    bot: Arc<ChatGPT>,
    adviser : Arc<Mutex<Option<Arc<Mutex<TcpStream>>>>>,
    adviser_key : String)
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
                Self::update_user_info(&request_json, session).await
              }
              else {
                Err(())
              }
            }
            "get_user_info" => {
              if let Some(session) = session.clone()
              {
                Self::get_user_info_worker(&request_json, session).await
              }
              else {
                Err(())
              }
            }
            "estimate_score" => {
              if let Some(session) = session.clone()
              {
                Self::estimate_score_worker(&request_json, session).await
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
            "send_message_to_bot" => {
              if let Some(session) = session.clone()
              {
                Self::send_message_to_bot_worker(&request_json, session, bot.clone()).await
              }
              else {
                Err(())
              }
            }
            "adviser_login" =>
            {
              let key = request_json.get("key").and_then(|x| x.as_str());
              if key.is_none()
              {
                Err(())
              }
              else {
                let key = key.unwrap();
                if key == adviser_key
                {
                  adviser.lock().await.replace(Arc::new(Mutex::new(stream)));
                  tokio::spawn(
                  Self::handle_adviser_stream(db.clone(), 
                  sessions.clone(), adviser.clone()));
                  return;
                }
                else {
                  Err(())
                }
              }
            }
            "get_adviser_conversation"=> {
              if let Some(session) = session.clone()
              {
                Self::get_adviser_conversation_worker(&request_json, session).await
              }
              else {
                Err(())
              }
            }
            "send_message_to_adviser"=>
            {
              if let Some(session) = session.clone()
              {
                Self::send_message_to_adviser_worker(&request_json, session, adviser.clone()).await
              }
              else {
                Err(())
              }
            }
            "get_user_posts"=>
            {
              if let Some(session) = session.clone()
              {
                Self::get_user_posts_worker(&request_json, session, db.clone()).await
              }
              else {
                Err(())
              }
            }
            "get_user_deals"=>
            {
              if let Some(session) = session.clone()
              {
                Self::get_user_deals_worker(&request_json, session, db.clone()).await
              }
              else {
                Err(())
              }
            }
            "complete_deal"=>
            {
              if let Some(session) = session.clone()
              {
                Self::complete_deal_worker(&request_json, db.clone()).await
              }
              else {
                Err(())
              }
            }
            "send_notification"=>
            {
              if let Some(session) = session.clone()
              {
                Self::send_notification_worker(&request_json, session, db.clone()).await
              }
              else {
                Err(())
              }
            }
            "get_notification"=>
            {
              if let Some(session) = session.clone()
              {
                Self::get_notification_worker(&request_json, session, db.clone()).await
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
        // ...

        tokio::select! {
          Ok((stream, _)) = self.listener.as_mut().unwrap().accept() => {
            println!("New connection");
            let sessions_clone = self.sessions.clone();

            tokio::spawn(
              Self::handle_stream(stream, self.db.clone().unwrap(), sessions_clone,
              self.gptbot.clone().unwrap(),
              self.adviser.clone(),
              self.config.adviser_key.clone())
            );
          }
          _ = ctrl_c().fuse() => {
            println!("Ctrl+C received, stopping server");
            self.stop().await;
            break;
          }
            }
        }
    }
  

  pub fn new(server_config : &ServerConfig) -> MainServer {
    MainServer {
      config: server_config.clone(),
      db: None,
      listener: None,
      sessions: Arc::new(Mutex::new(session::Sessions::new())),
      gptbot: None,
      adviser : Arc::new(Mutex::new(None))
    }
  }

  async fn clean_outdated_sessions(sessions : Arc<Mutex<session::Sessions>>)
  {
    loop {
      tokio::time::sleep(Duration::from_secs(600)).await;
      sessions.lock().await.clean_outdated_sessions().await;
    }
  }

  pub async fn stop(&mut self)
  {
    self.sessions.lock().await.clear_sessions().await;
  }
}