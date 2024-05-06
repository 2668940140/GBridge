import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import TransferLayer from '../utils/TransferLayer';
import BaseComponent from './BaseComponent';
import DefaultUserIcon from './src/assets/default_user_icon.png';

class ProfileBoard extends BaseComponent{
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            verified: false,
            userIcon: null,
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.transferLayer.sendRequest({
                type: "getUserData",
                content: {},
                extra: null
            }, this.handleProfileResponse);
        }).catch(error => {
            this.displayErrorMessage("Failed to connect to server: " + error.message);
            this.setState({ loading: false });
        });
    }
    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    handleProfileResponse = (response) => {
        if (response.success) {
            this.setState({
                username: response.username,
                verified: response.verified,
                userIcon: response.userIcon,
                loading: false
            });
        } else {
            this.displayErrorMessage("Failed to retrieve user data.");
            this.setState({ loading: false });
        }
    }

    render(){
        const {username, verified, userIcon, loading } = this.state;
        const { navigation, targetScreen } = this.props; 
        if (loading) {
            return this.renderLoading();
        }
        return (
            <TouchableOpacity style={styles.container} onPress={() => navigation.navigate(targetScreen)}>
                <Image source={{ uri: userIcon || DefaultUserIcon }} style={styles.icon} />
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
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // Optional for better UI
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
        fontSize: 16
    },
    status: {
        color: 'grey',
        fontSize: 14
    }
});

export default ProfileBoard;
