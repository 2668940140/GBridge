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
                
                <TwoButtonsInline
                    title1="Invest"
                    title2="Loan"
                    onPress1={() => navigation.navigate('Post', {post_type: 'lend'})}
                    onPress2={() => navigation.navigate('Post', {post_type : 'borrow'})}
                    disable1={false}
                    disable2={false}
                    />
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
