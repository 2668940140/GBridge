import React, { Component } from 'react';
import { View, Text, Button, Picker, StyleSheet, Alert } from 'react-native';
import BaseInterface from './BaseInterface';
import TransferLayer from '../utils/TransferLayer';

class RepaymentInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            loanDetail: props.loanDetail,  // Passed as a prop during navigation
            selectedPaymentMethod: null,
            paymentDetails: null,
            loading: false
        };
    }

    componentDidMount() {
        this.establishConnection();
        if (!this.state.loading) {
            this.setState({ loading: true });
            this.requestUpcomingPaymentDetails();
        }
    }

    requestUpcomingPaymentDetails = () => {
        this.setState({ loading: true });
        // Placeholder for fetching payment details
        this.transferLayer.sendRequest({
            type: "getPaymentDetails",
            data: { loanId: this.state.loanDetail.loanId }
        }, response => {
            this.setState({ loading: false });
            if (response.success) {
                this.setState({ paymentDetails: response.paymentDetails });
            } else {
                this.displayErrorMessage('Failed to fetch payment details.');
            }
        });
    };

    initiatePaymentProcess = () => {
        const { paymentDetails, selectedPaymentMethod } = this.state;
        if (!selectedPaymentMethod) {
            Alert.alert("Error", "Please select a payment method.");
            return;
        }
        this.setState({ loading: true });
        this.transferLayer.sendRequest({
            type: "processPayment",
            data: { paymentDetails, method: selectedPaymentMethod }
        }, response => {
            this.setState({ loading: false });
            if (response.success) {
                this.displaySuccessMessage('Payment successful.');
            } else {
                this.displayErrorMessage('Payment failed. Please try again.');
            }
        });
    };

    render() {
        const { paymentDetails, selectedPaymentMethod, loading } = this.state;

        return (
            <View style={styles.container}>
                {loading && <Text>Loading...</Text>}
                {paymentDetails && (
                    <>
                        <Text>Payment Due: {paymentDetails.amountDue}</Text>
                        <Picker
                            selectedValue={selectedPaymentMethod}
                            onValueChange={(itemValue, itemIndex) => this.setState({ selectedPaymentMethod: itemValue })}>
                            <Picker.Item label="Select payment method" value="" />
                            <Picker.Item label="Credit Card" value="credit" />
                            <Picker.Item label="Debit Card" value="debit" />
                            <Picker.Item label="PayPal" value="paypal" />
                        </Picker>
                        <Button title="Make Payment" onPress={this.initiatePaymentProcess} />
                    </>
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
    }
});

export default RepaymentInterface;
