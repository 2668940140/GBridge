// src/screens/RegisterInterface.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import BaseInterface from './BaseInterface';
import TransferLayer from '../utils/TransferLayer';

class RegisterInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            phonenumber: '',
            verificationCode: '',
            password: '',
            isLoading: false,
            isCodeSent: false
        };
        this.transferLayer = new TransferLayer();
    }

    sendVerificationCode = () => {
        const { phonenumber } = this.state;
        if (phonenumber) {
            this.setState({ isLoading: true });
            this.transferLayer.connect().then(() => {
                this.transferLayer.sendRequest({
                    type: "sendVerification",
                    content: {
                    phonenumber: phonenumber
                    },
                    extra: null
                }, this.handleVerificationResponse);
            }).catch(error => {
                this.setState({ isLoading: false });
                this.displayErrorMessage("Failed to connect to server: " + error.message);
            });
        } else {
            this.displayErrorMessage("Please enter your phone number");
        }
    };

    handleVerificationResponse = (response) => {
        this.setState({ isLoading: false });
        if (response.success) {
            this.setState({ isCodeSent: true });
            this.displaySuccessMessage("Verification code sent. Please check your SMS messages.");
        } else {
            this.displayErrorMessage("Failed to send verification code. Please try again.");
        }
    };

    handleRegister = () => {
        const { phonenumber, verificationCode, password } = this.state;
        if (phonenumber && verificationCode && password) {
            this.setState({ isLoading: true });
            this.transferLayer.sendRequest({
                type: "register",
                content: {
                phonenumber: phonenumber,
                verificationCode: verificationCode,
                password: password
                },
                extra: null
            }, this.handleRegisterResponse);
        } else {
            this.displayErrorMessage("Please fill in all fields");
        }
    };

    handleRegisterResponse = (response) => {
        this.setState({ isLoading: false });
        if (response.success) {
            this.displaySuccessMessage("Registration successful");
            // Optionally navigate to login screen or dashboard
            this.props.navigation.navigate('HomeScereen');
        } else {
            this.displayErrorMessage("Registration failed. " + response.message);
        }
    };

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    render() {
        const { isLoading, isCodeSent } = this.state;
        return (
            <View style={styles.container}>
                <TextInput
                    style={styles.inputField}
                    placeholder="Phone Number"
                    value={this.state.phonenumber}
                    onChangeText={text => this.setState({ phonenumber: text })}
                    editable={!isCodeSent}
                />
                {isCodeSent && (
                    <>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Verification Code"
                            value={this.state.verificationCode}
                            onChangeText={text => this.setState({ verificationCode: text })}
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Password"
                            secureTextEntry={true}
                            value={this.state.password}
                            onChangeText={text => this.setState({ password: text })}
                        />
                        <Button title="Register" onPress={this.handleRegister} disabled={isLoading} />
                    </>
                )}
                {!isCodeSent && (
                    <Button title="Send Verification Code" onPress={this.sendVerificationCode} disabled={isLoading} />
                )}
                {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
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
    inputField: {
        width: '100%',
        marginBottom: 20,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10
    }
});

export default RegisterInterface;
