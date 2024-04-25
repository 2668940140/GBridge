use tokio::net::TcpStream;
use tokio::io::{AsyncWriteExt, AsyncReadExt};
use gbridge_server::main_server::*;

#[tokio::test]
async fn test_server_response() {
    let server_config = config::ServerConfig::load("../../config.ini".to_string());
    // Start the server in a background task
    tokio::spawn(async {
        gbridge_server::quick_run().await;
    });

    // Give the server a little time to start up (not ideal for production code)
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Connect to the server
    let mut stream = TcpStream::connect(format!("127.0.0.1:{}",server_config.port)).await.expect("Failed to connect to server");

    // Send a request
    let request = "Hello, server!";
    stream.write_all(request.as_bytes()).await.expect("Failed to send data");

    // Read response
    let mut response = vec![0; 1024];
    let n = stream.read(&mut response).await.expect("Failed to read data");
    response.truncate(n); // Truncate the buffer to the actual size of the data read

    // Convert response to string and check it
    let response_string = String::from_utf8(response).expect("Response was not valid UTF-8");
    println!("Response: {}", response_string);
}
