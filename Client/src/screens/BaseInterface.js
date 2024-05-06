// screens/BaseInterface.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default class BaseInterface extends React.Component {
    displaySuccessMessage(message) {
        // Implementation can vary, shown here as an alert or could update state to show in UI
        alert(message); // This can be replaced with a modal or custom component
    }

    displayErrorMessage(message) {
        alert(message); // Similarly, replace with modal or another component
    }

    // More common methods can be added here
    checkResponse(expected, received) {
        if(response.preserved !== "login")
        {
            console.log("Preserved request not matched");
            console.log("expected: login, get " + response.preserved + " instead");
            return false;
        }
        return true;
    }
}
