use std::{option, sync::Arc};
use tokio::{io::AsyncWriteExt, net::TcpStream, sync::Mutex};
use crate::main_server::Json;

pub struct Adviser {
  pub stream: Option<Arc<Mutex<TcpStream>>>,
  pub waiting_msg: Vec<Json>
}
impl Adviser {
  pub fn new() -> Self {
    Self {
      stream: None,
      waiting_msg: Vec::new()
    }
  }
  pub async fn send_waiting_msg(&mut self) {
    if let Some(stream) = &self.stream {
      for msg in &self.waiting_msg {
        let mut stream = stream.lock().await;
        stream.write_all(msg.to_string().as_bytes()).await.unwrap();
      }
      self.waiting_msg.clear();
    }
    
  }
}