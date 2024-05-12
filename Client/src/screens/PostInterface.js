import React from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import BaseConInterface from './BaseConInterface';
import {NumberInput, LabelInput} from '../components/NumberInput';
import { pickImage } from '../utils/ImagePicker';
import { Picker } from '@react-native-picker/picker';
import { TwoButtonsInline } from '../components/MyButton';

class PostInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        const post_type = this.props.route.params.post_type;
        this.state = {
            post_type : post_type,
            poster: post_type === 'lend' ? 'Investor' : 'Borrower',
            amount: 0.,
            amountValid: false,
            interest: 0.,
            interestValid: false,
            period: 0,
            periodValid: false,
            description: 'None',
            extra: null,
            loanType: '',
            isLoading: false,
            isSubmitted: false
        };
    }
    
    handleSubmit = () => {
        const { poster, amount, interest, period, description, loanType, extra } = this.state;
        this.transferLayer.sendRequest({
            type: "submit_market_post",
            content: { 
                post_type : this.state.post_type,
                method: loanType,
                poster, amount, interest, period, description, extra },
            extra: null
        }, response => {
            if (response.success) {
                this.setState({ isSubmitted: true });
                this.displaySuccessMessage('Investment details submitted successfully.');
            } else {
                this.displayErrorMessage('Failed to submit investment details.');
            }
        });
    };

    pickExtra = () => {
        pickImage((base64) => {
            this.setState({ extra: base64 });
        }, 'Select Extra Info: ');
    }

    render() {
        const { post_type, poster, amount, interest, period, description, loanType, isLoading, isSubmitted, extra } = this.state;
        const { amountValid, interestValid, periodValid } = this.state;
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.title}>{post_type === 'lend' ? "Investment" : "Loan Application"} Details</Text>
                <LabelInput iniValue={poster} prompt="Poster name" updateValue={(value) => { this.setState({ poster: value }) }} />
                <NumberInput iniValue={amount.toString()} prompt="Amount" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ amount: value, amountValid: true });
                    else
                        this.setState({ amountValid: false });
                }} />
                <NumberInput iniValue={interest.toString()} prompt="Interest" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ interest: value, interestValid: true });
                    else
                        this.setState({ interestValid: false });
                }} tail="/mouth" />
                <NumberInput iniValue={period.toString()} prompt="Lock Period" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ period: parseInt(value), periodValid: true });
                    else
                        this.setState({ periodValid: false });
                }} tail="/mouth" />                
                <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={loanType}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) => this.setState({ loanType: itemValue })}
                    enabled={!isSubmitted}>
                    <Picker.Item label="Select Loan Type" value="" />
                    <Picker.Item label="Full Payment" value="Lump Sum Payment" />
                    <Picker.Item label="Interest-Bearing Installments" value="Interest-Bearing" />
                    <Picker.Item label="Interest-Free Installments" value="Interest-Free" />
                </Picker>
                </View>
                <TouchableOpacity style={styles.button} onPress={this.pickExtra}>
                    <Text style={styles.picText}>Upload Extra Info</Text>
                    {extra && <Image source={{ uri: extra }} style={styles.image} />}
                </TouchableOpacity>
                <View style={styles.desContainer}>
                    <Text style={[styles.title, {fontSize: 18, marginBottom : 5}]}>Enter your descriptions here</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => { this.setState({ description: text }) }}
                        value={description}
                        placeholder="Enter your descriptions here..."
                        multiline={true}r
                        textAlignVertical="top" // Ensures text starts from the top on Android
                        />
                    <TwoButtonsInline
                        title1="Submit"
                        title2="Back"
                        onPress1={this.handleSubmit}
                        onPress2={() => this.props.navigation.goBack()}
                        disable1={!amountValid || !interestValid || !periodValid || !loanType || isLoading || isSubmitted}
                        disable2={isLoading}  />
                    {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    desContainer: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    input: {
        flex: 1,
        width: '100%',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'gray',
        paddingHorizontal: 10
    },
    pickerContainer: {
        height: 50,
        backgroundColor: 'rgba(0, 123, 255, 0.4)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 123, 255, 0.8)',
        overflow: 'hidden',
    },
    item: {
        fontSize: 18,
        height: 44,
        borderRadius: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        marginVertical: 10,
    },
    image: {
        width: 100,
        height: 100,
        marginVertical: 5,
        alignSelf: 'center',
    },
    picText: {
        color: 'blue',
        marginVertical: 5,
        textAlign: 'center',
    }
});

export default PostInterface;
