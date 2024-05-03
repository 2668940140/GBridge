// utils/TransferLayer.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';
import config from '../config/config.json'; 

class TransferLayer {
    constructor() {
        this.socket = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                this.socket = TcpSocket.createConnection({
                    host: config.server.ip,
                    port: config.server.port
                }, () => {
                    console.log('Connected to server!');
                    this.setupResponseHandler();
                    resolve();
                });

                this.socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    reject(error);
                });

                this.socket.on('close', () => {
                    console.log('Connection closed!');
                    this.socket = null;
                });
            } else {
                resolve(); // Already connected
            }
        });
    }

    setupResponseHandler() {
        this.socket.on('data', async (data) => {
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(data);
                console.log('Received:', jsonResponse);

                // Check for session expiry
                if (jsonResponse.sessionExpired) {
                    await AsyncStorage.removeItem('sessionToken');
                    if (this.onSessionExpired) {
                        this.onSessionExpired();
                    }
                    // Check for session update
                    if (jsonResponse.user) {
                        await AsyncStorage.setItem('sessionToken', jsonResponse.user);
                    }
                }

                if (this.onResponseReceived) {
                    this.onResponseReceived(jsonResponse.content);
                }
            } catch (error) {
                console.error('Error parsing JSON!', error);
            }
        });
    }

    async sendRequest(requestObject, onResponseReceived) {
        try{
            const sessionToken = await AsyncStorage.getItem('sessionToken');
            requestObject.user = sessionToken; // Append token to every request
        }catch (error) {
            console.error('AsyncStorage error: ', error.message);
        }
        
        this.onResponseReceived = onResponseReceived;
        if (this.socket) {
            const jsonRequest = JSON.stringify(requestObject);
            this.socket.write(jsonRequest, 'utf8', () => {
                console.log('Request sent:', jsonRequest);
            });
        } else {
            console.error('No connection established.');
        }
    }

    closeConnection() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
    }
}

export default TransferLayer;
