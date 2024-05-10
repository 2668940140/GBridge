import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';
import ProfileBoard from '../components/ProfileBoard';
import UserRequests from '../components/UserRequests';
import { TwoButtonsInline } from '../components/MyButton';

class PersonalPage extends BaseInterface {
    constructor(props) {
        super(props);
    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.container}>
                <ProfileBoard
                    navigation={navigation}
                    targetScreen="PersonalInfo"
                />
                <UserRequests navigation={navigation} />
                <TwoButtonsInline
                    button1Title="Invest"
                    button2Title="Loan"
                    button1OnPress={() => navigation.navigate('Investment')}
                    button2OnPress={() => navigation.navigate('Loan')} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between'
    }
});

export default PersonalPage;
