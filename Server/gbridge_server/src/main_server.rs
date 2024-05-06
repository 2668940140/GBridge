
mod data_structure;
mod utils;
mod database;
use crate::ServerConfig;
use data_structure::{RequestQueue, ResponseQueue};

use std::sync::{Arc, Mutex};
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::spawn;


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

  async fn handle_request(mut stream: TcpStream) {
    let mut buffer = [0; 512];
    loop {
      match stream.read(&mut buffer).await {
          Ok(bytes_read) => {
              if bytes_read == 0 {
                  return; // Connection was closed
              }
              // Echo the data back
              if let Err(e) = stream.write_all(&buffer[0..bytes_read]).await {
                  eprintln!("Failed to send data: {}", e);
                  return;
              }
          }
          Err(e) => {
              eprintln!("Failed to read data: {}", e);
              return;
          }
      }
  }
  }

  pub async fn run(&mut self) {
    self.initialize().await;

    loop {
      let (stream, _) = self.listener.as_ref().unwrap().accept().await.unwrap();
      spawn(MainServer::handle_request(stream));
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