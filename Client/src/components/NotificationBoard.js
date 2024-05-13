import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import BaseConComponent from './BaseConComponent';
import parseItems from '../utils/ParseItem';
import { SingleButton } from './MyButton';
const { differenceInDays, addDays } = require('date-fns');

class NotificationBoard extends BaseConComponent {
    constructor(props) {
        super(props);
        this.state = {
            loans: [],
            messages: [],
            loading: true
        };
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.fetchLoans();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    fetchMessages = () => {
        if(! this.transferLayer || this.transferLayer.checkConnection() === false)
        {
            console.log('No connection to server.');
            return;
        }
        this.transferLayer.sendRequest({
            type: "get_notification",
            extra: null
        }, response => {
            if (response.success) {
                const messages = response.content.filter(msg => msg.receiver === gUsername);
                this.setState({ messages: messages }, () => {
                    this.setState({ loading: false });
                    console.log('Fetched messages');
                });
            } else {
                this.displayErrorMessage('Failed to fetch messages.');
            }
        }).catch(() => {
            this.displayErrorMessage('Failed to fetch messages.');
        });
    };

    fetchLoans = () => {
        this.transferLayer.sendRequest({
            type: "get_user_deals",
            extra: null
        }, response => {
            if (response.success) {
                let items = parseItems(response.content);
                items = items.map(item => {
                    return {
                        ...item,
                        dueDate: addDays(new Date(item.created_time), { days: 30 * item.period})
                        .toLocaleDateString()
                    }
                })
                const currentDate = new Date();
                const loanDeals = items.filter(req => {
                    return req.type === 'borrow' && differenceInDays(req.dueDate, currentDate) < 15;
                });
                this.setState({ loans : loanDeals}, () => { 
                    this.fetchMessages();
                    console.log('Fetched posts and deals');
                });
            } else {
                this.displayErrorMessage('Failed to fetch deals.');
                this.setState({ loading: false });
            }
        }).catch(() => {
            this.displayErrorMessage('Failed to fetch deals.');
            this.setState({ loading: false });
        });
    };

    navigateToRepayment = (loan) => {
        const { navigation } = this.props;
        navigation.navigate('Repay', { item: loan });
    };

    renderLoan = ({ item }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => this.navigateToRepayment(item)}>
            <Text>Amount: {item.amount}   Due: {item.dueDate}</Text>
        </TouchableOpacity>
    );

    renderMessage = ({ item }) => (
        <View style={styles.itemContainer} >
            <Text style={{color: "#007BFF"}}>Sender: {item.sender}</Text>
            <Text style={{fontSize:16}}>  {item.content}</Text>
        </View>
    );

    renderEmpty = (title) => (
        <Text style={styles.title}>{title}</Text>
    );

    render() {
        const { loans, messages, loading } = this.state;
        const { modalVisible, onRequestClose } = this.props;
        if (loading) return this.renderLoading();

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={onRequestClose}>

            <View style={styles.container}>
                <View style={styles.modalView} >

                <Text style={styles.title}>Upcoming Repayment</Text>
                <FlatList
                    style={styles.list}
                    data={loans}
                    renderItem={this.renderLoan}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={() => this.renderEmpty("No upcoming repayment")}
                />
                <Text style={styles.title}>Notifications</Text>
                <FlatList
                    style={styles.list}
                    data={messages}
                    renderItem={this.renderMessage}
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={() => this.renderEmpty("No messages")}
                />
                <SingleButton title="Cancel" onPress={onRequestClose} disable={false}/>

                </View>
            </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    list: {
        flex: 1,
        borderBlockColor: 'black',
        borderWidth: 1,
        margin: 5,
        width: global.windowWidth - 170,
    },
    itemContainer: {
        fontSize: 16,
        padding: 10,
        marginVertical: 5,
        borderBottomWidth: 2,
        borderBottomColor: '#808080',
        width: '100%',
        borderRadius: 10,
        backgroundColor: '#e0e0e0',
    },
    title:{
        fontSize: 20,
        fontWeight: 'bold',
        margin: 5,
        textAlign: 'center',
    }
});

export default NotificationBoard;
