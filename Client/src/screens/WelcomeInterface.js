// src/screens/WelcomeInterface.js
import React from 'react';
import {View, Button, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';  // Make sure the import path is correct

class WelcomeInterface extends BaseInterface {
    handleLoginPress = () => {
        this.props.navigation.navigate('Login');
    };

    handleRegisterPress = () => {
        this.props.navigation.navigate('Register');
    };

    render() {
        return (
            <View style={styles.container}>
                <Button
                    style={styles.button}
                    title="Login"
                    onPress={this.handleLoginPress}
                />
                <Button
                    style={styles.button}
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
        alignItems: 'center',
        width: '100%'
    },
    button: {
        marginVertical: 10,
        width: '80%'
    }
});

export default WelcomeInterface;
