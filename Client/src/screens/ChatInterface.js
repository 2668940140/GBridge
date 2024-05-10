import React, { Component } from 'react';
import { View, Text, TextInput, StyleSheet, Button, FlatList, Image, KeyboardAvoidingView, ScrollView } from 'react-native';
import BaseConInterface from './BaseConInterface';
import DefaultUserIcon from '../assets/default_user_icon.png';

class ChatInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            messages: [
                { id: 1, text: 'Hello', time: '10:00', userIcon: DefaultUserIcon },
                { id: 2, text: 'Hi', time: '10:01', userIcon: DefaultUserIcon },
            ],
            inputText: '',
        };
    }

    sendMessage = () => {
        const { inputText } = this.state;
    
        if (!inputText) {
            return;
        }
    
        const message = {
            type: 'send_message_to_bot',
            content: inputText,
            preserved: null, // Add any preserved data if needed
        };
    
        console.log("send request");
        this.transferLayer.sendRequest(message, this.handleSendMessageResponse);
    
        // Add the new message to the state
        this.setState(prevState => ({
            messages: [...prevState.messages, { id: Date.now(), text: inputText, time: new Date().toLocaleTimeString(), userIcon: DefaultUserIcon }],
            inputText: '', // Clear the input box
        }));
    };
    
    handleSendMessageResponse = (response) => {
        if (response.status !== 200) {
            console.error('Failed to send message:', response.error);
            return;
        }
    
        // Handle the response from the bot
        const botMessage = {
            id: Date.now(),
            text: response.content,
            time: new Date().toLocaleTimeString(),
            userIcon: DefaultUserIcon, // Replace with the bot's icon if available
        };
    
        // Add the bot's message to the state
        this.setState(prevState => ({
            messages: [...prevState.messages, botMessage],
        }));
    };


    renderMessageItem = ({ item }) => (
        <View style={styles.messageItem}>
            <Image source={item.userIcon} style={styles.userIcon} />
            <View style={styles.messageContent}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.messageTime}>{item.time}</Text>
            </View>
        </View>
    );

    handleSend = () => {
        // Add logic to send the message
        const { inputText, messages } = this.state;
        const newMessage = {
            id: messages.length + 1,
            text: inputText,
            time: new Date().toLocaleTimeString(),
            userIcon: DefaultUserIcon,
        };
        this.setState(prevState => ({
            messages: [...prevState.messages, newMessage],
            inputText: '',
        }));
    };

    render() {
        const { messages, inputText } = this.state;

        return (
            <ScrollView style={styles.container}>
                <FlatList
                    data={messages}
                    renderItem={this.renderMessageItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    inverted
                />
                <KeyboardAvoidingView behavior="padding" style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#888"
                        value={inputText}
                        onChangeText={text => this.setState({ inputText: text })}
                    />
                    <Button title="Send" onPress={this.sendMessage} />
                </KeyboardAvoidingView>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    // Add your styles here
});

export default ChatInterface;