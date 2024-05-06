import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';
import ProfileBoard from '../components/ProfileBoard';
import UserRequests from '../components/UserRequests';

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
                    tartgetScreen="PersonalSettings"
                />
                <UserRequests navigation={navigation} />
                <View style={styles.buttonContainer}>
                    <Button title="Loan" onPress={() => navigation.navigate('LoanInterface')} />
                    <Button title="Invest" onPress={() => navigation.navigate('InvestmentInterface')} />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20
    }
});

export default PersonalPage;
