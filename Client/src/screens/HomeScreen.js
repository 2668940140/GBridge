import React from 'react';
import {Button, Text, View, StyleSheet } from 'react-native';
import ProfileBoard from '../components/ProfileBoard';
import LoanRepaymentList from '../components/LoanRepaymentList';
import ScoreBoard from '../components/ScoreBoard';
import MarketComponent from '../components/MarketComponent';
import BaseInterface from './BaseInterface';

class HomeScreen extends BaseInterface {
    constructor(props) {
        super(props);
        this.marketRef = React.createRef();
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', () => {
          if (this.marketRef && this.marketRef.current) {
            this.marketRef.current.fetchItems();
          }
        });
    }

    componentWillUnmount() {
        this.props.navigation.removeListener('focus');
    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Welcome to JinQiaoTong!</Text>
                <View style={styles.personContainer}>
                    <ProfileBoard navigation={navigation} targetScreen={'PersonalPage'} />
                    <ScoreBoard navigation={navigation} targetScreen={'Score'}/>
                </View>
                
                <MarketComponent navigation={navigation} ref={this.marketRef}/>
                <Button title="Chat" onPress={() => navigation.navigate('ChatInterface')} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 50
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
