mod config;

fn main() {
    let server_config = config::ServerConfig::load("../../config.ini".to_string());
    print!("Server port: {}", server_config.port);
}