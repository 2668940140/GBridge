use config::{Config, File, FileFormat};

pub struct ServerConfig {
    pub port: i64,
}

impl ServerConfig {
    pub fn load(config_filename : String) -> ServerConfig {
        let settings = Config::builder()
        .add_source(File::new(&config_filename, FileFormat::Ini))
        .build().unwrap();

        let port = settings.get::<i64>("server.port").unwrap();

        ServerConfig{
            port: port,
        }
    }
}