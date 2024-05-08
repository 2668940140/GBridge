
use std::fmt::Error;

use chatgpt;

pub struct GptBot
{
    client : chatgpt::client::ChatGPT,
}

impl GptBot {
  pub async fn new(key : String) -> GptBot
  {
    GptBot {
      client : chatgpt::client::ChatGPT::new(key).unwrap()
    }
  }

  pub async fn generate_response(&self, prompt : String) -> Result<String, ()>
  {
    let response = self.client.send_message(prompt).await;
    match response {
        Ok(response) => {
          let response = response.message().content.clone();
          Ok(response)
        }
        Err(_) => Err(())
    }
  }
  
}