// src/screens/WelcomeInterface.js
import React from 'react';
import {View, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';  // Make sure the import path is correct
import { SingleButton } from '../components/MyButton';
import TextAnimation from '../utils/TextAnimation';

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
                <TextAnimation lines={["GBridge", "your reliable", "P2P platform !"]} />
                <SingleButton title="Login" onPress={this.handleLoginPress} />
                <SingleButton title="Register" onPress={this.handleRegisterPress} />
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
    }
});

export default WelcomeInterface;
