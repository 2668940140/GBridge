import React, { Component } from 'react';
import { View, Text, TextInput, Button, Picker, StyleSheet, ScrollView } from 'react-native';
import TransferLayer from '../utils/TransferLayer';
import BaseInterface from './BaseInterface';

class InvestmentInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            investmentAmount: '',
            expectedReturn: '',
            lockPeriod: '',
            creditRating: '',
            loanType: '',
            loading: false,
            isSubmitted: false
        };
        this.transferLayer = new TransferLayer();
    }
    

    handleSubmit = () => {
        const { investmentAmount, expectedReturn, lockPeriod, creditRating, loanType } = this.state;
        this.transferLayer.sendRequest({
            type: "submitInvestment",
            data: { investmentAmount, expectedReturn, lockPeriod, creditRating, loanType }
        }, response => {
            if (response.success) {
                this.displaySuccessMessage('Investment details submitted successfully.');
                this.setState({ isSubmitted: true });
            } else {
                this.displayErrorMessage('Failed to submit investment details.');
            }
        });
    };

    render() {
        const { investmentAmount, expectedReturn, lockPeriod, creditRating, loanType, loading, isSubmitted } = this.state;
    
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Investment Details</Text>
                <TextInput
                    style={styles.input}
                    value={investmentAmount}
                    onChangeText={(text) => this.setState({ investmentAmount: text })}
                    placeholder="Investment Amount"
                    editable={!isSubmitted}
                />
                <TextInput
                    style={styles.input}
                    value={expectedReturn}
                    onChangeText={(text) => this.setState({ expectedReturn: text })}
                    placeholder="Expected Annual Return Rate"
                    editable={!isSubmitted}
                />
                <TextInput
                    style={styles.input}
                    value={lockPeriod}
                    onChangeText={(text) => this.setState({ lockPeriod: text })}
                    placeholder="Lock-in Period"
                    editable={!isSubmitted}
                />
                <Picker
                    selectedValue={creditRating}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) => this.setState({ creditRating: itemValue })}
                    enabled={!isSubmitted}>
                    <Picker.Item label="Select Loan Type" value="" />
                    <Picker.Item label="Personal Loan" value="personal" />
                    <Picker.Item label="Mortgage Loan" value="mortgage" />
                    <Picker.Item label="Auto Loan" value="auto" />
                </Picker>
                <Picker
                    selectedValue={loanType}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) => this.setState({ loanType: itemValue })}
                    enabled={!isSubmitted}>
                    <Picker.Item label="Select Loan Type" value="" />
                    <Picker.Item label="Personal Loan" value="personal" />
                    <Picker.Item label="Mortgage Loan" value="mortgage" />
                    <Picker.Item label="Auto Loan" value="auto" />
                </Picker>
                <Button title="Submit" onPress={this.handleSubmit} disabled={loading || isSubmitted} />
                {loading && <ActivityIndicator size="large" color="#0000ff" />}
            </ScrollView>
        );
    }    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20
    },
    input: {
        height: 40,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'gray',
        paddingHorizontal: 10
    },
    picker: {
        height: 50,
        marginBottom: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default InvestmentInterface;
