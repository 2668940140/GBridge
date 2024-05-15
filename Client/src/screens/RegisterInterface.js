// src/screens/RegisterInterface.js
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity  } from 'react-native';
import CheckBox from '@react-native-community/checkbox'; 
import BaseConInterface from './BaseConInterface';
import { UsernameInput, PasswordInput } from '../components/RuleTextInput';
import EmailInput from '../components/EmailInput';
import { resetNavigator } from '../utils/ResetNavigator';
import { MyButton, SingleButton } from '../components/MyButton';

class RegisterInterface extends  BaseConInterface{
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            emailName: '',
            emailDomain: '',
            verificationCode: '',
            password: '',
            passwordValid: false,
            passwordConfirm: '',
            username: '',
            usernameValid: false,
            acceptTerms: false,
            isLoading: false,
            isCodeSent: false,
            modalVisible: false,
            loading: true
        };
    }

    componentDidMount() {
        this.establishConnection();
        this.setState({ loading: false });
    }

    sendVerificationCode = () => {
        const email = this.state.emailName + '@' + this.state.emailDomain;
        this.setState({ email: email });
        if (email) {
            this.setState({ isLoading: true });
            this.transferLayer.sendRequest({
                type: "get_verificationcode",
                content: {
                    email: email
                },
                extra: null
            }, this.handleVerificationResponse);
        } else {
            this.displayErrorMessage("Please enter your email");
        }
    };

    handleVerificationResponse = (response) => {
        this.setState({ isLoading: false });
        if (response.success) {
            this.setState({ isCodeSent: true });
            this.displaySuccessMessage("Verification code sent. Please check your mailbox.");
        } else {
            this.displayErrorMessage("Failed to send verification code. Please try again.");
        }
    };

    handleRegister = () => {
        const { email, verificationCode, password, passwordConfirm, username } = this.state;
        if(password !== passwordConfirm) {
            this.displayErrorMessage("Passwords do not match");
        } 
        else if (email && verificationCode && password && username) {
            this.setState({ isLoading: true });
            this.transferLayer.sendRequest({
                type: "register",
                content: {
                email: email,
                verificationcode: verificationCode,
                password: password,
                username: username
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
            gUsername = this.state.username;
            gPassword = this.state.password;
            this.displaySuccessMessage("Registration successful");
            resetNavigator(this.props.navigation, 'PersonalSettings');
        } else {
            this.displayErrorMessage("Registration failed. " + response.message);
        }
    };

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
        const { isLoading, isCodeSent, acceptTerms, emailName, emailDomain, loading } = this.state;
        if(loading)
            return super.render();
        return (
            <View style={styles.container}>
                {this.renderModal()}                
                <EmailInput
                    username={emailName}
                    domain={emailDomain}
                    onUsernameChange={text => this.setState({ emailName: text })}
                    onDomainChange={text => this.setState({ emailDomain: text })}
                    editable={!isCodeSent}
                />
                {isCodeSent && (
                    <>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Verification Code"
                            value={this.state.verificationCode}
                            onChangeText={text => this.setState({ verificationCode: text })}
                            keyboardType='number-pad'
                        />
                        <UsernameInput
                        placeholder="Your Username"
                        onTextChange={(username, isValid) => this.setState({ username, usernameValid: isValid })}
                        />
                        <PasswordInput
                        placeholder="Password"
                        onTextChange={(password, isValid) => this.setState({ password, passwordValid: isValid })}
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Password Confirm"
                            secureTextEntry
                            value={this.state.passwordConfirm}
                            onChangeText={text => this.setState({ passwordConfirm: text })}
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
                        <SingleButton title="Register" onPress={this.handleRegister} disabled={isLoading || !acceptTerms || !this.state.passwordValid || !this.state.usernameValid} />
                    </>
                )}
                {!isCodeSent && (
                    <MyButton title="Send Verification Code" onPress={this.sendVerificationCode} disabled={isLoading} />
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
        marginVertical: 10,
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginHorizontal: 8,
    },
    label: {
        marginVertical: 8,
    },
    viewTerms: {
        color: 'blue',
        textDecorationLine: 'underline'
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(250,250,250,0.6)'
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
