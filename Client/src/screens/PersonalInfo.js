// src/screens/PersonalSettings.js
import React from 'react';
import { View, Button, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import BaseConInterface from './BaseConInterface';
import DefaultUserIcon from '../assets/default_user_icon.png';
import { TwoButtonsInline } from '../components/MyButton';
import { resetNavigator } from '../utils/ResetNavigator';

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
            verified: false,
            loading: false,  // Initial state for loading
            isLoading: false
        };
    }
    
    componentDidMount() {
        this.establishConnection().then(() => {
            this.fetchUserData();
        }).catch((error) => {
            this.establishConnectionFailure();
        });
    }
    
    fetchUserData = () => {
        this.transferLayer.sendRequest({
            type: "get_user_info",
            content: [
                "portrait",
                "email",
                "cash",
                "income",
                "expenditure",
                "debt",
                "assets",
            ],
            extra:null
        }, this.handleUserDataResponse);
    };
    
    handleUserDataResponse = (response) => {
        const username = gUsername;
        if (response.success) {
            const { email, portrait, verified, cash, income, expenditure, debt, assets} = response.content;
            this.setState({
                username,
                email,
                userIcon: portrait,
                verified,
                cash,
                income,
                expenditure,
                debt,
                assets,
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
        this.props.navigation.navigate('PersonalSettings', { userIcon: this.state.userIcon, cash: this.state.cash, income: this.state.income, expenditure: this.state.expenditure, debt: this.state.debt, assets: this.state.assets });
    }

    logout = () => {
        resetNavigator(this.props.navigation, 'Welcome');
    }

    render() {
        const { username, userIcon, email, cash, verified, loading, income, expenditure, debt, assets } = this.state;
        if (loading) return super.render();  // Show loading indicator
    
        return (
            <View style={styles.container}>
                <Image source={userIcon ? { uri: userIcon } : DefaultUserIcon} style={styles.icon} />
                <Text style={styles.info}>Username: {username}</Text>
                <Text style={styles.info}>Email: {email}</Text>
                <Text style={styles.info}>{verified ? 'Verified' : 'Not Verified'}</Text>
                <Text style={styles.info}>Cash: ${cash ? cash.toString() : '0'}</Text>
                <Text style={styles.info}>Income: ${income ? income.toString() : '0' }/month</Text>
                <Text style={styles.info}>Expenditure: ${expenditure ? expenditure.toString() : '0'}/month</Text>
                <Text style={styles.info}>Debt: ${debt ? debt.toString() : '0'}</Text>
                <Text style={styles.info}>Assets: ${assets ? assets.toString() : '0'}</Text>
    
                <TwoButtonsInline title1="Verify" title2="Modify" onPress1={this.handleVerificationPress} onPress2={this.handleModificationPress} disable1={verified} disable2={false}/>
                    
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
    info: {
        fontSize: 18,
        margin: 5
    }
});

export default PersonalInfo;
