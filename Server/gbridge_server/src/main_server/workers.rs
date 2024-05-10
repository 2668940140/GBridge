use core::{borrow, fmt};
use std::clone;
use std::sync::Arc;

use crate::main_server;
use crate::main_server::data_structure::Json;
use chrono::{FixedOffset, Utc};
use futures::StreamExt;
use mongodb::bson::{self, doc, DateTime, Document};
use mongodb::Database;
use serde_json::json;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use chatgpt::client::ChatGPT;

use super::database::Db;
use super::session::{self, Session, FINANCIAL_FILEDS};

impl main_server::MainServer
{
  pub async fn register_worker(request : &Json, db : Arc<Db>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let email = content.get("email").and_then(|e| e.as_str());
    let username = content.get("username").and_then(|u| u.as_str());
    let password = content.get("password").and_then(|p| p.as_str());

    if email.is_none() || username.is_none() || password.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved");


    let email = email.unwrap();
    let username = username.unwrap();
    let password = password.unwrap();

    let finding = db.users_base_info.find_one(doc! {
      "username": username
    }, None).await;
    if finding.is_ok() && finding.unwrap().is_some() {
      return Err(());
    }
    let finding = db.users_base_info.find_one(doc! {
      "email": email
    }, None).await;
    if finding.is_ok() && finding.unwrap().is_some() {
      return Err(());
    }

    let response = db.users_base_info.insert_one(doc! {
      "email": email,
      "username": username,
      "password": password,
      "time": chrono::Utc::now().to_rfc3339()
    }, None).await;

    if response.is_err() {
      return Err(());
    }
    else
    {
      return Ok(json!({
        "type": "register",
        "status": 200,
        "preserved": preserved,
      }));
    }
  }

  pub async fn login_worker(request : &Json, db : Arc<Db>, 
  sessions :Arc<Mutex<session::Sessions>>,
  outer_username : &mut Option<String>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let username = content.get("username").and_then(|u| u.as_str());
    let password = content.get("password").and_then(|p| p.as_str());

    if username.is_none() || password.is_none() {
      return Err(());
    }

    let preserved = request.get("preserved");

    let username = username.unwrap();
    let password = password.unwrap();
    
    let response = db.users_base_info.find_one(doc! {
      "username": username,
      "password": password
    }, None).await;

    if response.is_err() || response.unwrap().is_none() {
      return Err(());
    }
    else
    {
      sessions.lock().await.add_session(username.to_string(), db.clone()).await;
      *outer_username = Some(username.to_string());
      return Ok(json!({
        "type": "login",
        "status": 200,
        "preserved": preserved
      }));
    }
  }

  pub async fn update_user_info(request : &Json, 
    session: Arc<Mutex<Session>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();

    let preserved = request.get("preserved");

    let mut vector:Vec<String> = Vec::new();

    for (key, value) in content.iter() {
      match key.as_str() {
        "portrait" => {
          vector.push("portrait".to_string());
          session.lock().await.portrait = value.as_str().map(|s| s.to_string());
        },
        "cash" => {
          vector.push("cash".to_string());
          session.lock().await.cash = value.as_f64();
        },
        "income" => {
          vector.push("income".to_string());
          session.lock().await.income = value.as_f64();
        },
        "expenditure" => {
          vector.push("expenditure".to_string());
          session.lock().await.expenditure = value.as_f64();
        },
        "debt" => {
          vector.push("debt".to_string());
          session.lock().await.debt = value.as_f64();
        },
        "assets" => {
          vector.push("assets".to_string());
          session.lock().await.assets = value.as_f64();
        },
        _ => {panic!("Invalid item");}
      }
    }

    session.lock().await.update_to_db(&vector).await;

    return Ok(json!({
      "type": "update_user_info",
      "status": 200,
      "preserved": preserved,
    }));
  }

  pub async fn get_user_info_worker(request : &Json,
    session: Arc<Mutex<Session>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_array());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();

    let preserved = request.get("preserved");

    let vector:Vec<String> = content.iter().map(|c| c.as_str().unwrap().to_string()).collect();

