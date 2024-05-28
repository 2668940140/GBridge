import React from 'react';
import {Text, View, StyleSheet } from 'react-native';
import ProfileBoard from '../components/ProfileBoard';
import NotificationBoard from '../components/NotificationBoard';
import ScoreBoard from '../components/ScoreBoard';
import MarketComponent from '../components/MarketComponent';
import BaseInterface from './BaseInterface';
import { BottomBar, NotificationButton } from '../components/MyButton';

class HomeScreen extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            notificationVisible: false,
        };
        this.marketRef = React.createRef();
        this.notificationRef = React.createRef();
        this.scoreRef = React.createRef();
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', () => {
            if (this.marketRef && this.marketRef.current) {
                this.marketRef.current.fetchItems();
            }
            if (this.scoreRef && this.scoreRef.current) {
                this.scoreRef.current.fetchScores();
            }
            if (this.notificationRef && this.notificationRef.current) {
                this.notificationRef.current.fetchLoans();
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
                    <ScoreBoard navigation={navigation} targetScreen={'Score'} ref={this.scoreRef} />
                    <NotificationButton onPress={() => {
                            if (this.notificationRef && this.notificationRef.current) {
                                this.notificationRef.current.setState({ force: true, loading: true},
                                    () => this.setState({ notificationVisible: true })
                                );
                                this.notificationRef.current.fetchLoans();
                            }
                        }} />
                </View>
                <MarketComponent navigation={navigation} ref={this.marketRef}/>
                    <NotificationBoard ref={this.notificationRef}
                        navigation={navigation} modalVisible={this.state.notificationVisible}
                        style={{ display: this.state.notificationVisible ? 'flex' : 'none' }}
                        onRequestClose={() => this.setState({ notificationVisible: false })}
                        onRequestShow={(hasMessage) => this.setState({ notificationVisible: hasMessage })}
                    />
                <BottomBar navigation={navigation} selected={'Home'} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
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
