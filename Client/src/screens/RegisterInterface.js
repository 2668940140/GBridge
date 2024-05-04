// src/screens/RegisterInterface.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity  } from 'react-native';
import CheckBox from '@react-native-community/checkbox'; 
import BaseInterface from './BaseInterface';
import TransferLayer from '../utils/TransferLayer';
import { resetNavigator } from '../utils/ResetNavigator';

class RegisterInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            phonenumber: '',
            verificationCode: '',
            password: '',
            acceptTerms: false,
            isLoading: false,
            isCodeSent: false,
            modalVisible: false
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
            resetNavigator(this.props.navigation, 'HomeScreen');
        } else {
            this.displayErrorMessage("Registration failed. " + response.message);
        }
    };

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    // Add methods to handle checkbox and terms viewing
    toggleCheckBox = () => {
        this.setState(prevState => ({
            acceptTerms: !prevState.acceptTerms
        }));
    };

    renderModal = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={this.state.modalVisible}
                onRequestClose={this.toggleTermsModal}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <ScrollView>
                            <Text style={styles.modalText}>
                                Here are your terms and conditions. Please read them carefully.
                                {"\n\n"}Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose]}
                            onPress={this.viewTerms}
                        >
                            <Text style={styles.textStyle}>Hide Terms</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };
    viewTerms = () => {
        this.setState(prevState => ({
            modalVisible: !prevState.modalVisible
        }));
    };

    render() {
        const { isLoading, isCodeSent, acceptTerms } = this.state;
        return (
            <View style={styles.container}>
                {this.renderModal()}
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
                            secureTextEntry
                            value={this.state.password}
                            onChangeText={text => this.setState({ password: text })}
                        />
                        <View style={styles.checkboxContainer}>
                            <CheckBox
                                value={acceptTerms}
                                onValueChange={this.toggleCheckBox}
                                style={styles.checkbox}
                            />
                            <Text style={styles.label}>Accept Terms and Conditions</Text>
                            <TouchableOpacity onPress={this.viewTerms}>
                                <Text style={styles.viewTerms}>View Terms</Text>
                            </TouchableOpacity>
                        </View>
                        <Button
                            title="Register"
                            onPress={this.handleRegister}
                            disabled={isLoading || !acceptTerms}
                        />
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
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        margin: 8,
    },
    label: {
        margin: 8,
    },
    viewTerms: {
        color: 'blue',
        textDecorationLine: 'underline'
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)' // Semi-transparent background
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center'
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    }
});

export default RegisterInterface;