    session.lock().await.retrive_from_db(&vector).await;

    let mut content =  serde_json::json!({});

    for item in vector {
      match item.as_str() {
        "portrait" => {
          content["portrait"] = session.
          lock().await.portrait.as_ref().map(|s| json!(s)).unwrap_or(json!(null));
        },
        "cash" => {
          content["cash"] = session.
          lock().await.cash.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "income" => {
          content["income"] = session.
          lock().await.income.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "expenditure" => {
          content["expenditure"] = session.
          lock().await.expenditure.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "debt" => {
          content["debt"] = session.
          lock().await.debt.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "assets" => {
          content["assets"] = session.
          lock().await.assets.map(|s| json!(s)).unwrap_or(json!(null));
        },
        "email"=> {
          content["email"] = session.
          lock().await.email.as_ref().map(|s| json!(s)).unwrap_or(json!(null));
        }
        _ => {panic!("Invalid item");}
      }
    }

    return Ok(json!({
      "type": "get_user_info",
      "status": 200,
      "preserved": preserved,
      "content": content
    }));
  }

  pub async fn estimate_score_worker(request : &Json, session : Arc<Mutex<Session>>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");

    session.lock().await.retrive_from_db(&FINANCIAL_FILEDS).await;
    let score = session.lock().await.estimate_score();
    return Ok(json!({
      "type": "estimate_score",
      "status": 200,
      "preserved": preserved,
      "content": {
        "score": score
      }
    }));
  }

  pub async fn submit_market_post_worker(request : &Json, db : Arc<Db>, session : Arc<Mutex<Session>>)
  -> Result<Json, ()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content");
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
  
    let post_type = content.get("post_type").and_then(|t| t.as_str());
    let poster = content.get("poster").and_then(|c| c.as_str());
    let amount = content.get("amount").and_then(|a| a.as_f64());
    let interest = content.get("interest").and_then(|i| i.as_f64());
    let period = content.get("period").and_then(|p| p.as_i64());
    let method = content.get("method").and_then(|m| m.as_str());
    let description = content.get("description").and_then(|d| d.as_str());
    let extra = content.get("extra").and_then(|e| e.as_str());
    
    if post_type.is_none() || poster.is_none() ||
     amount.is_none() || interest.is_none() ||
      period.is_none() || method.is_none() || description.is_none() {
      return Err(());
    }
    let post_type = post_type.unwrap();
    let poster = poster.unwrap();
    let amount = amount.unwrap();
    let interest = interest.unwrap();
    let period = period.unwrap();
    let method = method.unwrap();
    let description = description.unwrap();

    if post_type != "lend" && post_type != "borrow" {
      return Err(());
    }
    let username = session.lock().await.username.clone();
    let entry = doc! {
      "username": username,
      "post_type": post_type,
      "poster": poster,
      "amount": amount,
      "interest": interest,
      "period": period,
      "method": method,
      "description": description,
      "extra": extra,
      "created_time": chrono::Utc::now().to_rfc3339(),
    };

    let response = db.public_market.insert_one(entry, None).await;
    match response {
      Ok(_) => {
        return Ok(json!({
          "type": "submit_market_post",
          "status": 200,
          "preserved": preserved
        }));
      },
      Err(_) => {
        return Err(());
      }
        
    }
  }

  pub async fn get_market_posts_worker(request : &Json, db : Arc<Db>) -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content").and_then(|f| f.as_str());
    let mut filter = doc! {};
    if content.is_some()
    {
      let content = content.unwrap();
      let content_bytes = content.as_bytes();
      let mut content_reader = std::io::Cursor::new(content_bytes);
      let content = bson::Document::from_reader(&mut content_reader);
      if content.is_err()
      {
        return Err(());
      }
      filter = content.unwrap();
    }

    let cursor = db.public_market.find(filter, None).await;
    if cursor.is_err() {
      return Err(());
    }
    let mut cursor = cursor.unwrap();
  
    let mut content = Vec::new();
    while let Some(result) = cursor.next().await {
      match result {
        Ok(doc) => {
          let doc = bson::to_bson(&doc).unwrap(); // Convert bson to json
          content.push(doc);
        }
        Err(e) => return Err(()),
      }
    }
  
    return Ok(json!({
      "type": "get_market_info",
      "status": 200,
      "preserved": preserved,
      "content": content // This is now a Vec<Json>
    }));
  }

  pub async fn make_deal_worker(request : &Json, db : Arc<Db>, session : Arc<Mutex<Session>>) 
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content");
  
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let post_id = content.get("post_id").and_then(|p| p.as_str());
    let dealer = content.get("dealer").and_then(|d| d.as_str());

    if post_id.is_none() || dealer.is_none(){
      return Err(());
    }

    let post_id = post_id.unwrap();
    let dealer = dealer.unwrap();

    let item = db.public_market.find_one(doc! {
      "_id": bson::oid::ObjectId::parse_str(post_id).unwrap()
    }, None).await;

    if item.is_err() {
      return Err(());
    }
    let item = item.unwrap();
    if item.is_none() {
      return Err(());
    }
    let item = item.unwrap();
    let poster_username = item.get("username").unwrap().as_str().unwrap();
    let post_type = item.get("post_type").unwrap().as_str().unwrap();
    let lender : String;
    let borrower : String;
    let lender_username : String;
    let borrower_username : String;
    if post_type == "lend" {
      lender = item.get("poster").unwrap().to_string();
      borrower = dealer.to_string();
      lender_username = poster_username.to_string();
      borrower_username = session.lock().await.username.clone();
    }
    else if post_type == "borrow" {
      lender = dealer.to_string();
      borrower = item.get("poster").unwrap().to_string();
      lender_username = session.lock().await.username.clone();
      borrower_username = poster_username.to_string();
    }
    else {
      panic!("invalid post type");
    }

    let entry = doc! {
      "leader": lender,
      "borrower": borrower,
      "amount": item.get("amount").unwrap().as_f64().unwrap(),
      "interest": item.get("interest").unwrap().as_f64().unwrap(),
      "period": item.get("period").unwrap().as_i64().unwrap(),
      "method": item.get("method").unwrap().as_str().unwrap(),
      "description": item.get("description").unwrap().as_str().unwrap(),
      "extra": item.get("extra").unwrap().as_str().unwrap(),
      "created_time": chrono::Utc::now().to_rfc3339(),
      "lender_username": lender_username,
      "borrower_username": borrower_username,
    };

    let response = db.public_deals.insert_one(entry, None).await;
    if response.is_err() {
      return Err(());
    }
    db.public_history_market.
    insert_one(item, None).await.unwrap();
    db.public_market.delete_one(doc! {
      "_id": bson::oid::ObjectId::parse_str(post_id).unwrap()
    }, None).await.unwrap();

    return Ok(json!({
      "type": "make_deal",
      "status": 200,
      "preserved": preserved
    }));
  }

