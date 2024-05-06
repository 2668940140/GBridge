import React from "react";
import RuleTextInput from "../components/RuleTextInput";
import { View } from "react-native";

const AppTest = () => {
    const [name, setName] = React.useState("");
    const [nameValid, setNameValid] = React.useState(false);
    
    const validateName = (name) => {
        return name.length > 4;
    }

    return (
        <View>
            <RuleTextInput 
                placeholder="Enter your name"
                rules="name"
                check={validateName}
                onTextChange={(text, isValid) => {
                    setName(text);
                    setNameValid(isValid);
                }}
            />
        </View>
    )
};


export default AppTest;