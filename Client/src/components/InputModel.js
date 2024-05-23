import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet } from 'react-native';
import { SingleButton } from './MyButton';

const InputModal = ({modalVisible, onConfirm, onRequestClose, title, placeholder, multiline, canNone }) => {
    const [inputText, setInputText] = useState('');
  
    return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={onRequestClose}>

          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>{title}</Text>
              <TextInput
                style={styles.textInputStyle}
                multiline={multiline}
                onChangeText={text => setInputText(text)}
                value={inputText}
                placeholder={placeholder}
              />
              <View style={styles.buttonContainer}>
                {canNone && <SingleButton title="Send" onPress={() => onConfirm(inputText)} disable={false}/> }
                {!canNone && <SingleButton title="Confirm" onPress={() => onConfirm(inputText)} disable={!inputText || inputText===""}/>}
                <SingleButton title="Cancel" onPress={onRequestClose} disable={false}/>
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
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20
    },
    textInputStyle: {
      width:'100%',
      margin: 12,
      borderWidth: 1,
      padding: 10
    },
    modalText: {
        marginBottom: 10,
        fontSize: 24
    }
  });
  
export default InputModal;