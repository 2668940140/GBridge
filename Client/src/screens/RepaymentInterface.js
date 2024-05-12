import React, { Component } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import BaseConInterface from './BaseConInterface';
import { SingleButton, TwoButtonsInline } from '../components/MyButton';
import { Picker } from '@react-native-picker/picker';

class RepaymentInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        const { item = null} = this.props.route.params || {};
        this.state = {
            loanDetail: item,  
            selectedPaymentMethod: null,
            loading: true,
            isLoading: false
        };
    }

    initiatePaymentProcess = () => {
        const { selectedPaymentMethod, loanDetail } = this.state;
        this.setState({ isLoading: true });
        this.transferLayer.sendRequest({
            type: "complete_deal",
            content:{
                _id: loanDetail._id,
                paymentMethod: selectedPaymentMethod
            }
        }, response => {
            this.setState({ isLoading: false });
            if (response.success) {
                this.displaySuccessMessage('Payment successful.');
                this.props.navigation.goBack();
            } else {
                this.displayErrorMessage('Payment failed. Please try again.');
            }
        });
    };

    render() {
        const { loanDetail, selectedPaymentMethod, loading, isLoading } = this.state;
        if(loading){
            return (
                <View style={styles.container}>
                    <Text>Loading...</Text>
                </View>
            );
        }
        return (
            <View style={styles.container}>
                {!loanDetail && (
                    <>
                        <Text>No selected item!</Text>
                        <SingleButton
                            title="Go Back"
                            onPress={() => this.props.navigation.goBack()}
                        />
                    </>
                )}
                {loanDetail && (
                    <>
                        <Text style={styles.info}>Payment Due: {loanDetail.amount}</Text>
                        <Text style={styles.info}>Start Date: {loanDetail.date}</Text>
                        <Text style={styles.info}>Period: {loanDetail.period}</Text>
                        <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedPaymentMethod}
                            onValueChange={(itemValue, itemIndex) => this.setState({ selectedPaymentMethod: itemValue })}>
                            <Picker.Item label="Select payment method" value="" />
                            <Picker.Item label="Credit Card" value="credit" />
                            <Picker.Item label="Debit Card" value="debit" />
                            <Picker.Item label="PayPal" value="paypal" />
                        </Picker>
                        </View>
                        <TwoButtonsInline
                            title1="Cancel"
                            title2="Pay"
                            onPress1={() => this.props.navigation.goBack()}
                            onPress2={this.initiatePaymentProcess}
                            disable2={!selectedPaymentMethod || isLoading}
                            disable1={isLoading}
                        />
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
        padding: 20,
    },
    pickerContainer: {
        height: 50,
        backgroundColor: 'rgba(0, 123, 255, 0.4)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 123, 255, 0.8)',
        overflow: 'hidden',
        borderWidth: 1,
        width: '100%',
        marginHorizontal: 20,
    },
    info: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
    }
});

export default RepaymentInterface;
