import React from 'react';
import { View, Text, TextInput, StyleSheet, Button, FlatList, Image, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import TransferLayer from '../utils/TransferLayer';
import BaseInterface from './BaseInterface';

class AdviceInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            userIcon: null,
            responseIcon: null,
            messages: [],
            userInput: '',
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchinitialMessages();
        }).catch(error => {
            this.displayErrorMessage("Failed to connect to server: " + error.message);
            this.setState({ loading: false });
        });
    }

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    fetchinitialMessages = () => {
        this.transferLayer.sendRequest({
            type: "getChatIcons",
            content:{},
            extra: null
        }, this.handleInitialMessagesResponse);
    };

    handleInitialMessagesResponse = (response) => {
        if (response.success) {
            this.setState({ userIcon: response.data.userIcon, responseIcon: response.data.responseIcon });
        } else {
            this.displayErrorMessage("Failed to fetch initial messages.");
        }
        this.setState({ loading: false });
    };
    
    sendMessage = () => {
        const { userInput } = this.state;
        if (!userInput.trim()) return;
        
        const newMessage = {
            id: Date.now(),
            text: userInput,
            type: 'user'
        };
        
        this.setState(prevState => ({
            messages: [...prevState.messages, newMessage],
            userInput: '',
            loading: true
        }));

        this.transferLayer.sendRequest({
            type: "sendMessage",
            data: { message: userInput }
        }, this.handleServerResponse);
    };

    handleServerResponse = (response) => {
        this.setState({ loading: false });

        if (response.success) {
            const newResponse = {
                id: Date.now(),
                text: response.data,
                type: 'response'
            };

            this.setState(prevState => ({
                messages: [...prevState.messages, newResponse]
            }));
        } else {
            this.displayErrorMessage("Failed to send message.");
        }
    };

    renderMessageItem = ({ item }) => {
        const isUser = item.type === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.responseMessage
            ]}>
                <Image source={{ uri: isUser ? 'user_icon_placeholder' : 'response_icon_placeholder' }} style={styles.avatar} />
                <Text style={styles.messageText}>{item.text}</Text>
            </View>
        );
    };

    render() {
        const { messages, userInput, loading } = this.state;
        if(loading) return (<ActivityIndicator size="large" color="#0000ff" />);

        return (
            <KeyboardAvoidingView style={styles.container} behavior="padding">
                <Text style={styles.title}>Advice Chat</Text>
                <FlatList
                    data={messages}
                    renderItem={this.renderMessageItem}
                    keyExtractor={item => item.id.toString()}
                    style={styles.chatBox}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={userInput}
                        onChangeText={text => this.setState({ userInput: text })}
                        placeholder="Type your message here..."
                    />
                    {loading ? <ActivityIndicator size="small" color="#0000ff" /> : <Button title="Send" onPress={this.sendMessage} />}
                </View>
            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10
    },
    chatBox: {
        flex: 1,
    },
    messageContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center'
    },
    userMessage: {
        justifyContent: 'flex-end',
        marginLeft: 50
    },
    responseMessage: {
        justifyContent: 'flex-start',
        marginRight: 50
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10
    },
    messageText: {
        fontSize: 16
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10
    },
    input: {
        flex: 1,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10
    }
});

export default AdviceInterface;
