import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import BaseConComponent from './BaseConComponent';
import RequestDetail from './RequestDetail';
import parseItems from '../utils/ParseItem';
import InputModal from './InputModel';

class UserRequests extends BaseConComponent {
    constructor(props) {
        super(props);
        this.state = {
            type: "loan",
            posts: {
                loan: [],
                invest: []
            },
            deals: {
                loan: [],
                invest: []
            },
            loading: true,
            selectedRequest: null,
            showModal: false,
            reminderModal: false,
        };
    }

    switchTab = (tab) => {
        if(tab !== this.state.type){
            this.setState({ type: tab });
        }
    };

    componentDidMount() {
        this.establishConnection().then(() => {
            this.fetchRequests();
        }).catch(() => {
            this.displayErrorMessage('Failed to establish connection.');
            this.setState({ loading: false });
        });
    }

    fetchRequests = () => {
        if(!this.transferLayer || this.transferLayer.checkConnection() === false) 
        {
            console.log('Connection not established');
            return;
        }
        this.setState(
            {posts: {
                loan: [],
                invest: []
            },
            deals: {
                loan: [],
                invest: []
            },
            loading: true,
        });
        this.transferLayer.sendRequest({
            type: "get_user_posts",
            extra: null
        }, response => {
            if (response.success) {
                let items = parseItems(response.content);
                items = items.map(item => {
                    return {
                        ...item,
                        status : 'Post'
                    }
                })
                const loanPosts = items.filter(req => req.post_type === 'borrow');
                const investmentPosts = items.filter(req => req.post_type === 'lend');
                this.setState({ posts: { loan: loanPosts, invest: investmentPosts }}, () => {
                    this.transferLayer.sendRequest({
                        type: "get_user_deals",
                        extra: null
                    }, response => {
                        if (response.success) {
                            let items = parseItems(response.content);
                            items = items.map(item => {
                                return {
                                    ...item,
                                    status : 'Deal'
                                }
                            })
                            const loanDeals = items.filter(req => req.borrower_username === gUsername);
                            const investmentDeals =items.filter(req => req.lender_username === gUsername);
                            this.setState({ deals: { loan: loanDeals, invest: investmentDeals }}, () => {
                                console.log('Loan deals fetched', loanDeals);
                                console.log('Investment deals fetched', investmentDeals); 
                                this.setState({ loading: false });
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
                });
            } else {
                this.displayErrorMessage('Failed to fetch posts.');
                this.setState({ loading: false });
            }
        }).catch(() => {
            this.displayErrorMessage('Failed to fetch posts.');
            this.setState({ loading: false });
        });
    };

    handleAction = (item) => {
        this.setState({ selectedRequest: item, showModal: true });
    };
    
    handleModalClose = () => {
        this.setState({ showModal: false });
    };
    
    deleteRequest = () => {
        const { selectedRequest } = this.state;
        this.transferLayer.sendRequest({
            type: 'withdraw_market_post',
            content: { _id : selectedRequest._id},
            extra: null
        }, response => {
            if (response.success) {
                this.displaySuccessMessage('Request deleted successfully.');
                this.fetchRequests();
            } else {
                this.displayErrorMessage('Failed to delete request.');
            }
        }).catch(() => {
            this.displayErrorMessage('Failed to delete request.');
        });
    };

    repayRequest = () => {
        const { selectedRequest } = this.state;
        this.props.navigation.navigate('Repay', { item: selectedRequest });
    };

    remindRequest = () => {
        this.setState({ reminderModal: true });
    };

    handleReminder = (message) => {
        const { selectedRequest } = this.state;
        this.transferLayer.sendRequest({
            type: 'send_notification',   
            content: {
                receiver: selectedRequest.borrower_username,
                content: message
            },
            extra: null
        }, response => {
            if (response.success) {
                this.displaySuccessMessage('Message sent successfully.');
            } else {
                this.displayErrorMessage('Failed to send message.');
            }
        }).catch(() => {
            this.displayErrorMessage('Failed to send message.');
        });
        this.handleReminderModalClose();  // Close the modal after sending message
    };

    handleReminderModalClose = () => {
        this.setState({ reminderModal: false });
    };

    handleActionPress = (actionType) => {
        console.log(actionType, 'action for', this.state.selectedRequest.id);
        switch(actionType) {
            case 'delete':
                this.deleteRequest();
                break;
            case 'repay':
                this.repayRequest();
                break;
            case 'remind':
                this.remindRequest();
                break;
            default:
                break;
        };
        this.handleModalClose();  // Close the modal after action
    };

    renderRequest = ({ item }) => (
        <TouchableOpacity style={styles.requestItem} onPress={() => this.handleAction(item)}>
            <Text style={styles.title}>{item.status === 'Post' && (item.score + " - ")}{item.amount} - {item.period} - {item.date}</Text>
        </TouchableOpacity>
    );

    renderEmptyComponent = () => {
        return (
            <View style={styles.emptyContainer}>
                <Text>No request available</Text>
            </View>
        );
    };

    render() {
        const { loading, type, posts, deals, selectedRequest, showModal, reminderModal } = this.state;
        if (loading) return this.renderLoading();
    
        return (
            <View style={styles.container}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, type === 'loan' && styles.activeTab]} 
                        onPress={() => this.switchTab('loan')}
                    >
                        <Text style={styles.tabText}>Loan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, type === 'invest' && styles.activeTab]} 
                        onPress={() => this.switchTab('invest')}
                    >
                        <Text style={styles.tabText}>Invest</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.header}>{type} Posts</Text>
                <Text style={[styles.header, {fontSize : 16}]}>score - amount - period {"(/mouth)"} - date</Text>
                <FlatList
                    data={posts[type]}
                    renderItem={this.renderRequest}
                    keyExtractor={item => item.id }
                    style={styles.list}
                    ListEmptyComponent={this.renderEmptyComponent}
                />
                <Text style={styles.header}>{type} Deals</Text>
                <Text style={[styles.header, {fontSize : 16}]}>amount - period {"(/mouth)"} - date</Text>
                <FlatList
                    data={deals[type]}
                    renderItem={this.renderRequest}
                    keyExtractor={item => item.id }
                    style={styles.list}
                    ListEmptyComponent={this.renderEmptyComponent}
                />
                {showModal && selectedRequest && (
                <RequestDetail
                    visible={showModal}
                    onRequestClose={this.handleModalClose}
                    request={selectedRequest}
                    onActionPress={this.handleActionPress}
                />
                )}
                { reminderModal && (
                <InputModal
                    visible={reminderModal}
                    multiline={true}
                    title={"Send message to " + selectedRequest.borrower}
                    placeholder="Enter your message here"
                    onConfirm={this.handleReminder}
                    onRequestClose={this.handleReminderModalClose} />
                )}
            </View>
        );
    }    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        paddingBottom: 0,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#808080'
    },
    activeTab: {
        borderBottomColor: 'blue'
    },
    header: {
        margin:5,
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center'
    },
    list: {
        flex: 1,
        borderBlockColor: 'black',
        borderWidth: 1,
        margin: 5
    },
    emptyContainer: {
        fontWeight: "bold",
        fontSize: 24,
        padding: 20, // Adjust padding as needed
        alignItems: 'center', // Center the text horizontally
    },
    requestItem: {
        margin:5,
        padding: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#808080',
        borderRadius: 10,
        backgroundColor: '#F0F8FF',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold'
    }
});


export default UserRequests;