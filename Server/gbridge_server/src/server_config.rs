use config::{Config, File, FileFormat};

#[derive(Clone)]
pub struct ServerConfig {
  pub port: i64,
  pub db_uri: String
}

impl ServerConfig {
  pub fn load(config_filename : String) -> ServerConfig {
    let settings = Config::builder()
    .add_source(File::new(&config_filename, FileFormat::Ini))
    .build().unwrap();

    let port = settings.get::<i64>("server.port").unwrap();
    let db_uri = settings.get::<String>("server.db_url").unwrap();

    ServerConfig{
      port: port,
      db_uri: db_uri
    }
  }
}