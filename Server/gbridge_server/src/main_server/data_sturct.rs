use serde_json::Value as Json;
use std::collections::VecDeque;

pub enum RequestType
{
    Login,
    Register,
    Get,
    Undefined
}

pub struct Request {
    request_type: RequestType,
    session_id: String,
    data: Json,
}

pub struct Response {
    session_id: String,
    data: Json,
}

pub type RequestQueue = VecDeque<Request>;
pub type ResponseQueue = VecDeque<Response>;

