import React from 'react';
import { View, StyleSheet } from 'react-native';
import BaseInterface from './BaseInterface';
import ProfileBoard from '../components/ProfileBoard';
import UserRequests from '../components/UserRequests';
import { SingleButton } from '../components/MyButton';

class PersonalPage extends BaseInterface {
    constructor(props) {
        super(props);
        this.requestRef = React.createRef();
    }

    componentDidMount() {
        this.props.navigation.addListener('focus', () => {
          if (this.requestRef && this.requestRef.current) {
            this.requestRef.current.fetchRequests();
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
                <ProfileBoard
                    navigation={navigation}
                    targetScreen="PersonalInfo"
                />
                <UserRequests navigation={navigation} ref={this.requestRef}/>

                <View style={styles.buttonContainer}>
                    <SingleButton title="Loan" onPress={() => navigation.navigate('Post', {post_type: 'borrow'})} disable={false}/>
                    <SingleButton title="Invest" onPress={() => navigation.navigate('Post', {post_type: 'lend'})} disable={false}/>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingButton: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PersonalPage;
