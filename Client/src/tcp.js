import React, {useEffect, useState} from 'react';
import {View, Text, Button} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

const TcpClientExample = () => {
  // Server details
  const serverHost = '127.0.0.1'; // Replace with your server's IP address
  const serverPort = 29175; // Replace with your server's port
  const example_json = {
    name: "John Doe",
    age: 30,
    isStudent: false,
    courses: ["Math", "Science"],
    address: {
      street: "123 Main St",
      city: "Anytown"
    }
  };
  
  const [success, setSuccess] = useState('false');
  const [data, setData] = useState(''); // Data received from the server
  const [request, setRequest] = useState(''); // Data to send to the server

  // Function to create and handle the connection
  const handleConnect = () => {
    // Create the client socket
    const client = TcpSocket.createConnection(
      {
        host: serverHost,
        port: serverPort,
      },
      () => {
        console.log('Connected to server!');
        // Send a message after connecting
        client.write('Hello Server!');
        setSuccess('true');
        setRequest(JSON.stringify(example_json));
        client.write(request + '\n');
      },
    );
    if (!client) {
      console.log('undefined!');
      setSuccess('false');
      return null;
    }
    client.on('data', data => {
      console.log('Received: ' + data);
      // Optionally process data here
      setData(data);
    });

    client.on('error', error => {
      console.error('Error: ' + error);
    });

    client.on('close', () => {
      console.log('Connection closed!');
    });

    // Clean up the connection when the component unmounts or reconnects
    return () => {
      client.destroy();
      console.log('Connection destroyed!');
    };
  };

  // useEffect to handle the connection on component mount
  useEffect(() => {
    const cleanup = handleConnect();
    // Clean up function to run when component unmounts
    return cleanup;
  }, []);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>TCP Connection Example</Text>
      <Button title={success} onPress={handleConnect} />
      <Text>{data}</Text>
    </View>
  );
};

export default TcpClientExample;