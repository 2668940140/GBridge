import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

const VerificationCodeInput = ({ onSendCode, onCodeChange, disabled }) => {
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Enter code"
                onChangeText={(text) => onCodeChange(text)}
                keyboardType="number-pad" 
            />
            <Button
                style={styles.button}
                title="Send Code"
                onPress={() => onSendCode()}  
                disabled={disabled} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    input: {
        flex: 1,  // Take up all available space except what the button needs.
        marginRight: 10,  // Add some margin between the input and the button.
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10
    },
    button: {
        height: '100%'  // Make the button take up all available space.
    }
});

export default VerificationCodeInput;
