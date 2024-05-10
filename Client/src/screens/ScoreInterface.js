import React, { Component } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import BaseConInterface from './BaseConInterface';

class ScoreInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            score: null,
            info: null,
            suggestion: '',
            loadingInfo: true,
            loadingScore: true,
            loadingSuggestions: true,
            loading: true
        };
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.getScore();
        }
        ).catch(() => {
            this.establishConnectionFailure();
        });
    }

    getScore = () => {
        this.transferLayer.sendRequest({
            type: "estimate_score",
            content: {},
            extra: null
        }, this.handleScoreDetailsResponse);
    }

    handleScoreDetailsResponse = (response) => {
        if (response.success) {
            this.setState({
                score: response.content.score,
                loadingScore: false
            });
            this.getInfo();
        } else {
            this.displayErrorMessage("Failed to retrieve score details.");
        }
    }

    getSuggestions = () => {
        this.transferLayer.sendRequest({
            type: "get_bot_evaluation",
            content: {},
            extra: null
        }, this.handleSuggestionsResponse);
    }

    handleSuggestionsResponse = (response) => {
        if (response.success) {
            this.setState({
                suggestion: response.content,
                loadingSuggestions: false
            });
        } else {
            this.displayErrorMessage("Failed to retrieve suggestions.");
        }
    }

    getInfo = () => {
        this.transferLayer.sendRequest({
            type: "get_user_info",
            content: [
                "cash",
                "income",
                "expenditure",
                "debt",
                "assets",
            ],
            extra: null
        }, this.handleInfoResponse);
    }

    handleInfoResponse = (response) => {
        if (response.success) {
            this.setState({
                info: response.content,
                loadingInfo: false
            });
            this.getSuggestions();
        } else {
            this.displayErrorMessage("Failed to retrieve user information.");
        }
    }

    handleAskForAdvice = () => {
        const { navigation } = this.props;
        navigation.navigate("Chat");
    }

    render() {
        const { score, info, suggestion, loadingInfo, loadingScore,loadingSuggestions } = this.state;
        const { cash, income, expenditure, debt, assets } = info || {};

        if (loadingInfo || loadingSuggestions || loadingScore) return super.render();

        return (
            <View style={styles.container}>
                <Text style={styles.info}>Your Score: {score.toFixed(2)}/1.00</Text>
                <Text style={styles.info}>Cash: ${cash ? cash.toString() : 'NO INFO'}</Text>
                <Text style={styles.info}>Income: ${income ? income.toString() : 'NO INFO' }/month</Text>
                <Text style={styles.info}>Expenditure: ${expenditure ? expenditure.toString() : 'NO INFO'}/month</Text>
                <Text style={styles.info}>Debt: ${debt ? debt.toString() : 'NO INFO'}</Text>
                <Text style={styles.info}>Assets: ${assets ? assets.toString() : 'NO INFO'}</Text>
                <ScrollView style={styles.suggestionBoard}>
                    <Text style={styles.suggestionTitle}>Evaluation from bot: </Text>
                    <Text style={styles.suggestion}>{suggestion}</Text>
                </ScrollView>
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
        justifyContent: 'left',
        backgroundColor: '#FFFFFF'
    },
    info: {
        fontSize: 16,
        color: '#333',
        marginVertical: 10,
        textAlign: 'center'
    },
    suggestionBoard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 20
    },
    suggestionTitle: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        textAlign: 'center'
    },
    suggestion: {
        fontSize: 14,
        color: 'grey',
        marginBottom: 20,
    }
});

export default ScoreInterface;
