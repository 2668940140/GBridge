mod main_server;

use main_server::config::ServerConfig;

#[tokio::main]
async fn main() {
    let server_config = ServerConfig::load("../../config.ini".to_string());

    let mut server = main_server::MainServer::new(&server_config);

    server.run().await;
}