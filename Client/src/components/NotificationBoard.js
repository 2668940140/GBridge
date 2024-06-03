import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import BaseConComponent from './BaseConComponent';
import parseItems from '../utils/ParseItem';
import { SingleButton } from './MyButton';
const { differenceInDays, addDays } = require('date-fns');
import { Dimensions } from 'react-native';

global.windowWidth = Dimensions.get('window').width;

class NotificationBoard extends BaseConComponent {
    constructor(props) {
        super(props);
        this.state = {
            loans: [],
            messages: [],
            loading: true,
            force: false
        };
    }

    confirmReading = (item) => {
        Alert.alert(
            "Confirm Reading", // Dialog Title
            "You make sure you have receive the notification?", // Dialog Message
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Logout canceled"),
                    style: "cancel"
                },
                {
                    text: "Read",
                    onPress: () => {
                        this.transferLayer.sendRequest({
                            type: "delete_notification",
                            content: {
                                _id: item._id
                            }
                        }, response => {
                            if (response.success) {
                                console.log("Delete notification");
                                this.fetchMessages();
                            } else {
                                this.displayErrorMessage('Failed to delete message.');
                            }
                        }).catch(() => {
                            this.displayErrorMessage('Failed to delete message.');
                        });
                    }
                }
            ],
            { cancelable: true }
        );
    };

    fetchMessages = () => {
        if (!this.transferLayer || this.transferLayer.checkConnection() === false) {
            console.log('No connection to server.');
            return;
        }
        this.transferLayer.sendRequest({
            type: "get_notification",
            extra: null
        }, response => {
            if (response.success) {
                if (!response.content) return;
                const messages = response.content.filter(msg => msg.receiver === gUsername)
                    .map((msg, index) => { return { ...msg, id: index } });

                this.setState({ messages: messages }, () => {
                    this.setState({ loading: false });
                    console.log('Fetched messages');
                    this.props.onRequestShow(this.state.force || this.state.messages.length > 0 ||
                        this.state.loans.length > 0
                    );
                    this.setState({ force: false });
                });
            } else {
                this.displayErrorMessage('Failed to fetch messages.');
            }
        }).catch(() => {
            this.displayErrorMessage('Failed to fetch messages.');
        });
    };

    fetchLoans = () => {
        this.establishConnection().then(() => {
            this.transferLayer.sendRequest({
                type: "get_user_deals",
                extra: null
            }, response => {
                if (response.success) {
                    if (!response.content) return;
                    let items = parseItems(response.content);
                    items = items.map(item => {
                        return {
                            ...item,
                            dueDate: addDays(new Date(item.created_time), { days: 30 * item.period })
                                .toLocaleDateString()
                        }
                    })
                    const currentDate = new Date();
                    const loanDeals = items.filter(req => {
                        return req.borrower_username === gUsername && differenceInDays(req.dueDate, currentDate) < 15;
                    });
                    this.setState({ loans: loanDeals }, () => {
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
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
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
        <TouchableOpacity style={styles.itemContainer} onPress={() => this.confirmReading(item)} >
            <Text style={{ color: "#007BFF" }}>Sender: {item.sender}</Text>
            <Text style={{ fontSize: 16 }}>  {item.content}</Text>
        </TouchableOpacity>
    );

    renderEmpty = (title) => (
        <Text style={styles.title}>{title}</Text>
    );

    render() {
        const { loans, messages, loading } = this.state;
        const { modalVisible, onRequestClose } = this.props;
        if (loading) return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={onRequestClose}>
                <View style={styles.container}>
                    <View style={styles.modalView} >
                        <Text style={styles.title}>Loading...</Text>
                    </View>
                </View>
            </Modal>
        )

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
                        <SingleButton title="Cancel" onPress={onRequestClose} disable={false} />

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
        backgroundColor: 'rgba(250,250,250,0.6)'
    },
    modalView: {
        margin: 15,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
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
        width: windowWidth - 150,
    },
    itemContainer: {
        fontSize: 16,
        padding: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#808080',
        margin: 5,
        borderRadius: 10,
        backgroundColor: '#F0F8FF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 5,
        textAlign: 'center',
    }
});

export default NotificationBoard;
