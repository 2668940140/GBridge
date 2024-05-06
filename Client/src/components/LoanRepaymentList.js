import React, { Component } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import BaseComponent from './BaseComponent';
import TransferLayer from '../utils/TransferLayer';

class LoanRepaymentList extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            loans: [],
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchLoans();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    fetchLoans = () => {
        this.transferLayer.sendRequest({
            type: "getUpcomingRepayments"
        }, response => {
            if (response.success) {
                this.setState({ loans: response.loans, loading: false });
            } else {
                this.displayErrorMessage("Failed to fetch loan data.");
                this.setState({ loading: false });
            }
        });
    };

    navigateToRepayment = (loan) => {
        const { navigation } = this.props;
        navigation.navigate('RepaymentInterface', { loanDetails: loan });
    };

    renderLoan = ({ item }) => (
        <TouchableOpacity style={styles.loanItem} onPress={() => this.navigateToRepayment(item)}>
            <Text style={styles.loanTitle}>{item.title}</Text>
            <Text>Due: {item.dueDate}</Text>
        </TouchableOpacity>
    );

    render() {
        const { loans, loading } = this.state;
        if (loading) return this.renderLoading();

        return (
            <View style={styles.container}>
                <FlatList
                    data={loans}
                    renderItem={this.renderLoan}
                    keyExtractor={item => item.id.toString()}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10
    },
    loanItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd'
    },
    loanTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    }
});

export default LoanRepaymentList;
