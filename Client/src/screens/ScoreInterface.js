import React, { Component } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import TransferLayer from '../utils/TransferLayer';
import BaseInterface from './BaseInterface';

class ScoreInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            score: null,
            info: '',
            suggestion: '',
            loading: true
        };
    }

    componentDidMount() {
        this.establishConnection();
        if (!this.loading) {
            this.getScoreDetails();
        }
    }

    getScoreDetails = () => {
        this.transferLayer.sendRequest({
            type: "getScoreDetails",
            content: {},
            extra: null
        }, this.handleScoreDetailsResponse);
    }

    handleScoreDetailsResponse = (response) => {
        if (response.success) {
            this.setState({
                score: response.score,
                info: response.info,
                suggestion: response.suggestion,
                loading: false
            });
        } else {
            this.displayErrorMessage("Failed to retrieve score details.");
            this.setState({ loading: false });
        }
    }

    handleAskForAdvice = () => {
        const { navigation } = this.props;
        navigation.navigate("AdviceInterface");
    }

    render() {
        const { score, info, suggestion, loading } = this.state;

        if (loading) return super.render();

        return (
            <View style={styles.container}>
                <Text style={styles.scoreLabel}>Your Score:</Text>
                <Text style={styles.score}>{score}</Text>
                <Text style={styles.info}>{info}</Text>
                <Text style={styles.suggestion}>{suggestion}</Text>
                <Button title="Ask for Advice" onPress={this.handleAskForAdvice} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    info: {
        fontSize: 16,
        color: '#333',
        marginVertical: 10,
        textAlign: 'center'
    },
    suggestion: {
        fontSize: 14,
        color: 'grey',
        marginBottom: 20,
        textAlign: 'center'
    }
});

export default ScoreInterface;
