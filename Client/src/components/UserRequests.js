import React from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import BaseComponent from './BaseComponent';
import RequestDetail from './RequestDetail';
import TransferLayer from '../utils/TransferLayer';

class UserRequests extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            loanRequests: [],
            investmentRequests: [],
            loading: true,
            selectedRequest: null,
            showModal: false
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchRequests();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    fetchRequests = () => {
        this.transferLayer.sendRequest({
            type: "getUserRequests",
            data: {}
        }, response => {
            if (response.success) {
                const loanRequests = response.requests.filter(req => req.type === 'loan').sort(this.sortByStatus);
                const investmentRequests = response.requests.filter(req => req.type === 'investment').sort(this.sortByStatus);
                this.setState({ loanRequests, investmentRequests, loading: false });
            } else {
                this.displayErrorMessage('Failed to fetch requests.');
                this.setState({ loading: false });
            }
        });
    };

    sortByStatus = (a, b) => {
        const order = { "ongoing": 1, "matched": 2, "pairing": 3, "due": 4 };
        return order[a.status] - order[b.status];
    };

    handleAction = (item) => {
        this.setState({ selectedRequest: item, showModal: true });
    };
    
    handleModalClose = () => {
        this.setState({ showModal: false });
    };
    
    handleActionPress = (actionType) => {
        console.log(actionType, 'action for', this.state.selectedRequest.title);
        this.handleModalClose();  // Close the modal after action
    };

    renderRequest = ({ item }) => (
        <TouchableOpacity style={styles.requestItem} onPress={() => this.handleAction(item)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>Status: {item.status}</Text>
        </TouchableOpacity>
    );

    render() {
        const { loanRequests, investmentRequests, loading } = this.state;
        if (loading) return this.renderLoading();
    
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Loan Requests</Text>
                <FlatList
                    data={loanRequests}
                    renderItem={this.renderRequest}
                    keyExtractor={item => item.id.toString()}
                    style={styles.list}
                />
                <Text style={styles.header}>Investment Requests</Text>
                <FlatList
                    data={investmentRequests}
                    renderItem={this.renderRequest}
                    keyExtractor={item => item.id.toString()}
                    style={styles.list}
                />
                {selectedRequest && (
                <RequestDetail
                    visible={showModal}
                    onRequestClose={this.handleModalClose}
                    request={selectedRequest}
                    onActionPress={this.handleActionPress}
                />
            )}
            </View>
        );
    }    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center'
    },
    list: {
        marginBottom: 20
    },
    requestItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold'
    }
});


export default UserRequests;