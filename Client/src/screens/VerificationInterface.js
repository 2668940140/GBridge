// src/screens/VerificationInterface.js
import React from 'react';
import { View, TextInput, Button, StyleSheet, Image, TouchableOpacity, Text, Alert } from 'react-native';
import BaseInterface from '../components/BaseComponent';
import TransferLayer from '../utils/TransferLayer';
import { AsynLoad, AsynRemove, AsynSave } from '../utils/AsynSL';
import { resetNavigator } from '../utils/ResetNavigator';
import ImagePicker from 'react-native-image-picker';

class VerificationInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            realName: '',
            idNumber: '',
            frontPhoto: null,
            backPhoto: null,
            verificationStatus: ''
        };
        this.transferLayer = new TransferLayer();
    }

    pickImage = (side) => {
        const options = {
            title: 'Select ID Photo',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
            mediaType: 'photo',
            quality: 1,
            includeBase64: true,
        };

        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                const source = { uri: response.uri };
                if (side === 'front') {
                    this.setState({ frontPhoto: response.data });  // Store base64 encoded image
                } else {
                    this.setState({ backPhoto: response.data });  // Store base64 encoded image
                }
            }
        });
    };

    uploadIDDocuments = () => {
        const { realName, idNumber, frontPhoto, backPhoto } = this.state;
        if (!realName || !idNumber || !frontPhoto || !backPhoto) {
            displayErrorMessage("Error", "All fields are required!");
            return;
        }

        this.setState({ verificationStatus: 'Verification in progress...' });

        this.transferLayer.connect().then(() => {
            this.transferLayer.sendRequest({
                type: "verifyIdentity",
                content: {
                    name: realName,
                    idNumber: idNumber,
                    frontPhoto: frontPhoto,
                    backPhoto: backPhoto
                },
                extra: null
            }, this.handleVerificationResponse);
        }).catch(error => {
            this.setState({ verificationStatus: 'Failed to connect to server' });
            console.error('TransferLayer connection error: ', error);
        });
    };

    handleVerificationResponse = (response) => {
        if (response.success) {
            this.displaySuccessMessage('Verification successful!');
            this.setState({ verificationStatus: 'Verification successful!' });
        } else {
            this.displayErrorMessage('Verification failed. ' + response.message);
            this.setState({ verificationStatus: 'Verification failed. Please try again.' });
        }
    };

    handleBackPress = () => {
        resetNavigator(this.props.navigation, 'HomeScreen');
    };

    render() {
        return (
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your real name"
                    value={this.state.realName}
                    onChangeText={text => this.setState({ realName: text })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Enter your ID number"
                    value={this.state.idNumber}
                    onChangeText={text => this.setState({ idNumber: text })}
                />
                <TouchableOpacity style={styles.button} onPress={() => this.pickImage('front')}>
                    <Text>Upload Front ID Photo</Text>
                    {this.state.frontPhoto && <Image source={{ uri: `data:image/jpeg;base64,${this.state.frontPhoto}` }} style={styles.image} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => this.pickImage('back')}>
                    <Text>Upload Back ID Photo</Text>
                    {this.state.backPhoto && <Image source={{ uri: `data:image/jpeg;base64,${this.state.backPhoto}` }} style={styles.image} />}
                </TouchableOpacity>
                <Button title="Submit for Verification" onPress={this.uploadIDDocuments} />
                <Text>{this.state.verificationStatus}</Text>
                <Button title="Back to Home" onPress={this.handleBackPress} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        height: 40,
        width: '90%',
        borderColor: 'gray',
        borderWidth: 1,
        marginTop: 10,
        paddingHorizontal: 10,
    },
    button: {
        marginVertical: 10,
    },
    image: {
        width: 100,
        height: 100,
        marginTop: 10,
    }
});

export default VerificationInterface;
