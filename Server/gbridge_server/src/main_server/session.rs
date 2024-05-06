use std::{collections::HashMap, sync::Arc};

use futures::lock::Mutex;
pub struct Session
{
}

pub struct Sessions
{
  sessions: HashMap<String, Arc<Mutex<Session>>>,
}