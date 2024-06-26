import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import BaseComponent from './BaseComponent';
import DefaultUserIcon from '../assets/default_user_icon.png';

class ProfileBoard extends BaseComponent{
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            verified: false,
            userIcon: null,
            loading: true
        };
    }

    componentDidMount() {
        this.setState({ username: gUsername ,
            userIcon: gUserIcon,
            verified: gAuthenticated === 'true',
            loading: true}, () => {
                this.setState({ loading: false });
            });       
    }

    render(){
        const {username, verified, userIcon, loading } = this.state;
        const { navigation, targetScreen } = this.props; 
        if (loading) {
            return this.renderLoading();
        }
        return (
            <TouchableOpacity style={styles.container} onPress={() => navigation.navigate(targetScreen)}>
                <Image source={userIcon ? { uri: userIcon } : DefaultUserIcon} style={styles.icon} />
                <View style={styles.infoContainer}>
                    <Text style={styles.username}>{username}</Text>
                    <Text style={styles.status}>{verified ? 'Verified' : 'Not Verified'}</Text>
                </View>
            </TouchableOpacity>
        );
    }
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4
    },
    icon: {
        width: 50,
        height: 50,
        borderRadius: 25
    },
    infoContainer: {
        marginLeft: 10,
        justifyContent: 'center'
    },
    username: {
        fontWeight: 'bold',
        fontSize: 18
    },
    status: {
        color: 'grey',
        fontSize: 14
    }
});

export default ProfileBoard;
