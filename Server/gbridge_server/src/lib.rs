pub mod main_server;

pub async fn quick_run() {
    let server_config = main_server::config::ServerConfig::load("../../config.ini".to_string());
    let mut server = main_server::MainServer::new(&server_config);
    server.run().await;
}