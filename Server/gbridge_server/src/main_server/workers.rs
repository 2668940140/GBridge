use std::sync::Arc;

use crate::main_server;
use crate::main_server::data_structure::Json;
use futures::StreamExt;
use mongodb::bson::{self, doc};
use serde_json::json;
use tokio::sync::Mutex;

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

    let preserved = request.get("preserved").and_then(|p| p.as_object());


    let email = email.unwrap();
    let username = username.unwrap();
    let password = password.unwrap();

    let response = db.users_base_info.insert_one(doc! {
      "email": email,
      "username": username,
      "password": password,
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

    let preserved = request.get("preserved").and_then(|p| p.as_object());

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
      sessions.lock().await.add_session(username.to_string()).await;
      *outer_username = Some(username.to_string());
      return Ok(json!({
        "type": "login",
        "status": 200,
        "preserved": preserved
      }));
    }
  }

  pub async fn update_user_info(request : &Json, db : Arc<Db>, 
    session: Arc<Mutex<Session>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();

    let preserved = request.get("preserved").and_then(|p| p.as_object());

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

    session.lock().await.update_to_db(db.clone(), &vector).await;

    return Ok(json!({
      "type": "update_user_info",
      "status": 200,
      "preserved": preserved,
    }));
  }

  pub async fn get_user_info_worker(request : &Json, db : Arc<Db>, 
    session: Arc<Mutex<Session>>) -> Result<Json,()>
  {
    let content = request.get("content").
    and_then(|c| c.as_object());
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();

    let preserved = request.get("preserved").and_then(|p| p.as_object());

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

    session.lock().await.retrive_from_db(db.clone(), &vector).await;

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

  pub async fn estimate_score_worker(request : &Json, db : Arc<Db>, session : Arc<Mutex<Session>>)
  -> Result<Json,()>
  {
    let preserved = request.get("preserved").and_then(|p| p.as_object());

    session.lock().await.retrive_from_db(db.clone(), &FINANCIAL_FILEDS).await;
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
    let preserved = request.get("preserved").and_then(|p| p.as_object());
    let content = request.get("content");
    if content.is_none() {
      return Err(());
    }
    let content = content.unwrap();
  
    let post_type = content.get("type").and_then(|t| t.as_str());
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
      "type": post_type,
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
    let preserved = request.get("preserved").and_then(|p| p.as_object());
  
    let cursor = db.public_market.find(doc! {}, None).await;
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
}