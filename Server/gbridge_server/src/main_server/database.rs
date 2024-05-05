use crate::main_server::data_structure::*;

use mongodb::{ 
	bson::{Document, doc},
	Client,
	Collection,
  Database
};

pub struct Db
{
  client: Client,
  user_db : Database,
  users_base_info : Collection<Document>
}

impl Db {
  pub async fn new(uri : & String) -> Db {
    println!("Connecting to database. Please wait...");
    let client = Client::with_uri_str(uri).await.unwrap();
    let user_db = client.database("users");
    let users_base_info = user_db.collection("base_info");
    
    println!("Connected to database successfully!");
    Db {
      client: client,
      user_db: user_db,
      users_base_info: users_base_info
    }
  }

  pub async fn get_usr_by_name(&self, username : &String) -> Option<User> {
    let filter = doc! { "username": username };
    let result = self.users_base_info.find_one(filter, None).await.unwrap();
    match result {
      Some(doc) => {
        let user = User {
          username: doc.get_str("username").unwrap().to_string(),
          password: doc.get_str("password").unwrap().to_string()
        };
        Some(user)
      },
      None => None
    }
  }

  pub async fn insert_user(&self, user : &User) {
    assert!(self.get_usr_by_name(&user.username).await.is_none());
    self.users_base_info.insert_one(doc! {
      "username": &user.username,
      "password": &user.password
    }, None).await.unwrap();
  }
}
