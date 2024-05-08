
use chatgpt::{prelude::*, types::CompletionResponse};

pub async fn lets_chat(key : String) -> Result<()> {
    let client = ChatGPT::new(key)?;
    let response: CompletionResponse = client
        .send_message("Describe in five words the Rust programming language.")
        .await?;
    println!("Response: {}", response.message().content);

    Ok(())
}