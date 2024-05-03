mod main_server;
mod server_config;
pub use server_config::ServerConfig;

pub async fn quick_run() {
    let server_config = server_config::ServerConfig::load("../../config.ini".to_string());
    let mut server = main_server::MainServer::new(&server_config);
    server.run().await;
}