// components/BaseInterface.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native';

export default class BaseComponent extends React.Component {
    displaySuccessMessage(message) {
        // Implementation can vary, shown here as an alert or could update state to show in UI
        alert(message); // This can be replaced with a modal or custom component
    }

    displayErrorMessage(message) {
        alert(message); // Similarly, replace with modal or another component
    }

    // More common methods can be added here
    renderLoading() {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
