use config::{Config, File, FileFormat};

#[derive(Clone)]
pub struct ServerConfig {
  pub port: i64,
  pub db_uri: String,
  pub openai_key : String,
  pub adviser_key : String
}

impl ServerConfig {
  pub fn load(config_filename : String) -> ServerConfig {
    let settings = Config::builder()
    .add_source(File::new(&config_filename, FileFormat::Ini))
    .build().unwrap();

    let port = settings.get::<i64>("server.port").unwrap();
    let db_uri = settings.get::<String>("server.db_url").unwrap();
    let openai_key = settings.get::<String>("server.openai_key").unwrap();
    let adviser_key = settings.get::<String>("server.adviser_key").unwrap();

    ServerConfig{
      port: port,
      db_uri: db_uri,
      openai_key : openai_key,
      adviser_key : adviser_key
    }
  }
}