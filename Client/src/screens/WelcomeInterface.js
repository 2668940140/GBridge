// src/screens/WelcomeInterface.js
import React from 'react';
import {View, Button, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';  // Make sure the import path is correct

class WelcomeInterface extends BaseInterface {
    handleLoginPress = () => {
        this.displaySuccessMessage("Navigating to Login Screen...");
        this.props.navigation.navigate('Login');
    };

    handleRegisterPress = () => {
        this.displaySuccessMessage("Navigating to Register Screen...");
        this.props.navigation.navigate('Register');
    };

    render() {
        return (
            <View style={styles.container}>
                <Button
                    title="Login"
                    onPress={this.handleLoginPress}
                />
                <Button
                    title="Register"
                    onPress={this.handleRegisterPress}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default WelcomeInterface;
