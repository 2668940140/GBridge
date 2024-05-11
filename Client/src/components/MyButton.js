import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LogoutIcon from '../assets/logout.png';

const LogoutButton = ({ onPress }) => {
    return (
      <TouchableOpacity onPress={onPress}>
        <Image source={LogoutIcon} style={styles.logout} />
      </TouchableOpacity>
    );
  };

const MyButton = ({ title, onPress, disable}) => {
    return (
        <TouchableOpacity style={[disable ? styles.buttonDisabled : styles.buttonEnable, styles.button]} onPress={onPress} disabled={disable}>
        <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
    }

const SingleButton = ({title, onPress, disable}) => {
  return (
    <TouchableOpacity style={[disable ? styles.buttonDisabled : styles.buttonEnable, styles.button1, styles.button]} onPress={onPress} disabled={disable}>
        <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const TwoButtonsInline = ({title1, title2, onPress1, onPress2, disable1, disable2}) => {
    return (
      <View style={styles.container}>
        <MyButton title={title1} onPress={onPress1} disable={disable1}/>
        <MyButton title={title2} onPress={onPress2} disable={disable2}/>
      </View>
    );
  };
  
const styles = StyleSheet.create({
    container: {
      flexDirection: 'row', // Align children in a row
      justifyContent: 'center', // Center children horizontally in the container
      alignItems: 'center', // Align children vertically in the center
      marginTop: 20,
    },
    button: {
        margin: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007BFF',
        borderRadius: 20,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowColor: '#000',
        shadowOffset: { height: 2, width: 0 },
        elevation: 4,  // Adds depth, shadows on Android
    },
    buttonDisabled: {
        opacity: 0.8
    },
    buttonEnable:{
        opacity: 1
    },
    button1: {
      width: '30%',
    },
    buttonText: {
        color: 'white',  // Makes text color white for better visibility on blue background
        fontWeight: 'bold',  // Makes the text bold
        width: '100%',
        textAlign: 'center'
    },
    logout: {
      width: 40,
      height: 40,
      borderRadius: 5,
      margin: 10
    },
  });

  export { MyButton, TwoButtonsInline, SingleButton, LogoutButton};
  