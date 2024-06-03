// src/screens/PersonalSettings.js
import React from 'react';
import { View, ScrollView, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { pickCropImage } from '../utils/ImagePicker';
import BaseConInterface from './BaseConInterface';
import { resetNavigator } from '../utils/ResetNavigator';
import DefaultUserIcon from '../assets/default_user_icon.png';
import { TwoButtonsInline } from '../components/MyButton';
import { NumberInput, YesNoChoice } from '../components/InfoInputs';
import { AsynSave, AsynLoad } from '../utils/AsynSL';

class PersonalSettings extends BaseConInterface {
    constructor(props) {
        super(props);
        const { userIcon = null,
            cash = Number(0),
            income = Number(0),
            expenditure = Number(0),
            debt = Number(0),
            assets = Number(0),
            no_of_dependents = Number(0),
            graduated = false,
            self_employed = false,
            residential_assets_value = Number(0),
            commercial_assets_value = Number(0),
            luxury_assets_value = Number(0),
            bank_asset_value = Number(0)
        } = this.props.route.params || {};
        this.state = {
            userIcon: userIcon,
            newIcon: null,
            cash: cash,
            income: income,
            expenditure: expenditure,
            debt: debt,
            assets: assets,
            no_of_dependents: no_of_dependents,
            graduated: graduated,
            self_employed: self_employed,
            residential_assets_value: residential_assets_value,
            commercial_assets_value: commercial_assets_value,
            luxury_assets_value: luxury_assets_value,
            bank_asset_value: bank_asset_value,
            cashValid: true,
            incomeValid: true,
            expenditureValid: true,
            debtValid: true,
            assetsValid: true,
            no_of_dependentsValid: true,
            residential_assets_valueValid: true,
            commercial_assets_valueValid: true,
            luxury_assets_valueValid: true,
            bank_asset_valueValid: true,
            loading: false,  // Initial state for loading
            isLoading: false
        };
    }

    handleConfirmPress = () => {
        const { newIcon, cash, income, expenditure, debt, assets, no_of_dependents, graduated, self_employed, residential_assets_value, commercial_assets_value, luxury_assets_value, bank_asset_value } = this.state;
        if (cash !== null && income !== null && expenditure !== null && debt !== null && assets !== null && no_of_dependents !== null && graduated !== null && self_employed !== null && residential_assets_value !== null && commercial_assets_value !== null && luxury_assets_value !== null && bank_asset_value !== null || newIcon) {
            this.setState({ isLoading: true });  // Start loading
            let content = {};
            if (newIcon) {
                content['portrait'] = newIcon;
            }
            content['cash'] = cash;
            content['income'] = income;
            content['expenditure'] = expenditure;
            content['debt'] = debt;
            content['assets'] = assets;
            content['no_of_dependents'] = no_of_dependents;
            content['graduated'] = graduated;
            content['self_employed'] = self_employed;
            content['residential_assets_value'] = residential_assets_value;
            content['commercial_assets_value'] = commercial_assets_value;
            content['luxury_assets_value'] = luxury_assets_value;
            content['bank_asset_value'] = bank_asset_value;
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
            if (newIcon) {
                gUserIcon = newIcon;
                this.setState({ userIcon: newIcon }, () => {
                    this.setState({ newIcon: null });
                    this.displaySuccessMessage('Profile updated successfully!');
                });
            } else {
                this.displaySuccessMessage('Profile updated successfully!');
            }
        } else {
            this.displayErrorMessage('Failed to update profile. ');
        }
    };

    componentWillUnmount() {
        AsynLoad('saveAccount').then((result) => {
            if (result !== null && result === 'true') {
                AsynSave('portrait', gUserIcon).then(() => {
                    console.log('Portrait saved');
                    super.componentWillUnmount();
                });
            }
        });
    }

    setImage = (image) => {
        this.setState({ newIcon: image });
    };

    render() {
        const { loading, incomeValid, cashValid, expenditureValid, assetsValid, debtValid } = this.state;
        const { cash, income, expenditure, debt, assets,
            no_of_dependents, graduated, self_employed, residential_assets_value,
            commercial_assets_value, luxury_assets_value, bank_asset_value
        } = this.state;
        console.log(this.state);
        console.log(this.props.route.params);
        let userIcon = this.state.newIcon || this.state.userIcon;
        if (loading) return super.render();  // Show loading indicator

        return (
            <View style={styles.container}>
                <Image source={userIcon ? { uri: userIcon } : DefaultUserIcon} style={styles.icon} />
                <TouchableOpacity onPress={() => pickCropImage(this.setImage)}>
                    <Text style={styles.picText}>Upload New Icon</Text>
                </TouchableOpacity>
                <ScrollView style={styles.infoContainer} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                    <NumberInput iniValue={cash?.toString() || "null"} prompt="Cash" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ cash: value, cashValid: true });
                        else
                            this.setState({ cashValid: false });
                    }} />
                    <NumberInput iniValue={income?.toString() || "null"} prompt="Income" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ income: value, incomeValid: true });
                        else
                            this.setState({ incomeValid: false });
                    }} tail="/mouth" />
                    <NumberInput iniValue={expenditure?.toString() || "null"} prompt="Expenditure" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ expenditure: value, expenditureValid: true });
                        else
                            this.setState({ expenditureValid: false });
                    }} tail="/mouth" />
                    <NumberInput iniValue={debt?.toString() || "null"} prompt="Debt" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ debt: value, debtValid: true });
                        else
                            this.setState({ debtValid: false });
                    }} />
                    <NumberInput iniValue={assets?.toString() || "null"} prompt="Assets" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ assets: value, assetsValid: true });
                        else
                            this.setState({ assetsValid: false });
                    }} />
                    <NumberInput iniValue={no_of_dependents?.toString() || "null"} prompt="Number of Dependents" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ no_of_dependents: value, no_of_dependentsValid: true });
                        else
                            this.setState({ no_of_dependentsValid: false });
                    }} />
                    <YesNoChoice iniValue={graduated} prompt="Graduated" updateValue={(value) => {
                        this.setState({ graduated: value });
                    }} />
                    <YesNoChoice iniValue={self_employed} prompt="Self Employed" updateValue={(value) => {
                        this.setState({ self_employed: value });
                    }} />
                    <NumberInput iniValue={residential_assets_value?.toString() || "null"} prompt="Residential Assets Value" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ residential_assets_value: value, residential_assets_valueValid: true });
                        else
                            this.setState({ residential_assets_valueValid: false });
                    }} />
                    <NumberInput iniValue={commercial_assets_value?.toString() || "null"} prompt="Commercial Assets Value" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ commercial_assets_value: value, commercial_assets_valueValid: true });
                        else
                            this.setState({ commercial_assets_valueValid: false });
                    }} />
                    <NumberInput iniValue={luxury_assets_value?.toString() || "null"} prompt="Luxury Assets Value" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ luxury_assets_value: value, luxury_assets_valueValid: true });
                        else
                            this.setState({ luxury_assets_valueValid: false });
                    }} />
                    <NumberInput iniValue={bank_asset_value?.toString() || "null"} prompt="Bank Asset Value" updateValue={(value) => {
                        if (value !== null)
                            this.setState({ bank_asset_value: value, bank_asset_valueValid: true });
                        else
                            this.setState({ bank_asset_valueValid: false });
                    }} />
                </ScrollView>

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
    },
    infoContainer: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginTop: 20,
        width: '100%'
    }
});

export default PersonalSettings;
