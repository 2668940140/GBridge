import React, { Component } from 'react';
import { View, TextInput, Button, StyleSheet, ScrollView, Text, ActivityIndicator } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import BaseInterface from './BaseInterface';
import TransferLayer from '../utils/TransferLayer';

class LoanAppDetail extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            loanAmount: '',
            loanTerm: '',
            loanPurpose: '',
            documents: [],
            agreementAccepted: false,
            isLoading: false
        };
        this.transferLayer = new TransferLayer();
    }

    submitLoanDetails = () => {
        const { loanAmount, loanTerm, loanPurpose, documents, agreementAccepted } = this.state;
        if (!agreementAccepted) {
            this.displayErrorMessage('Please accept the agreement to proceed.');
            return;
        }
        
        this.setState({ isLoading: true });  // Start loading
            this.transferLayer.connect().then(() => {
                this.transferLayer.sendRequest({
                    type: "submitLoanApplication",
                    data: { loanAmount, loanTerm, loanPurpose, documents }
                }, response => {
                    this.setState({ isLoading: false });  // Stop loading
                    if (response.success) {
                        this.displaySuccessMessage('Loan application submitted successfully.');
                    } else {
                        this.displayErrorMessage('Failed to submit loan application.');
                    }
                });
            }).catch(error => {
                this.setState({ isLoading: false });  // Stop loading on error
                this.displayErrorMessage("Failed to connect to server: " + error.message);
            });
    };

    handleFileUpload = async () => {
        try {
            const results = await DocumentPicker.pickMultiple({
                type: [DocumentPicker.types.allFiles],
            });
            this.setState({ documents: results });
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('Canceled from document picker');
            } else {
                throw err;
            }
        }
    };

    render() {
        const { loanAmount, loanTerm, loanPurpose, documents } = this.state;

        return (
            <ScrollView style={styles.container}>
                <TextInput
                    style={styles.input}
                    value={loanAmount}
                    onChangeText={text => this.setState({ loanAmount: text })}
                    placeholder="Loan Amount"
                />
                <TextInput
                    style={styles.input}
                    value={loanTerm}
                    onChangeText={text => this.setState({ loanTerm: text })}
                    placeholder="Loan Term"
                />
                <TextInput
                    style={styles.input}
                    value={loanPurpose}
                    onChangeText={text => this.setState({ loanPurpose: text })}
                    placeholder="Loan Purpose"
                />
                <Button title="Upload Documents" onPress={this.handleFileUpload} />
                {documents.map((file, index) => (
                    <Text key={index}>{file.name}</Text>
                ))}
                <View style={styles.checkboxContainer}>
                    <CheckBox
                        value={this.state.agreementAccepted}
                        onValueChange={() => this.setState({ agreementAccepted: !this.state.agreementAccepted })}
                    />
                    <Text>I accept the loan agreement terms.</Text>
                </View>
                <Button title="Submit Application" onPress={this.submitLoanDetails} disabled={this.state.isLoading}  // Disable button when loading
                />
                {this.state.isLoading && (
                <ActivityIndicator size="large" color="#0000ff" />
                )}
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    input: {
        height: 40,
        marginBottom: 12,
        borderWidth: 1,
        padding: 10
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    }
});

export default LoanAppDetail;
