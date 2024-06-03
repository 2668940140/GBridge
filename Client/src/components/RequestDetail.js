import React from 'react';
import { Modal, View, Text, StyleSheet, Image } from 'react-native';
import { SingleButton } from './MyButton';

const RequestDetail = ({ visible, onRequestClose, request, onActionPress }) => {
    const getActionButton = () => {
        if(request.status === 'Post') {
            return (
                <SingleButton title="Delete" onPress={() => onActionPress('delete')} disable={false}/>
            );
        }else if(request.borrower_username === gUsername && request.status === 'Deal') {
            return (
                <SingleButton title="Repay" onPress={() => onActionPress('repay')} disable={false}/>
            );
        } else if(request.lender_username === gUsername && request.status === 'Deal'){ 
            return (
                <SingleButton title="Remind" onPress={() => onActionPress('remind')} disable={false}/>
            );
        }
        return null;
    };

    const getCounterParty = () => {
        if(request.borrower_username === gUsername) {
            return <Text style={styles.modalInfo}>Lender : {request.lender}</Text>
        } else {
            return <Text style={styles.modalInfo}>Borrower : {request.borrower}</Text>
        }
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onRequestClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                <Text style={styles.modalTitle}>{request.status} Details</Text>
                {request.status === 'Deal' &&  getCounterParty()}
                <Text style={styles.modalInfo}>Interest : {request.interest} /mouth</Text>
                <Text style={styles.modalInfo}>Amount : {request.amount}</Text>
                <Text style={styles.modalInfo}>Period : {request.period} mouths</Text>
                <Text style={styles.modalInfo}>Method : {request.method}</Text>
                <Text style={styles.modalInfo}>{request.status} Date : {request.date}</Text>
                {request.extra && (
                    <>
                    <Text style={styles.modalInfo}>Extra Info :</Text>
                    <Image source={{ uri: request.extra }} style={styles.image} />
                    </>                                  
                    )}
                <Text style={styles.modalInfo}>Description</Text>
                <Text style={styles.modalDes}>{request.description}</Text>
                <View style={styles.buttonContainer}>
                    {getActionButton()}
                    <SingleButton title="Close" onPress={onRequestClose} disable={false}/>
                </View>                   
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
    modalTitle: {
        marginBottom: 15,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 24
    },
    modalInfo: {
        marginVertical: 5,
        textAlign: "center",
        fontSize: 20
    },
    modalDes: {
        marginBottom: 10,
        fontSize: 16
    },
    image: {
        width: 100,
        height: 100,
        marginVertical: 5,
        alignSelf: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RequestDetail;
