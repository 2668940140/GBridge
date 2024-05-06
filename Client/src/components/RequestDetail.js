import React from 'react';
import { Modal, View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';

const RequestDetail = ({ visible, onRequestClose, request, onActionPress }) => {
    const getActionButton = () => {
        switch (request.status) {
            case 'ongoing':
                return <Button title="Repay" onPress={() => onActionPress('repay')} />;
            case 'matched':
                return <Button title="Match" onPress={() => onActionPress('match')} />;
            case 'pairing':
                return <Button title="Retreat" onPress={() => onActionPress('retreat')} />;
            case 'due':
                return <Button title="Delete" onPress={() => onActionPress('delete')} />;
            default:
                return null;
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onRequestClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>Title: {request.title}</Text>
                    <Text style={styles.modalText}>Status: {request.status}</Text>
                    {/* Additional details can be added here */}
                    {getActionButton()}
                    <Button title="Close" onPress={onRequestClose} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
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
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    }
});

export default RequestDetail;