  pub async fn get_bot_evaluation_worker(request : &Json, bot : Arc<ChatGPT>,
  session : Arc<Mutex<Session>>, db : Arc<Db>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");

    let last_evaluation = 
    db.users_bot_evaluation.find_one(doc! {
      "username": session.lock().await.username.clone()
    }, None).await;
    if last_evaluation.is_err() {
      return Err(());
    }
    let last_evaluation = last_evaluation.unwrap();
    let last_evaluation_time = 
    match last_evaluation.clone() {
      Some(doc) => {
          let time: String = doc.get("time").unwrap().to_string();
          Some(chrono::DateTime::parse_from_rfc3339(&time).unwrap().with_timezone(&Utc))
      },
      None => None
    };

    if last_evaluation_time.is_some()
    {
      let last_update_time = 
      session.lock().await.get_last_update_time(db.clone()).await;
      if last_update_time < last_evaluation_time.unwrap() {
        let content = last_evaluation.unwrap().get("content").unwrap().to_string();
        return Ok(json!({
          "type": "get_bot_evaluation",
          "status": 200,
          "preserved": preserved,
          "content": content
        }));
      }
    }

    let financial_summary = 
    session.lock().await.get_financial_summary().await;


    let prompt = format!("Now you are a professional advisor, please give some advice to the user {},
    who has the following financial status: {}.",
    session.lock().await.username, financial_summary
    );

    let response = bot.send_message(prompt).await;
    if response.is_err() {
      return Err(());
    }
    let content = response.unwrap();
    let content = content.message().content.clone();
    let entry = doc! {
      "username":session.lock().await.username.clone(),
      "content": content.clone(),
      "time": chrono::Utc::now().to_rfc3339(),
    };

    let query = doc! {
      "username": session.lock().await.username.clone()
    };
    let update = doc! {
      "$set": 
      entry
    };

    let response = db.users_bot_evaluation.update_one(query, update, None).await;

    if response.is_err()
    {
      return Err(());
    }

    return Ok(json!({
      "type": "get_bot_evaluation",
      "status": 200,
      "preserved": preserved,
      "content": content
    }));
  }

