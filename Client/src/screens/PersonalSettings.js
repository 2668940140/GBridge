// src/screens/PersonalSettings.js
import React from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { pickCropImage } from '../utils/ImagePicker';
import BaseConInterface from './BaseConInterface';
import { resetNavigator } from '../utils/ResetNavigator';
import DefaultUserIcon from '../assets/default_user_icon.png';
import { TwoButtonsInline } from '../components/MyButton';
import {NumberInput} from '../components/NumberInput';

class PersonalSettings extends BaseConInterface {
    constructor(props) {
        super(props);
        const { userIcon = null, cash = Number(0), income = Number(0), expenditure = Number(0), debt = Number(0), assets = Number(0)} = this.props.route.params || {};
        this.state = {
            userIcon: userIcon,
            newIcon: null,
            cash: cash,
            income: income,
            expenditure: expenditure,
            debt: debt,
            assets: assets,
            cashValid: true,
            incomeValid: true,
            expenditureValid: true,
            debtValid: true,
            assetsValid: true,
            loading: false,  // Initial state for loading
            isLoading: false
        };
    }

    handleConfirmPress = () => {
        const { newIcon, cash, income, expenditure, debt, assets } = this.state;
        if (cash !== null && income !== null && expenditure !== null && debt !== null && assets !== null || newIcon) {
            this.setState({ isLoading: true });  // Start loading
            let content ={};
            if(newIcon){
                content['portrait'] = newIcon;
            }
            content['cash'] = cash;
            content['income'] = income;
            content['expenditure'] = expenditure;
            content['debt'] = debt;
            content['assets'] = assets;
            this.transferLayer.sendRequest({
                type: "update_user_info",
                content: content,
                extra: null
            }, this.handleProfileUpdateResponse);
        } else {
            this.displayErrorMessage("Please enter valid changes.");
        }
    }

    handleProfileUpdateResponse = (response) => {
        const { newIcon } = this.state;
        this.setState({ isLoading: false });  // Stop loading
        if (response.success) {
            global.gUserIcon = newIcon;
            this.setState({ userIcon: newIcon}, () => {
                this.setState({ newIcon: null});
                this.displaySuccessMessage('Profile updated successfully!');
            });
        } else {
            this.displayErrorMessage('Failed to update profile. ');
        }
    };

    setImage = (image) => {
        this.setState({ newIcon: image });
    };

    render() {
        const { loading, incomeValid, cashValid, expenditureValid, assetsValid, debtValid } = this.state;
        const { cash = Number(0), income = Number(0), expenditure = Number(0), debt = Number(0), assets = Number(0)} = this.props.route.params || {};
        let userIcon = this.state.newIcon || this.state.userIcon;
        if (loading) return super.render();  // Show loading indicator
    
        return (
            <View style={styles.container}>
                <Image source={userIcon ? { uri: userIcon } : DefaultUserIcon} style={styles.icon} />
                <TouchableOpacity onPress={()=> pickCropImage(this.setImage)}>
                    <Text style={styles.picText}>Upload New Icon</Text>
                </TouchableOpacity>
                <NumberInput iniValue={cash.toString()} prompt="Cash" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ cash: value, cashValid: true });
                    else
                        this.setState({ cashValid: false });
                }} />
                <NumberInput iniValue={income.toString()} prompt="Income" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ income: value, incomeValid: true  });
                    else
                        this.setState({ incomeValid: false });
                }} tail="/mouth" />
                <NumberInput iniValue={expenditure.toString()} prompt="Expenditure" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ expenditure: value, expenditureValid: true  });
                    else
                        this.setState({ expenditureValid: false });
                }} tail="/mouth"/>
                <NumberInput iniValue={debt.toString()} prompt="Debt" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ debt: value, debtValid: true  });
                    else
                        this.setState({ debtValid: false });
                }} />
                <NumberInput iniValue={assets.toString()} prompt="Assets" updateValue={(value) => {
                    if(value !== null)
                        this.setState({ assets: value, assetsValid: true  });
                    else
                        this.setState({ assetsValid: false });
                }} />
                <TwoButtonsInline title1="Confirm" title2="Home" onPress1={this.handleConfirmPress} onPress2={() => resetNavigator(this.props.navigation, 'Home')} disable1={!cashValid || !incomeValid || !expenditureValid || !debtValid || !assetsValid} disable2={this.state.isLoading} />
                {this.state.isLoading && (
                    <ActivityIndicator size="large" color="#0000ff" />
                )}
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
    icon: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    picText: {
        color: 'blue',
        marginVertical: 5,
    }
});

export default PersonalSettings;
