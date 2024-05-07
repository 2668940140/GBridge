#[macro_use]
extern crate lazy_static;

mod main_server;
mod server_config;
use server_config::ServerConfig;

#[tokio::main]
async fn main(){
  let server_config = ServerConfig::load("../../config.ini".to_string());
  let server = main_server::MainServer::new(&server_config);
  server.run().await;
}