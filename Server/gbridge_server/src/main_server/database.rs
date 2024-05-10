use mongodb::{ 
	bson::Document,
	Client,
	Collection,
  Database
};

pub struct Db
{
  pub client: Client,
  pub users_db : Database,
  pub users_base_info : Collection<Document>,
  pub users_bot_evaluation : Collection<Document>,
  pub users_bot_conversation : Collection<Document>,
  pub users_adviser_conversation : Collection<Document>,
  pub public_db : Database,
  pub public_market : Collection<Document>,
  pub public_deals : Collection<Document>,
  pub public_history_market : Collection<Document>,
  pub public_history_deals : Collection<Document>,
}

impl Db {
  pub async fn new(uri : & String) -> Db {
    println!("Connecting to database. Please wait...");
    let client = Client::with_uri_str(uri).await.unwrap();
    let user_db = client.database("users");
    let users_base_info = user_db.collection("base_info");
    let users_bot_evaluation = user_db.collection("bot_evaluation");
    let users_bot_conversation = user_db.collection("bot_conversation");
    let users_adviser_conversation = user_db.collection("adviser_conversation");
    let public_db = client.database("public");
    let public_market = public_db.collection("market");
    let public_deals = public_db.collection("deals");
    let public_history_market = public_db.collection("history_market");
    let public_history_deals = public_db.collection("history_deals");
    println!("Connected to database successfully!");
    Db {
      client: client,
      users_db: user_db,
      users_base_info: users_base_info,
      users_bot_evaluation: users_bot_evaluation,
      users_bot_conversation : users_bot_conversation,
      users_adviser_conversation : users_adviser_conversation,
      public_db: public_db,
      public_market: public_market,
      public_deals: public_deals,
      public_history_market: public_history_market,
      public_history_deals: public_history_deals, 
    }
  }
}
