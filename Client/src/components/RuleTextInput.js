import React, { Component } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

class RuleTextInput extends Component {
    state = {
        input: '',
        isFocused: false
    };

    handleFocus = () => {
        this.setState({ isFocused: true });
    };

    handleBlur = () => {
        this.setState({ isFocused: false });
    };

    handleChange = (input) => {
        this.setState({ input }, () => {
            this.props.onTextChange(input, this.validateText(input));
        });
    };

    validateText = (input) => {
        return this.props.check(input);
    };

    render() {
        const { input , isFocused} = this.state;
        const { placeholder, rules , secureTextEntry} = this.props;
        const isValid = this.validateText(input);
        return (
            <View style={styles.container}>
                <TextInput
                    style={[styles.input, (!isValid && input.length > 0) ? styles.inputInvalid : {}]}
                    value={input}
                    onChangeText={this.handleChange}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                    placeholder={placeholder}
                    secureTextEntry={secureTextEntry}
                />
                {input.length > 0 && (
                    <Text style={isValid ? styles.validIndicator : styles.invalidIndicator}>
                        {isValid ? '✓' : '✗'}
                    </Text>
                )}
                {isFocused && (
                    <View style={styles.rules}>
                        <Text>{rules}</Text>
                    </View>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        width: '100%',
    },
    input: {
        borderColor: 'gray',
        borderWidth: 1,
        paddingLeft: 10,
        paddingRight: 50, // Allow space for the check mark or cross
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
    rules: {
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 10,
        paddingTop: 5,
    }
});

const UsernameInput = (props) => (
    <RuleTextInput
        {...props}
        rules="Username must be 4-10 characters long and contain only letters, numbers, and underscores"
        check={(username) => {
            if(props.allowEmpty && username === '') return true;
            // Regex to match 4-10 alphanumeric characters or underscores
            const regex = /^[A-Za-z0-9_]{4,10}$/;
            return regex.test(username);
        }}
    />
);

const PasswordInput = (props) => (
    <RuleTextInput
        {...props}
        rules="Password must be 6-12 characters long"
        check={(password) => {
            if(props.allowEmpty && password === '') return true;
            // Regex to match 6-12 characters
            const regex = /^.{6,12}$/;
            return regex.test(password);
        }}
        secureTextEntry
    />
);

export { UsernameInput, PasswordInput, RuleTextInput};
