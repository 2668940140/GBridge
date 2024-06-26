// utils/TransferLayer.js
import TcpSocket from 'react-native-tcp-socket';

class TransferLayer {
    constructor() {
        this.socket = null;
        this.retryCount = 0;
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.isConnected = false;
        this.onResponseReceived = null;
        this.dataBuffer = '';
    }

    checkConnection() {
        return this.isConnected;
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                this.socket = TcpSocket.createConnection({
                    host: host,
                    port: port
                }, () => {
                    console.log('Connected to server!');
                    this.setupResponseHandler();
                    this.retryCount = 0;
                    this.isConnected = true;
                    resolve();
                });

                this.socket.on('error', (error) => {
                    console.error('Socket error:', error);
                    this.socket.destroy();
                    this.socket = null; // Cleanup the socket on error
                    this.isConnected = false;
                    if (this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        console.log(`Retry ${this.retryCount}/${this.maxRetries} in ${this.retryDelay / 1000} seconds...`);
                        setTimeout(() => this.connect().then(resolve).catch(reject), this.retryDelay);
                    } else {
                        console.log('Max retries reached, giving up.');
                        reject(error);
                    }
                });

                this.socket.on('close', () => {
                    console.log('Connection closed!');
                    this.socket = null;
                    this.isConnected = false;
                });
            } else {
                console.log("Attempt to connect when socket already exists.");
                if (this.socket.destroyed || this.socket.closing) {
                    console.log("Existing socket is closing or destroyed, retrying connection.");
                    this.socket = null;
                    return this.connect().then(resolve).catch(reject);
                } else {
                    console.log("Using existing connection.");
                    resolve(); // Use existing connection if it's active
                }
            }
        });
    }

    onSessionExpired = null;

    setupResponseHandler() {
        this.socket.on('data', async (data) => {
            this.dataBuffer += data.toString();
            console.log('Received data:', this.dataBuffer);
            const adviser_success = '{"type":"adviser_login","status":200}';
            const i = this.dataBuffer.indexOf(adviser_success);
            if (i !== -1) {
                if (this.dataBuffer.slice(i, i + adviser_success.length) === this.dataBuffer) {
                    this.dataBuffer = '';
                    return;
                }
                if (this.dataBuffer.slice(i, i + adviser_success.length) === adviser_success)
                    this.dataBuffer = this.dataBuffer.slice(adviser_success.length + i);
            }

            let jsonResponse;
            try {
                jsonResponse = JSON.parse(this.dataBuffer);
                console.log('Received:', jsonResponse);
                this.dataBuffer = ''; // Clear the buffer after parsing

                if (jsonResponse.status !== 200) {
                    jsonResponse.success = false;
                }
                else {
                    jsonResponse.success = true;
                    // Check for session expiry

                    if (jsonResponse.sessionExpired) {
                        if (this.onSessionExpired) {
                            this.onSessionExpired();
                        }
                        // Check for session update
                        if (jsonResponse.user) {
                            sessionToken = jsonResponse.user;
                        }
                    }
                }

                if (this.onResponseReceived) {
                    this.onResponseReceived(jsonResponse);
                }
            } catch (error) {
                console.error('Error parsing JSON in transfer!', error);
            }
        });
    }

    async sendRequest(requestObject, onResponseReceived) {
        requestObject.sessionToken = sessionToken
        requestObject.preserved = requestObject.type;

        if (onResponseReceived)
            this.onResponseReceived = onResponseReceived;

        if (!this.socket || this.socket.destroyed || this.socket.closing) {
            console.log('No connection established, attempting to connect...');
            try {
                await this.connect(); // Assume connect returns a promise that resolves when connected
                console.log('Connection established successfully.');
            } catch (error) {
                console.error('Failed to establish connection:', error);
                return; // Exit the function if connection cannot be established
            }
        }
        if (this.socket) {
            const jsonRequest = JSON.stringify(requestObject);
            this.socket.write(jsonRequest, 'utf8', () => {
                console.log('Request sent:', jsonRequest);
                console.log('bytes written:', this.socket.bytesWritten);
            });
        } else {
            console.error('No connection established.');
        }
    }

    closeConnection() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
            this.isConnected = false;
        }
    }
}

export default TransferLayer;
