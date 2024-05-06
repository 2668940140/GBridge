import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TransferLayer from '../utils/TransferLayer';
import BaseComponent from './BaseComponent';

class ScoreBoard extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            score: null,
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.transferLayer.sendRequest({
                type: "getScore",
                content: {},
                extra: null
            }, this.handleScoreResponse);
        }).catch(error => {
            this.displayErrorMessage("Failed to connect to server: " + error.message);
            this.setState({ loading: false });
        });
    }

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    handleScoreResponse = (response) => {
        if (response.success) {
            this.setState({
                score: response.score,
                loading: false
            });
        } else {
            this.displayErrorMessage("Failed to retrieve score.");
            this.setState({ loading: false });
        }
    }

    render() {
        const { score, loading } = this.state;
        const { navigation, targetScreen } = this.props; // Ensure navigation and targetScreen are passed as props

        if (loading) {
            return this.renderLoading();
        }

        return (
            <TouchableOpacity style={styles.container} onPress={() => navigation.navigate(targetScreen)}>
                <Text style={styles.scoreLabel}>Your Score:</Text>
                <Text style={styles.score}>{score}</Text>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
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
    scoreLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    score: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007BFF'
    }
});

export default ScoreBoard;