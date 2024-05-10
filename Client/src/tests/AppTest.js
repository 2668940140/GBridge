import React from "react";
import PersonalInfo from "../screens/PersonalInfo";
import PersonalSettings from "../screens/PersonalSettings";
import { View, StyleSheet } from "react-native";

const AppTest = () => {
    return (
        <View style={styles.container}>
            <PersonalSettings />
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default AppTest;