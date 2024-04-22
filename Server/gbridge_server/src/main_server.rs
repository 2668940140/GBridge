mod data_sturct;
pub mod config;

use std::sync::{Arc, Mutex};
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::spawn;

use self::config::ServerConfig;

pub struct MainServer
{
    config: ServerConfig,
    request_queue: Arc<Mutex<data_sturct::RequestQueue>>,
    response_queue: Arc<Mutex<data_sturct::ResponseQueue>>
}

impl MainServer {
    async fn handle_request(mut stream: TcpStream, request_queue: Arc<Mutex<data_sturct::RequestQueue>>) {
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
        let port = self.config.port;
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port)).await.unwrap();
        println!("Server started at {}", port);

        loop {
            let (stream, _) = listener.accept().await.unwrap();
            spawn(MainServer::handle_request(stream, self.request_queue.clone()));
        }
    }

    pub fn new(server_config : &ServerConfig) -> MainServer {
        MainServer {
            request_queue: Arc::new(Mutex::new(data_sturct::RequestQueue::new())),
            response_queue: Arc::new(Mutex::new(data_sturct::ResponseQueue::new())),
            config: server_config.clone()
        }
    }
}