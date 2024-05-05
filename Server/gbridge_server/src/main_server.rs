
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

  async fn handle_request(mut stream: TcpStream, request_queue: Arc<Mutex<RequestQueue>>) {
    let mut buffer = [0; 512];
    match stream.read(&mut buffer).await {
      Ok(0) => {
        // The stream has been closed
        println!("Connection closed");
      }
      Ok(n) => {
        println!("Request: {}", String::from_utf8_lossy(&buffer[..n]));
      }
      Err(e) => {
        eprintln!("Failed to read from socket: {}", e);
      }
    }
  }

  pub async fn run(&mut self) {
    self.initialize().await;

    loop {
      let (stream, _) = self.listener.as_ref().unwrap().accept().await.unwrap();
      spawn(MainServer::handle_request(stream, self.request_queue.clone()));
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