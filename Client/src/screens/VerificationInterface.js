// src/screens/VerificationInterface.js
import React from 'react';
import { View, TextInput, StyleSheet, Image, TouchableOpacity, Text, Alert } from 'react-native';
import BaseConInterface from './BaseConInterface';
import { resetNavigator } from '../utils/ResetNavigator';
import { pickImage } from '../utils/ImagePicker';
import { SingleButton } from '../components/MyButton';

class VerificationInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            realName: '',
            idNumber: '',
            frontPhoto: null,
            backPhoto: null,
            verificationStatus: '',
            loading: true,
        };
    }

    pickIDPhoto = (type) => {
        pickImage((base64) => {
            if (type === 'front') {
                this.setState({ frontPhoto: base64 });
            } else {
                this.setState({ backPhoto: base64 });
            }
        }, 'Select ID Photo: '+type);
    }

    uploadIDDocuments = () => {
        const { realName, idNumber, frontPhoto, backPhoto } = this.state;
        if (!realName || !idNumber || !frontPhoto || !backPhoto) {
            displayErrorMessage("Error", "All fields are required!");
            return;
        }

        this.setState({ verificationStatus: 'Verification in progress...' });

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
        this.props.navigation.goBack();
    };

    render() {
        if(this.state.loading)
            return super.render();
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
                    keyboardType='numeric'
                    onChangeText={text => this.setState({ idNumber: text })}
                />
                <TouchableOpacity style={styles.button} onPress={() => this.pickIDPhoto('front')}>
                    <Text>Upload Front ID Photo</Text>
                    {this.state.frontPhoto && <Image source={{ uri: this.state.frontPhoto }} style={styles.image} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => this.pickIDPhoto('back')}>
                    <Text>Upload Back ID Photo</Text>
                    {this.state.backPhoto && <Image source={{ uri: this.state.backPhoto }} style={styles.image} />}
                </TouchableOpacity>
                <SingleButton title="Submit" onPress={this.uploadIDDocuments} />
                <Text>{this.state.verificationStatus}</Text>
                <SingleButton title="Back" onPress={this.handleBackPress} />
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
        marginVertical: 5,
    }
});

export default VerificationInterface;
