use std::sync::Arc;
use serde_json::json;
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

    let content = serde_json::to_string(&self.waiting_msg).unwrap();
    let response = json!(
      {
        "type": "adviser_message",
        "status":200,
        "content": content
      }
    );
    if let Some(stream) = &self.stream {
      let mut stream = stream.lock().await;
      stream.write_all(response.to_string().as_bytes()).await.unwrap();
    }
    
  }
}