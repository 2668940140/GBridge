// src/screens/LoginInterface.js
import React, { useState } from 'react';
import { View, TextInput, Button, ActivityIndicator, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface'; 
import TransferLayer from '../utils/TransferLayer';  
import { resetNavigator } from '../utils/ResetNavigator';

class LoginInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            phonenumber: '',
            password: '',
            isLoading: false  // Track loading state
        };
        this.transferLayer = new TransferLayer();
    }

    initiateLogin = () => {
        const { phonenumber, password } = this.state;
        if (phonenumber && password) {
            this.setState({ isLoading: true });  // Start loading
            this.transferLayer.connect().then(() => {
                this.transferLayer.sendRequest({
                    type: "login",
                    content:{
                    phonenumber: phonenumber,
                    password: password
                    },
                    extra: null
                }, this.handleServerResponse);
            }).catch(error => {
                this.setState({ isLoading: false });  // Stop loading on error
                this.displayErrorMessage("Failed to connect to server: " + error.message);
            });
        } else {
            this.displayErrorMessage("Please enter both phonenumber and password");
        }
    };
    
    handleServerResponse = (response) => {
        this.setState({ isLoading: false });  // Stop loading when response is received
        if (response.success) {
            this.displaySuccessMessage("Login Successful");
            resetNavigator(this.props.navigation, 'HomeScreen');  // Navigate to Home screen
        } else {
            this.displayErrorMessage("Invalid phonenumber or password");
        }
    };    

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    render() {
        return (
            <View style={styles.container}>
                <TextInput
                    style={styles.inputField}
                    placeholder="phonenumber"
                    value={this.state.phonenumber}
                    onChangeText={(text) => this.setState({ phonenumber: text })}
                />
                <TextInput
                    style={styles.inputField}
                    placeholder="Password"
                    secureTextEntry={true}
                    value={this.state.password}
                    onChangeText={(text) => this.setState({ password: text })}
                />
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
    inputField: {
        width: '100%',
        marginBottom: 20,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10
    }
});

export default LoginInterface;
