import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

class EmailInput extends React.Component {
    render() {
        const { username, domain, onUsernameChange, onDomainChange, editable } = this.props;
        return (
            <View style={styles.container}>
                <TextInput
                    style={[styles.input, styles.usernameInput]}
                    onChangeText={onUsernameChange}
                    value={username}
                    placeholder="Username"
                    editable={editable}
                />
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                    style={[styles.input, styles.domainInput]}
                    onChangeText={onDomainChange}
                    value={domain}
                    placeholder="domain.com"
                    editable={editable}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    input: {
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10,
    },
    usernameInput: {
        flex: 1,
    },
    domainInput: {
        flex: 2,
    },
    atSymbol: {
        fontSize: 18,
        paddingHorizontal: 5
    }
});

export default EmailInput;
