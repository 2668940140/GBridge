import React from 'react';
import {Button, Text, View, StyleSheet } from 'react-native';
import ProfileBoard from '../components/ProfileBoard';
import LoanRepaymentList from '../components/LoanRepaymentList';
import ScoreBoard from '../components/ScoreBoard';
import MarketComponent from '../components/MarketComponent';

const HomeScreen = ({ navigation }) => {
    const handleChatButtonPress = () => {
        navigation.navigate('ChatInterface');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to JinQiaoTong!</Text>
            <View style={styles.personContainer}>
                <ProfileBoard navigation={navigation} targetScreen={'PersonalPage'} />
                <ScoreBoard navigation={navigation} targetScreen={'Score'}/>
            </View>
            
            <MarketComponent navigation={navigation} />
            <Button title="Chat" onPress={handleChatButtonPress} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        //flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center'
    },
    personContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    }
});

export default HomeScreen;
