// src/screens/PersonalSettings.js
import React from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { UsernameInput, PasswordInput } from '../components/RuleTextInput';
import ImagePicker from 'react-native-image-picker';
import BaseInterface from '../components/BaseComponent';
import TransferLayer from '../utils/TransferLayer';

class PersonalSettings extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            newUsername: '',
            newUsernameValid: true,
            email: '',
            userIcon: null,
            newIcon: null,
            newPassword: '',
            newPasswordValid: true,
            passwordConfirm: '',
            verified: false,
            mode: 'view',
            loading: true,  // Initial state for loading
            isLoading: false
        };
        this.transferLayer = new TransferLayer();
    }
    
    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchUserData();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }
    
    fetchUserData = () => {
        this.transferLayer.sendRequest({
            type: "getUserData",
            content: {},
            extra:null
        }, this.handleUserDataResponse);
    };
    
    handleUserDataResponse = (response) => {
        if (response.success) {
            const { username, email, userIcon, verified } = response.data;
            this.setState({
                username,
                email,
                userIcon,
                verified,
                loading: false  // Stop the loading indicator
            });
        } else {
            this.displayErrorMessage("Failed to fetch user data.");
            this.setState({ loading: false });  // Stop the loading indicator even if there's an error
        }
    };
    

    handleConfirmPress = async () => {
        const { newUsername, newPassword, passwordConfirm, newIcon } = this.state;

        if (newPassword !== passwordConfirm) {
            this.displayErrorMessage("Passwords do not match.");
            return;
        }

        if (newUsername || passwordConfirm || newIcon) {
            this.setState({ isLoading: true });  // Start loading
            this.transferLayer.sendRequest({
                type: "updateProfile",
                content: {
                    username : newUsername,
                    password : newPassword,
                    userIcon : newIcon
                },
                extra: null
            }, this.handleProfileUpdateResponse);
        } else {
            this.displayErrorMessage("Please enter valid changes.");
        }
    };

    handleProfileUpdateResponse = (response) => {
        const { newUsername,  newIcon } = this.state;
        this.setState({ isLoading: false });  // Stop loading
        if (response.success) {
            this.displaySuccessMessage('Profile updated successfully!');
            this.setState({ userIcon: newUsername, userIcon: newIcon});
            this.setState({ mode: 'view', passwordConfirm: '', newPassword: '', newIcon: null, newUsername: ''});
        } else {
            this.displayErrorMessage('Failed to update profile. ' + response.message);
        }
    };

    pickImage = () => {
        const options = {
            noData: true,
            mediaType: 'photo',
            quality: 1,
            includeBase64: true,
        };

        ImagePicker.showImagePicker(options, response => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                this.setState({ newIcon: response.uri });
            }
        });
    };

    handleVerificationPress = () => {
        resetNavigator(this.props.navigation, 'VerificationInterface');
    };

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }
    render() {
        const { mode, username, userIcon, passwordConfirm, newPassword, verified, loading } = this.state;
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            );
        }
    
        return (
            <View style={styles.container}>
                <Image source={{ uri: userIcon || 'default_icon_placeholder' }} style={styles.icon} />
                <Text>Username: {username}</Text>
                <Text>Email: {this.props.email}</Text>
                <Text>{verified ? 'Verified' : 'Not Verified'}</Text>
    
                {mode === 'view' ? (
                    <>
                        <Button title="Modify" onPress={() => this.setState({ mode: 'edit' })} />
                        <Button title="Start Verification" onPress={this.handleVerificationPress} />
                    </>
                ) : (
                    <>
                        <TouchableOpacity onPress={this.pickImage}>
                            <Text>Upload New Icon</Text>
                        </TouchableOpacity>
                        <UsernameInput
                        placeholder="New Username"
                        allowEmpty={true}
                        onTextChange={(username, isValid) => this.setState({ newUsername: username, newUsernameValid: isValid})}
                        />
                        <PasswordInput
                        placeholder="New Password"
                        allowEmpty={true}
                        onTextChange={(password, isValid) => this.setState({ newPassword: password, newPasswordValid: isValid})}
                        />
                        <TextInput secureTextEntry value={passwordConfirm} onChangeText={text => this.setState({ passwordConfirm: text })} placeholder="Confirm New Password" />
                        <Button title="Confirm Changes" onPress={this.handleConfirmPress} disabled={this.state.isLoading || !this.state.newPasswordValid || !this.state.newUsernameValid }/>
                        {this.state.isLoading && (
                        <ActivityIndicator size="large" color="#0000ff" />
                        )}
                    </>
                )}
            </View>
        );
    }
}    

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    icon: {
        width: 100,
        height: 100,
        borderRadius: 50,
    }
});

export default PersonalSettings;
