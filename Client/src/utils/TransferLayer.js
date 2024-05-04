// utils/TransferLayer.js
import TcpSocket from 'react-native-tcp-socket';
import config from '../config/config.json'; 
import { AsynLoad, AsynSave, AsynRemove } from './AsynSL';
import { Alert } from 'react-native';

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
                
                if(jsonResponse.status !== 200) {
                    console.error('Error:', jsonResponse.extra.error);
                    Alert.alert('Error', jsonResponse.extra.error);
                    return;
                }
                // Check for session expiry
                if (jsonResponse.sessionExpired) {
                    AsynRemove('sessionToken');
                    if (this.onSessionExpired) {
                        this.onSessionExpired();
                    }
                    // Check for session update
                    if (jsonResponse.user) {
                        AsynSave('sessionToken', jsonResponse.user);
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
        requestObject.user = await AsynLoad('sessionToken');
        
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
