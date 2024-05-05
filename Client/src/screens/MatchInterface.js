import React, { Component } from 'react';
import { View, Text, Button, Modal, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import BaseInterface from './BaseInterface';
import TransferLayer from '../utils/TransferLayer';

class MatchInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            matchData: null,
            showTermsModal: false,
            showRejectConfirm: false,
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchMatchData();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    componentWillUnmount() {
        this.transferLayer.disconnect();
    }

    fetchMatchData = () => {
        this.transferLayer.sendRequest({
            type: "getMatchDetail",
            content:{},
            extra: null
        }, (response) => { 
            this.setState({ matchData: response.content, loading: false });
        });
    }

    handleAccept = () => {
        this.setState({ showTermsModal: true });
    };

    handleReject = () => {
        Alert.alert(
            "Confirm Reject",
            "Are you sure you want to reject this match?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => {
                    this.forwardAction("reject", () => {
                        this.props.navigation.goBack();
                    });
                }, style: "destructive" },
            ]
        );
    };

    handleCommunicate = () => {
        this.forwardAction("communicate", () => {
            const { navigation } = this.props;
            navigation.navigate('ChatInterface');
        });
    };

    forwardAction = (action, goon) => {
        this.transferLayer.sendRequest({
            type: "matchAction",
            content: {
                action: action
            },
            extra: null
        }, (response) => {
            console.log("Action completed: " + action);
            if (goon) {
                goon();
            }
        });
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Match Details</Text>
                <Text>Match Data: {!loading ? JSON.stringify(this.state.matchData) : "Loading..."}</Text>
                <View style={styles.buttonContainer}>
                    <Button title="Accept" onPress={this.handleAccept} />
                    <Button title="Reject" onPress={this.handleReject} />
                    <Button title="Communicate" onPress={this.handleCommunicate} />
                </View>

                {this.state.showTermsModal && (
                    <Modal
                        transparent={true}
                        visible={this.state.showTermsModal}
                        onRequestClose={() => this.setState({ showTermsModal: false })}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <Text style={styles.modalText}>Terms and Conditions</Text>
                                <TouchableOpacity
                                    style={styles.buttonClose}
                                    onPress={() => this.setState({ showTermsModal: false })}
                                >
                                    <Text style={styles.textStyle}>Close</Text>
                                </TouchableOpacity>
                                <Button title="Accept Terms" onPress={() => {
                                    this.forwardAction("accept", () => {
                                        this.setState({ showTermsModal: false });
                                        this.props.navigation.goBack();
                                    });
                                }} />
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center'
    },
    buttonClose: {
        backgroundColor: "#2196F3",
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginBottom: 10
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    }
});

export default MatchInterface;
