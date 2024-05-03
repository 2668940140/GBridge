import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet} from 'react-native';
import TcpSocket from 'react-native-tcp-socket';

const TcpClientExample = () => {
  // Server details
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
  const [serverIp, setServerIp] = useState('10.0.0.2');
  const [serverPort] = useState(29175); // Assuming the port is constant
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [data, setData] = useState(''); // Data received from the server

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
        if (client) {
            client.destroy();
            console.log('Connection destroyed!');
        }
    };
  }, [client]);

  const handleConnect = () => {
    if (!serverIp) {
        alert('Please enter a valid IP address');
        return;
    }
    // Create the client socket
    const newClient = TcpSocket.createConnection({
        host: serverIp,
        port: serverPort,
    }, () => {
        console.log('Connected to server!');
        setConnectionStatus('Connected');
        // Send data to the server
        newClient.write('Hello, server!');
        newClient.write(JSON.stringify(example_json));
    });

    newClient.on('data', (data) => {
        console.log('Received data:', data.toString());
        setData(data.toString());
    });

    newClient.on('error', (error) => {
        console.error('Connection error:', error);
    });

    newClient.on('close', () =>{
    console.log('Connection closed');
    setConnectionStatus('Disconnected');
  });

setClient(newClient);
};

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>TCP Connection Example</Text>
      <TextInput
            style={styles.input}
            onChangeText={setServerIp}
            value={serverIp}
            placeholder="Enter Server IP"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
        />
      <Button
            title={connectionStatus === 'Connected' ? 'Disconnect' : 'Connect'}
            onPress={connectionStatus === 'Connected' ? () => {
                client.destroy();
                setClient(null);
                setConnectionStatus('Disconnected');
            } : handleConnect}
            color={connectionStatus === 'Connected' ? 'red' : 'blue'}
        />
      <Text>{data}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
  },
  title: {
  fontSize: 24,
  fontWeight: 'bold',
  marginBottom: 20,
  },
  input: {
  width: 200,
  height: 40,
  borderColor: 'gray',
  borderWidth: 1,
  padding: 10,
  marginBottom: 20,
  }
  });

export default TcpClientExample;