
mod data_structure;
mod utils;
mod database;
mod session;
use crate::main_server::data_structure::Response;
use crate::ServerConfig;
use data_structure::{RequestQueue, ResponseQueue, Json};
use serde_json::json;

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

  async fn register_worker(&mut self ,request : &Json) -> Json
  {
    json!({
      "Message": "You send a register request"
    })
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
          let response: Json = match request_type {
            "register" => {
              self.register_worker(&request_json).await
            }
            _ => {
              let response = serde_json::json!({
                "status": "error",
              });
              response
            }
          };
          let response = serde_json::to_string(&response).unwrap();
          stream.write_all(response.as_bytes()).await.unwrap();
          ok = true;
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