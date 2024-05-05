import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import ProfileBoard from './components/ProfileBoard';
import LoanRepaymentList from './components/LoanRepaymentList';
import ScoreBoard from './components/ScoreBoard';
import MarketComponent from './components/MarketComponent';

const HomeScreen = ({ navigation }) => {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Welcome to JinQiaoTong!</Text>
            <ProfileBoard navigation={navigation} targetScreen={'PersonalPage'} />
            <LoanRepaymentList navigation={navigation} />
            <ScoreBoard navigation={navigation} />
            <MarketComponent navigation={navigation} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center'
    }
});

export default HomeScreen;
