// screens/BaseInterface.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default class BaseInterface extends React.Component {

    render() {
        return  (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" style={styles.activityIndicator} />
            </View>
            );
    }

    displaySuccessMessage(message) {
        // Implementation can vary, shown here as an alert or could update state to show in UI
        alert(message); // This can be replaced with a modal or custom component
    }

    displayErrorMessage(message) {
        alert(message); // Similarly, replace with modal or another component
    }

    // More common methods can be added here
    checkResponse(expected, received) {
        if(expected !== received)
        {
            console.log("Preserved request not matched");
            console.log("expected: "+ expected+", get " + received + " instead");
            return false;
        }
        return true;
    }
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityIndicator: {
        transform: [{ scale: 1.5 }]  // Adjust scale as needed
    }
});
