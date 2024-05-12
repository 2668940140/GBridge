// src/screens/LoginInterface.js
import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import BaseConInterface from './BaseConInterface';  
import { resetNavigator } from '../utils/ResetNavigator';
import EmailInput from '../components/EmailInput';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { SingleButton } from '../components/MyButton';
import { AsynLoad, AsynSave } from '../utils/AsynSL';
import CheckBox from '@react-native-community/checkbox';

class LoginInterface extends BaseConInterface {
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
            isCodeSent: false,
            loading: true,
            saveAccount: 'false'
        };
    }

    componentDidMount() {
        this.transferLayer.connect().then(async () => {
            const saveAccount = await AsynLoad('saveAccount');
            if(saveAccount === 'true') {
                const username = await AsynLoad('username');
                const password = await AsynLoad('password');
                this.setState({ username: username, password: password });
            }
            this.setState({ loading: false, saveAccount: saveAccount});
        }).catch((error) => {
            this.displayErrorMessage("Failed to connect to server. Please try again later.");
        });
    }

    switchTab = (tab) => {
        this.setState({ activeTab: tab });
    };

    initiateLogin = () => {
        const { email, password, verificationCode, username, activeTab, activeVerification } = this.state;
        let type = "";
        if(activeTab === 'email' && activeVerification === 'verification code'
            && email && verificationCode) {
            type = "email_verificationcode";
            }
        else if(activeTab === 'email' && activeVerification === 'password'
            && email && password) {
            type = "email_password";
            }
        else if(activeTab === 'username' && activeVerification === 'verification code'
            && username && verificationCode) {
            type = "username_verificationcode";
            }
        else if(activeTab === 'username' && activeVerification === 'password'
            && username && password) {
            type = "username_password";
            }
        
        if (type !== "") {
            this.setState({ isLoading: true });  // Start loading
            this.transferLayer.sendRequest({
                type: "login",
                content:{
                    email: email,
                    password: password,
                    verificationcode: verificationCode,
                    username: username,
                    loginType: type
                },
                extra: null
            }, this.handleServerResponse);
        } else {
            this.displayErrorMessage("Please enter both " + activeTab + " and " + activeVerification);
        }
    };
    
    handleServerResponse = async (response) => {
        this.setState({ isLoading: false });  // Stop loading when response is received
        if (response.success) {
            await this.updateUserInfo();
        } else {
            this.displayErrorMessage("Invalid " + this.state.activeTab + " or " + this.state.activeVerification);
        }
    };   
    
    updateUserInfo = async () => {
        this.transferLayer.sendRequest({
            type: "get_user_info",
            content: [
                "portrait",
                "username",
                "password",
                "authenticated"
            ],
            extra: null
        }, async (response) => {
            if(response.success) {
                gUserIcon = response.content.portrait;
                gUsername = response.content.username;
                gPassword = response.content.password;
                gAuthenticated = response.content.authenticated ? 'true' : 'false';
                gSaveAccount = this.state.saveAccount;
                await AsynSave('saveAccount', gSaveAccount);
                if(gSaveAccount === 'true') {
                    await AsynSave('username', gUsername);
                    await AsynSave('password', gPassword);
                }
                this.displaySuccessMessage("Login Successful");
                resetNavigator(this.props.navigation, 'Home'); 
            }
        });
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
            content = {};
            if(activeTab === 'email') {
                content.email = email;
            } else {
                content.username = username;
            };
            this.setState({ isLoading: true });
            this.transferLayer.sendRequest({
                type: "get_verificationcode",
                content: content,
                extra: null
            }, this.handleVerificationResponse);
        } else {
            this.displayErrorMessage("Please enter your" + activeTab);
        }
    };

    handleVerificationResponse = (response) => {
        this.setState({ isLoading: false });
        if (response.success) {
            this.setState({ isCodeSent: true });
            this.displaySuccessMessage("Verification code sent. Please check your mail box.");
        } else {
            this.displayErrorMessage("Failed to send verification code. Please try again.");
        }
    };

    toggleCheckBox = () => {
        this.setState({ saveAccount: this.state.saveAccount === 'true' ? 'false' : 'true'});
    }

    render() {
        const { activeTab, activeVerification, username, password, emailName, emailDomain, loading, saveAccount } = this.state;
        if(loading)
            return super.render();
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
                <View style={styles.checkboxContainer}>
                    <CheckBox
                        value={saveAccount === 'true'}
                        onValueChange={this.toggleCheckBox}
                        style={styles.checkbox}
                    />
                    <Text style={styles.label}>save account</Text>
                </View>
                <SingleButton
                    title="Login"
                    onPress={this.initiateLogin}
                    disabled={this.state.isLoading} />
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
});

export default LoginInterface;
