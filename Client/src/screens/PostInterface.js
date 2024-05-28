import React from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator} from 'react-native';
import BaseConInterface from './BaseConInterface';
import {NumberInput, LabelInput} from '../components/NumberInput';
import { pickImage } from '../utils/ImagePicker';
import { Picker } from '@react-native-picker/picker';
import { TwoButtonsInline } from '../components/MyButton';
import InputModal from '../components/InputModel';

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
            loading: true,
            isSubmitted: false,
            modalVisible: false,
        };
        this.amountRef = React.createRef();
        this.interestRef = React.createRef();
        this.periodRef = React.createRef();
        this.prompt = "Supposing you are an expert in financial consulting, now you are asked to suggest the user a certain " + post_type + " post.\n" + 
        "Your response should be a single json:{\"amount\":Number,\"interest\":Number,\"period\":Number, \"loanType\":String,\"description\":String}\nThe unit of amount is $, it is a positive number.\nThe unit of interest is yearly interest rate, it is a float number between 0 to 1.\nThe unit of period is months, it is a positive integer.\nThere are altogether 3 types of loan: \"Full Payment\", \"Interest-Bearing\", \"Interest-Free\".\nPut your detailed description of the post in the description field, which should show the features of the post to attract other users to match. Most importantly, don't leak any user information!\n";
    }
    
    checkPost = () => {
        this.transferLayer.sendRequest({
            type: "get_user_info",
            content: [
                "income",
                "no_of_dependents",
                "graduated",
                "self_employed",
                "residential_assets_value",
                "commercial_assets_value",
                "luxury_assets_value",
                "bank_asset_value"
            ],
            extra:null
        }, (response) => {
            if (response.success) {
                const { income, no_of_dependents, graduated, self_employed, residential_assets_value, 
                    commercial_assets_value, luxury_assets_value, bank_asset_value
                } = response.content;
                const { amount, period } = this.state;
                let score = 0.5, income_annum = income * 12, total_assets = residential_assets_value + commercial_assets_value + luxury_assets_value + bank_asset_value, years = period / 12;
                this.transferLayer.sendRequest({
                    type: "estimate_score",
                    content: {},
                    extra: null
                }, (response) => {
                    if (response.success && response.content !== null) 
                        score = response.content.score;
                    score = parseInt(score * 1000);
                    if(this.state.post_type === 'lend'){
                        if(amount > total_assets * 0.1)
                            this.showWarning('The amount is over 10% of your assets.');
                        else if(score < 700)
                            this.showWarning('Your credit score is too low for the investment.');
                        else
                            this.handleSubmit();
                    }
                    else {
                        let info = {income_annum, no_of_dependents, graduated, self_employed, 
                            residential_assets_value, commercial_assets_value, luxury_assets_value, bank_asset_value, 
                            loan_amount: amount, loan_term: years, cibil_score: score
                        };
                        for (const key in info)
                            if(info[key] === null)
                                info[key] = 0;
                        if( info.graduated === 0) info.graduated = false;
                        if( info.self_employed === 0) info.self_employed = false;
                        this.transferLayer.sendRequest({
                            type: "borrow_post_estimate_score",
                            content: info,
                            extra: null
                        }, (response) => {
                            if (response.success && response.content !== null) {
                                if(response.content.score < 0.5)
                                    this.showWarning('The estimated score is too low for the loan.');
                            }
                            this.handleSubmit();
                        });
                    }
                });
            } });
      };

    showWarning = (message) => {
        Alert.alert(
            "Post Warning",
            message,
            [
              {
                text: "Cancel",
                onPress: () => console.log("Submission canceled"),
                style: "cancel"
              },
              { 
                text: "Continue", 
                onPress: () => {
                  this.handleSubmit();
                }
              }
            ],
            { cancelable: false }
          );
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

    askAdvice = (text) => {
        this.setState({isLoading: true});
        let prompt = this.prompt;
        if(!(text === null || text.trim() === ''))
            prompt += "The user's addition request is: " + text + "\n";
        prompt += "Please give your advice for his "+ this.state.post_type +" post.\n" +
         "His information is listed below:\n";
        this.transferLayer.sendRequest({
            type: "send_single_message_to_bot",
            content: prompt,
            extra: null
        }, response => {
            this.setState({isLoading: false, loading: false});
            if (response.success && response.content !== null) {
                const advice = JSON.parse(response.content);
                this.setState({
                    loanType: advice.loanType,
                    description: advice.description ? advice.description : 'None',
                });
                this.amountRef.current?.handleInputChange(advice.amount.toString());
                this.periodRef.current?.handleInputChange(advice.period.toString());
                this.interestRef.current?.handleInputChange(advice.interest.toString());
                this.displaySuccessMessage('Advice requested successfully.');
            } else {
                this.displayErrorMessage('Failed to request advice.');
            }
        }
        );
        this.setState({modalVisible : false});
    }

    render() {
        const { post_type, poster, amount, interest, period, description, loanType, isLoading, isSubmitted, extra, loading } = this.state;
        const { amountValid, interestValid, periodValid } = this.state;
        if(loading)
            return super.render();
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.title}>{post_type === 'lend' ? "Investment" : "Loan Application"} Details</Text>
                <TouchableOpacity style={styles.button} onPress={() => {this.setState({modalVisible : true})}}>
                    <Text style={styles.picText}>Ask advice from GPT</Text>
                </TouchableOpacity>
                <InputModal modalVisible={this.state.modalVisible} onRequestClose={() => {this.setState({modalVisible : false})}} onConfirm={this.askAdvice} title={"Enter your addition request:"} placeholder={"Here's an example: Want to get payback in 2 years."} multiline={true} canNone={true}/>
                <LabelInput iniValue={poster} prompt="Poster name" updateValue={(value) => { this.setState({ poster: value }) }} />
                <NumberInput iniValue={amount.toString()} prompt="Amount" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ amount: value, amountValid: true });
                    else
                        this.setState({ amountValid: false });
                }} ref={this.amountRef}/>
                <NumberInput iniValue={interest.toString()} prompt="Interest" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ interest: value, interestValid: true });
                    else
                        this.setState({ interestValid: false });
                }} tail="/mouth" ref={this.interestRef}/>
                <NumberInput iniValue={period.toString()} prompt="Lock Period" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ period: parseInt(value), periodValid: true });
                    else
                        this.setState({ periodValid: false });
                }} tail="/mouth" ref={this.periodRef}/>                
                <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={loanType}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) => this.setState({ loanType: itemValue })}
                    enabled={!isSubmitted}>
                    <Picker.Item label="Select Loan Type" value="" />
                    <Picker.Item label="Lump Sum Payment" value="Full Payment" />
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
                        onPress1={this.checkPost}
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
