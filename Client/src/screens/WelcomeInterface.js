// src/screens/WelcomeInterface.js
import React from 'react';
import {View, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';  // Make sure the import path is correct
import { SingleButton } from '../components/MyButton';
import TextAnimation from '../utils/TextAnimation';
import { resetNavigator } from '../utils/ResetNavigator';

class WelcomeInterface extends BaseInterface {
    handleLoginPress = () => {
        this.props.navigation.navigate('Login');
    };

    handleRegisterPress = () => {
        this.props.navigation.navigate('Register');
    };

    handleAdviser = () => {
        resetNavigator(this.props.navigation, 'Adviser');
    };

    render() {
        return (
            <View style={styles.container}>
                <TextAnimation lines={["GBridge", "your reliable", "P2P platform !"]} />
                <SingleButton title="Login" onPress={this.handleLoginPress} />
                <SingleButton title="Register" onPress={this.handleRegisterPress} />
                <SingleButton title="Continue as Adviser" onPress={this.handleAdviser} />
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
