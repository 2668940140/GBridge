import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const NumberInput = ({iniValue, prompt, tail, updateValue}) => {
    const [input, setInput] = useState(iniValue);  // Initial value for the TextInput
    const [isValid, setIsValid] = useState(true); // State to keep track of validity
  
    const handleInputChange = (text) => {
      setInput(text); 
      if(text.trim() !== '' && /^-?\d+(\.\d+)?$/.test(text.trim())
        && !isNaN(parseFloat(text))) {
          setIsValid(true);
          updateValue(parseFloat(text));
        }
      else{
        setIsValid(false);
        updateValue(null);
      }
    };
  
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>{prompt + ":"}</Text>
        <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, (!isValid && input.length > 0) ? styles.inputInvalid : {}]}
          keyboardType="numeric"  // Set the keyboard type to numeric
          value={input}
          placeholder={iniValue}
          onChangeText={handleInputChange}  // Update the input based on user entry
        />
        {input.length > 0 && (
                    <Text style={isValid ? styles.validIndicator : styles.invalidIndicator}>
                        {isValid ? '✓' : '✗'}
                    </Text>
                )}
        </View>
        {tail && <Text style={styles.label}>{tail}</Text>}
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'left',
      width: '100%',
    },
    inputContainer: {
      margin: 10,
      width: '55%',
    },
    input: {
        borderColor: 'gray',
        borderWidth: 1,
        paddingLeft: 10,
        paddingRight: 50, // Allow space for the check mark or cross
        paddingVertical: 5,
    },
    inputInvalid: {
        borderColor: 'red', // Highlight the border in red if invalid
    },
    validIndicator: {
        position: 'absolute',
        right: 10,
        top: 10,
        color: 'green',
        fontSize: 18,
    },
    invalidIndicator: {
        position: 'absolute',
        right: 10,
        top: 10,
        color: 'red',
        fontSize: 18,
    },
    prompt: {
      width: '25%',
      fontSize: 16,
    },
    label: {
      fontSize: 16,
    }
  });
  
  export default NumberInput;
  