// src/screens/VerificationInterface.js
import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import BaseConInterface from './BaseConInterface';
import { SingleButton } from '../components/MyButton';

class VerificationInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            realName: '',
            idNumber: '',
            verificationStatus: '',
            loading: true,
        };
    }

    uploadIDDocuments = () => {
        const { realName, idNumber } = this.state;
        if (!realName || !idNumber ) {
            displayErrorMessage("Error", "All fields are required!");
            return;
        }

        this.setState({ verificationStatus: 'Verification in progress...' });

        this.transferLayer.sendRequest({
            type: "update_user_info",
            content: [
                "authenticated",
            ],
            extra: {
                name: realName,
                idNumber: idNumber,
            }
        }, this.handleVerificationResponse);
    };

    handleVerificationResponse = (response) => {
        if (response.success) {
            this.displaySuccessMessage('Verification successful!');
            this.setState({ verificationStatus: 'Verification successful!' });
            gAuthenticated = 'true';
            this.handleBackPress();
        } else {
            this.displayErrorMessage('Verification failed. ');
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
});

export default VerificationInterface;
