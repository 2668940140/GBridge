// src/screens/LoginInterface.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import BaseInterface from './BaseInterface'; 
import TransferLayer from '../utils/TransferLayer';  
import { resetNavigator } from '../utils/ResetNavigator';
import EmailInput from '../components/EmailInput';
import VerificationCodeInput from '../components/VerificationCodeInput';

class LoginInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 'username',  // Can be 'email' or 'username'
            activeVerification: 'password',
            email: '',
            emailName: '',
            emailDomain: '',
            username: '',
            password: '',
            verificationCode: '',
            isLoading: false,
            isCodeSent: false
        };
        this.transferLayer = new TransferLayer();
    }

    switchTab = (tab) => {
        this.setState({ activeTab: tab });
    };

    initiateLogin = () => {
        const { email, password, verificationCode, username, activeTab, activeVerification } = this.state;
        let type = "";
        if(activeTab === 'email' && activeVerification === 'verification code'
            && email && verificationCode) {
            type = "EV";
            }
        else if(activeTab === 'email' && activeVerification === 'password'
            && email && password) {
            type = "EP";
            }
        else if(activeTab === 'username' && activeVerification === 'verification code'
            && username && verificationCode) {
            type = "UV";
            }
        else if(activeTab === 'username' && activeVerification === 'password'
            && username && password) {
            type = "UP";
            }
        
        if (type !== "") {
            this.setState({ isLoading: true });  // Start loading
            this.transferLayer.connect().then(() => {
                this.transferLayer.sendRequest({
                    type: "login",
                    content:{
                        email: email,
                        password: password,
                        verificationCode: verificationCode,
                        username: username,
                        loginType: type
                    },
                    extra: null
                }, this.handleServerResponse);
            }).catch(error => {
                this.setState({ isLoading: false });  // Stop loading on error
                this.displayErrorMessage("Failed to connect to server: " + error.message);
            });
        } else {
            this.displayErrorMessage("Please enter both " + activeTab + " and " + activeVerification);
        }
    };
    
    handleServerResponse = (response) => {
        if(!this.checkResponse("login", response.preserved))
            return;
        this.setState({ isLoading: false });  // Stop loading when response is received
        if (response.success) {
            this.displaySuccessMessage("Login Successful");
            resetNavigator(this.props.navigation, 'Home');  // Navigate to Home screen
        } else {
            this.displayErrorMessage("Invalid " + this.state.activeTab + " or " + this.state.activeVerification);
        }
    };   
    
    sendVerificationCode = () => {
        const email = this.state.emailName + '@' + this.state.emailDomain;
        const {username, activeTab} = this.state;
        if(activeTab === 'email') {
            this.setState({ email: email });
        } 
        if (email && activeTab === 'email' ||
            username && activeTab === 'username'
        ) {
            this.setState({ isLoading: true });
            this.transferLayer.sendRequest({
                type: "sendVerification",
                content: {
                    email: email,
                    username: username,
                    type: activeTab
                },
                extra: null
            }, this.handleVerificationResponse);
        } else {
            this.displayErrorMessage("Please enter your" + activeTab);
        }
    };

    handleVerificationResponse = (response) => {
        if(!this.checkResponse("sendVerification", response.preserved))
            return;
        this.setState({ isLoading: false });
        if (response.success) {
            this.setState({ isCodeSent: true });
            this.displaySuccessMessage("Verification code sent. Please check your SMS messages.");
        } else {
            this.displayErrorMessage("Failed to send verification code. Please try again.");
        }
    };

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.TransferLayer.sendRequest({
                type: "checkSession",
                content: null,
                extra: null
            });
        }).catch(error => {
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    render() {
        const { activeTab, activeVerification, username, password, emailName, emailDomain } = this.state;
        return (
            <View style={styles.container}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'username' && styles.activeTab]} 
                        onPress={() => this.switchTab('username')}
                    >
                        <Text>Username</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'email' && styles.activeTab]} 
                        onPress={() => this.switchTab('email')}
                    >
                        <Text>Email</Text>
                    </TouchableOpacity>
                </View>
                
                {activeTab === 'email' ? (
                    <EmailInput
                    username={emailName}
                    domain={emailDomain}
                    onUsernameChange={text => this.setState({ emailName: text })}
                    onDomainChange={text => this.setState({ emailDomain: text })}
                    editable={!this.state.isLoading}
                />
                ) : (
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={(text) => this.setState({ username: text })}
                        editable={!this.state.isLoading}
                    />
                )}
                
                {activeVerification === "verification code"?
                (
                <>
                    <VerificationCodeInput
                    onSendCode={this.sendVerificationCode}
                    onCodeChange={(text) => this.setState({ verificationCode: text })}
                    disabled={this.state.isLoading || this.state.isCodeSent}  
                    />
                    <TouchableOpacity onPress={() => this.setState({activeVerification : "password"})}>
                        <Text style={styles.switchText}>Login with Password</Text>
                    </TouchableOpacity>
                </>
                ) : (
                <>
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={(text) => this.setState({ password: text })}
                />
                <TouchableOpacity onPress={() => this.setState({activeVerification : "verification code"})}>
                    <Text style={styles.switchText}>Login with Verification Code</Text>
                </TouchableOpacity>  
                </>
                )}

                <Button
                    title="Login"
                    onPress={this.initiateLogin}
                    disabled={this.state.isLoading}  // Disable button when loading
                />
                {this.state.isLoading && (
                <ActivityIndicator size="large" color="#0000ff" />
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    input: {
        width: '100%',
        marginVertical: 10,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'gray'
    },
    activeTab: {
        borderBottomColor: 'blue'
    },
    switchText: {
        color: 'blue',
        marginBottom: 10
    }
});

export default LoginInterface;
