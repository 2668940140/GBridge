use serde_json::Value;
use std::io::{self, Read, Write};
use std::net::TcpStream;

fn main() {
    match TcpStream::connect("localhost:29175") {
        Ok(mut stream) => {
            println!("Successfully connected to server in port 29175");

            loop {
                let mut input = String::new();
                io::stdin().read_line(&mut input).unwrap();
                stream.write(input.as_bytes()).unwrap();
                println!("Sent message: {}", input);
                let mut buffer = [0; 10240];

                match stream.read(&mut buffer) {
                    Ok(n) => {
                        let response = String::from_utf8_lossy(&buffer[..n]);
                        println!("Received response: {}", response);
                    },
                    Err(e) => {
                        println!("Failed to receive response: {}", e);
                    }
                }
            }
        },
        Err(e) => {
            println!("Failed to connect: {}", e);
        }
    }
}