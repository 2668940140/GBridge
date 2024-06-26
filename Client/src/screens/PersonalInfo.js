// src/screens/PersonalSettings.js
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import BaseConInterface from './BaseConInterface';
import DefaultUserIcon from '../assets/default_user_icon.png';
import { TwoButtonsInline } from '../components/MyButton';
import { resetNavigator } from '../utils/ResetNavigator';
import { BottomBar } from '../components/MyButton';

class PersonalInfo extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            email: '',
            userIcon: null,
            cash: 0,
            income: 0,
            expenditure: 0,
            debt: 0,
            assets: 0,
            no_of_dependents: 1,
            graduated: false,
            self_employed: false,
            residential_assets_value: 0,
            commercial_assets_value: 0,
            luxury_assets_value: 0,
            bank_asset_value: 0,
            verified: false,
            loading: true,  // Initial state for loading
        };
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.props.navigation.addListener('focus', () => {
                this.fetchUserData();
            });
            this.fetchUserData();
        }).catch((error) => {
            this.establishConnectionFailure();
        });
    }

    componentWillUnmount() {
        this.props.navigation.removeListener('focus');
    }

    fetchUserData = () => {
        this.setState({ loading: true });  // Start the loading indicator
        this.transferLayer.sendRequest({
            type: "get_user_info",
            content: [
                "email",
                "cash",
                "income",
                "expenditure",
                "debt",
                "assets",
                "no_of_dependents",
                "graduated",
                "self_employed",
                "residential_assets_value",
                "commercial_assets_value",
                "luxury_assets_value",
                "bank_asset_value"
            ],
            extra: null
        }, this.handleUserDataResponse);
    };

    handleUserDataResponse = (response) => {
        const username = gUsername;
        const userIcon = gUserIcon;
        const verified = gAuthenticated === 'true';
        if (response.success) {
            const { email, cash, income, expenditure, debt, assets,
                no_of_dependents, graduated, self_employed, residential_assets_value,
                commercial_assets_value, luxury_assets_value, bank_asset_value
            } = response.content;
            this.setState({
                username,
                email,
                userIcon,
                verified,
                cash,
                income,
                expenditure,
                debt,
                assets,
                no_of_dependents,
                graduated,
                self_employed,
                residential_assets_value,
                commercial_assets_value,
                luxury_assets_value,
                bank_asset_value,
                loading: false  // Stop the loading indicator
            });
        } else {
            this.displayErrorMessage("Failed to fetch user data.");
            this.setState({ loading: false });  // Stop the loading indicator even if there's an error
        }
    };


    handleVerificationPress = () => {
        this.props.navigation.navigate('Verification');
    };

    handleModificationPress = () => {
        const state = this.state;
        let props = {};
        for (const key in state)
            if (state[key] !== null && state[key] !== undefined)
                props[key] = state[key];
        this.props.navigation.navigate('PersonalSettings', props);
    }

    logout = () => {
        resetNavigator(this.props.navigation, 'Welcome');
    }

    render() {
        const { username, userIcon, email, cash, verified, loading, income, expenditure, debt, assets,
            no_of_dependents, graduated, self_employed, residential_assets_value, commercial_assets_value, luxury_assets_value, bank_asset_value
        } = this.state;
        if (loading) return super.render();  // Show loading indicator

        return (
            <View style={styles.container}>
                <View style={styles.contentContainer}>
                    <Image source={userIcon ? { uri: userIcon } : DefaultUserIcon} style={styles.icon} />
                    <ScrollView style={styles.infoContainer} contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 20 }}>
                        <Text style={styles.info}>Username: {username}</Text>
                        <Text style={styles.info}>Email: {email}</Text>
                        <Text style={styles.info}>{verified ? 'Verified' : 'Not Verified'}</Text>
                        <Text style={styles.info}>Cash: ${cash ? cash.toString() : '0'}</Text>
                        <Text style={styles.info}>Income: ${income ? income.toString() : '0'}/month</Text>
                        <Text style={styles.info}>Expenditure: ${expenditure ? expenditure.toString() : '0'}/month</Text>
                        <Text style={styles.info}>Debt: ${debt ? debt.toString() : '0'}</Text>
                        <Text style={styles.info}>Assets: ${assets ? assets.toString() : '0'}</Text>
                        <Text style={styles.info}>Number of Dependents: {no_of_dependents}</Text>
                        <Text style={styles.info}>Graduated: {graduated ? 'Yes' : 'No'}</Text>
                        <Text style={styles.info}>Self Employed: {self_employed ? 'Yes' : 'No'}</Text>
                        <Text style={styles.info}>Residential Assets Value: ${residential_assets_value ? residential_assets_value.toString() : '0'}</Text>
                        <Text style={styles.info}>Commercial Assets Value: ${commercial_assets_value ? commercial_assets_value.toString() : '0'}</Text>
                        <Text style={styles.info}>Luxury Assets Value: ${luxury_assets_value ? luxury_assets_value.toString() : '0'}</Text>
                        <Text style={styles.info}>Bank Asset Value: ${bank_asset_value ? bank_asset_value.toString() : '0'}</Text>
                    </ScrollView>
                    <TwoButtonsInline title1="Verify" title2="Modify" onPress1={this.handleVerificationPress} onPress2={this.handleModificationPress} disable1={verified} disable2={false} />
                </View>
                <BottomBar navigation={this.props.navigation} selected={'PersonalInfo'} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    icon: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    info: {
        fontSize: 16,
        margin: 5
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
        marginTop: 10,
        width: '100%'
    }
});

export default PersonalInfo;
