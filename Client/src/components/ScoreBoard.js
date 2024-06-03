import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BaseConComponent from './BaseConComponent';

class ScoreBoard extends BaseConComponent {
    constructor(props) {
        super(props);
        this.blue = {
            r: 0,
            g: 123,
            b: 255,
        };
        this.red = {
            r: 255,
            g: 44,
            b: 44,
        };
        this.state = {
            score: 0.5,
            color: this.blue,
            loading: true
        };
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.fetchScores();
        }
        ).catch(() => {
            this.establishConnectionFailure();
        });
    }

    fetchScores = () => {
        this.transferLayer.sendRequest({
            type: "estimate_score",
            content: {},
            extra: null
        }, this.handleScoreResponse);
    }

    handleScoreResponse = (response) => {
        if (response.success) {
            let color = {};
            color.r = Math.floor((1 - response.content.score) * this.red.r + response.content.score * this.blue.r);
            color.g = Math.floor((1 - response.content.score) * this.red.g + response.content.score * this.blue.g);
            color.b = Math.floor((1 - response.content.score) * this.red.b + response.content.score * this.blue.b);
            
            this.setState({
                score: response.content.score,
                color: color,
                loading: false
            });
        } else {
            this.displayErrorMessage("Failed to retrieve score.");
            this.setState({ loading: false });
        }
    }

    render() {
        const { score, loading, color } = this.state;
        const { navigation, targetScreen } = this.props; 
        let rgba = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;

        if (loading) {
            return this.renderLoading();
        }

        return (
            <TouchableOpacity style={styles.container} onPress={() => navigation.navigate(targetScreen)}>
                <Text style={styles.scoreLabel}>Your Score:</Text>
                <Text style={[styles.score, {color: rgba}]}>{score.toFixed(2)}/1.00</Text>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 10,
        padding: 10,
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
        fontSize: 20,
        fontWeight: 'bold',
    }
});

export default ScoreBoard;