  pub async fn send_message_to_bot_worker(request : &Json, session : Arc<Mutex<Session>>,
    bot : Arc<ChatGPT>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content").and_then(|c| c.as_str());
    if content.is_none() {
      return Err(());
    }
    let msg = content.unwrap();
    let response = 
    session.lock().await.speak_to_bot(bot.clone(), msg.to_string()).await;
    return Ok(json!({
      "type": "send_message_to_bot",
      "status": 200,
      "preserved": preserved,
      "content": response
    }));
  }

  pub async fn get_bot_conversation_worker(request : &Json, session : Arc<Mutex<Session>>,
    db : Arc<Db>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let username = session.lock().await.username.clone();
    let response = db.users_bot_conversation.find_one(
      doc! {
        "username": username
      }, None).await;
    if response.is_err() {
      return Err(());
    }
    let response = response.unwrap();
    if response.is_none() {
      return Ok(json!({
        "type": "get_bot_conversation",
        "status": 200,
        "preserved": preserved,
        "content": json!([])
      }));
    }
    Err(())
  }

  pub async fn get_adviser_conversation_worker(request : &Json, session : Arc<Mutex<Session>>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    session.lock().await.retrieve_adviser_conversation().await;
    let conversation = session.lock().await.adviser_conversation.clone();
    return Ok(json!({
      "type": "get_adviser_conversation",
      "status": 200,
      "preserved": preserved,
      "content": conversation
    }));
  }

  pub async fn send_message_to_adviser_worker(request : &Json, session : Arc<Mutex<Session>>,
  adviser : Arc<Mutex<Option<Arc<Mutex<TcpStream>>>>>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content").and_then(|c| c.as_str());
    if content.is_none() {
      return  Err(());
    }
    let msg = content.unwrap();
    session.lock().await.
    append_adviser_conversation(msg.to_string(), "user".to_string()).await;
    let adviser = adviser.lock().await;
    if adviser.is_none() {
      println!("Send message, but adviser is offline");
      return Ok(
        json!(
          {
            "type": "send_message_to_adviser",
            "status": 200,
            "preserved": preserved,
          }
        )
      );
    }
    let adviser = adviser.as_ref().unwrap();
    let mut adviser = adviser.lock().await;
    let json = json!(
      {
        "username": session.lock().await.username.clone(),
        "content": msg
      }
    );
    let result = adviser.write_all(json.to_string().as_bytes()).await;
    if result.is_err() {
      println!("Send message, but adviser is offline");
    }
    return Ok(
      json!(
        {
          "type": "send_message_to_adviser",
          "status": 200,
          "preserved": preserved,
        }
      )
    );
  }

  pub async fn get_user_posts_worker(request : &Json, session : Arc<Mutex<Session>>,
  db : Arc<Db>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let username = session.lock().await.username.clone();
    let cursor = db.public_market.find(doc! {
      "username": username
    }, None).await;
    if cursor.is_err() {
      return Err(());
    }
    let mut cursor = cursor.unwrap();
    let mut content = json!([]);
    while let Some(result) = cursor.next().await {
      match result {
        Ok(doc) => {
          let doc = bson::to_bson(&doc).unwrap(); // Convert bson to json
          content.as_array_mut().unwrap().push(doc.into());
        }
        Err(e) => return Err(()),
      }
    }
    return Ok(json!({
      "type": "get_user_posts",
      "status": 200,
      "preserved": preserved,
      "content": content
    }));
  }
  pub async fn get_user_deals_worker(request : &Json, session : Arc<Mutex<Session>>,
  db : Arc<Db>) -> Result<Json, ()>
  {
    let preserved = request.get("preserved");
    let username = session.lock().await.username.clone();
    let cursor = db.public_deals.find(doc! {
      "$or": [
        {"lender_username": username.clone()},
        {"borrower_username": username.clone()}
      ]
    }, None).await;
    if cursor.is_err() {
      return Err(());
    }
    let mut cursor = cursor.unwrap();
    let mut content = json!([]);
    while let Some(result) = cursor.next().await {
      match result {
        Ok(doc) => {
          let doc = bson::to_bson(&doc).unwrap(); // Convert bson to json
          content.as_array_mut().unwrap().push(doc.into());
        }
        Err(e) => return Err(()),
      }
    }
    return Ok(json!({
      "type": "get_user_posts",
      "status": 200,
      "preserved": preserved,
      "content": content
    }));
  }

  pub async fn complete_deal_worker(request : &Json, db : Arc<Db>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content");
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let _id = content.get("_id").and_then(|i| i.as_str());
    if _id.is_none() {
      return Err(());
    }
    let _id = _id.unwrap();
    let doc = db.public_deals.find_one(doc! {
      "_id": bson::oid::ObjectId::parse_str(_id).unwrap()
    }, None).await;
    if doc.is_err() {
      return Err(());
    }
    let doc = doc.unwrap();
    if doc.is_none() {
      return Err(());
    }
    db.public_history_deals.insert_one(doc.unwrap(), None).await.unwrap();
    let response = db.public_deals.delete_one(doc! {
      "_id": bson::oid::ObjectId::parse_str(_id).unwrap()
    }, None).await;
    if response.is_err() {
      return Err(());
    }
    return Ok(json!({
      "type": "complete_deal",
      "status": 200,
      "preserved": preserved
    }));
  }

  pub async fn send_notification_worker(request : &Json, session : Arc<Mutex<Session>>,
  db : Arc<Db>)
  ->Result<Json,()>
  {
    let preserved = request.get("preserved");
    let content = request.get("content");
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
    let receiver = content.get("receiver").and_then(|r| r.as_str());
    if receiver.is_none() {
      return Err(());
    }
    let receiver = receiver.unwrap();
    let content = content.get("content");
    let content_bson = content.clone().map(|c| bson::to_bson(c).unwrap());
    
    if content.is_none() {
      return Err(());
    }
    let mail = doc!
    {
      "sender": session.lock().await.username.clone(),
      "receiver": receiver,
      "content": content_bson,
      "time": chrono::Utc::now().to_rfc3339()
    };
    db.users_notification.insert_one(mail, None).await.unwrap();
    return Ok(json!({
      "type": "send_notification",
      "status": 200,
      "preserved": preserved
    }));
  }

  pub async fn get_notification_worker(request : &Json, session : Arc<Mutex<Session>>,
  db : Arc<Db>)->Result<Json,()>
  {
    let preserved = request.get("preserved");
    let username = session.lock().await.username.clone();
    let cursor = db.users_notification.find(doc! {
      "$or": [
        {"sender": username.clone()},
        {"receiver": username.clone()}
      ]
    }, None).await;
    if cursor.is_err() {
      return Err(());
    }
    let mut cursor = cursor.unwrap();
    let mut content = json!([]);
    while let Some(result) = cursor.next().await {
      match result {
        Ok(doc) => {
          let doc = bson::to_bson(&doc).unwrap(); // Convert bson to json
          content.as_array_mut().unwrap().push(doc.into());
        }
        Err(e) => return Err(()),
      }
    }
    return Ok(json!({
      "type": "get_notification",
      "status": 200,
      "preserved": preserved,
      "content": content
    }));
  }
}