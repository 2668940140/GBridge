import React from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Image, KeyboardAvoidingView, AppState, ActivityIndicator, Keyboard } from 'react-native';
import BaseConInterface from './BaseConInterface';
import { MyButton } from '../components/MyButton';
import DefaultUserIcon from '../assets/default_user_icon.png';
import DefaultOppIcon from '../assets/default_opp_icon.png';

class ChatInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            messages: [],
            inputText: '',
            loading: true,
            isLoading: false,
            appState: AppState.currentState
        };
        this.opp = "opp";
        this.messageBox = React.createRef();
    }

    handleAppStateChange = (nextAppState) => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
          console.log('App has come to the foreground!');
          if(this.startApp)
            this.startApp();
        } else if (nextAppState.match(/inactive|background/)) {
          console.log('App has gone to the background');
          if(this.stopApp)
            this.stopApp();
        }
        this.setState({ appState: nextAppState });
    };

    scrollToEnd = () => {
        this.messageBox.current?.scrollToEnd({ animated: true });
    };

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        super.componentWillUnmount();
        AppState.removeEventListener('change', this.handleAppStateChange);
        if(this.stopApp)
            this.stopApp();
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            this.scrollToEnd,
          );
        this.keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            this.scrollToEnd,
          );
        AppState.addEventListener('change', this.handleAppStateChange);
        this.establishConnection().then(() => {
            this.setState({ userIcon, gUserIcon });
            this.establishConnectionSuccess();
            if(this.startApp)
                this.startApp();
        }
        ).catch(() => {
            this.establishConnectionFailure();
        });
    }

    sendMessage = () => {
        const { inputText, messages } = this.state;
        if (inputText.trim() === ''){
            this.displayErrorMessage("Please enter a message.");
            return;
        }
        currentTime = new Date();
        let newMessage = { 
            id: messages.length + 1,
            date: currentTime.toLocaleDateString(),
            time: currentTime.toLocaleTimeString(),
            text: inputText,
            user: gUsername
        };
    
        // Add the new message to the state
        this.setState(prevState => ({
            messages: [...prevState.messages, newMessage],
            inputText: '', // Clear the input box
            isLoading: true
        }), this.scrollToEnd);

        this.forwardMessage(inputText);
    };

    renderMessageItem = ({ item }) => {
        const isUser = item.user !== this.opp;
        let icon = { uri : gUserIcon };
        if(!isUser)
            icon = DefaultOppIcon;
        if(gUserIcon === null || gUserIcon === "")
            icon = DefaultUserIcon;

        currentDate = new Date().toLocaleDateString();
        if(isUser){
            return (
                <>
                <Text style={styles.timeText}>
                    {item.date != currentDate && (item.date + " ")}
                    {item.time}
                </Text>
                <Text style={[styles.infoText, {textAlign : 'right'} ]}>You</Text>
                <View style={[styles.messageContainer, styles.userMessage]}>
                    <Text style={[styles.messageText, {backgroundColor : "#99CCFF"}]}>{item.text}</Text>
                    <Image source={icon} style={styles.avatar} />
                </View>
                </>
            );
        }
        return (
            <>
            <Text style={styles.timeText}>
                    {item.date != currentDate && (item.date + " ")}
                    {item.time}
            </Text>
            <Text style={[styles.infoText]}>{item.user}</Text>
            <View style={[styles.messageContainer,styles.responseMessage]}>
                <Image source={icon} style={styles.avatar} />
                <Text style={[styles.messageText, {backgroundColor : "white"}]}>{item.text}</Text>
            </View>
            </>
        );
    }

    render() {
        const { messages, inputText, loading, isLoading } = this.state;
        if(loading) return super.render();

        return (
            <KeyboardAvoidingView style={styles.container} behavior="padding">
                <Text style={styles.title}>{this.props.chatType} Chat</Text>
                <FlatList
                    style={styles.chatBox}
                    data={messages}
                    renderItem={this.renderMessageItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize:30 }}>No messages</Text>}  
                    ref={this.messageBox}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#888"
                        value={inputText}
                        onChangeText={text => this.setState({ inputText: text })}
                    />
                    {isLoading ? <ActivityIndicator size="small" color="#0000ff" /> : <MyButton title="Send" onPress={this.sendMessage} disable={!inputText} />}
                </View>
            </KeyboardAvoidingView>
        );
    }
};

class BotChatInterface extends ChatInterface{
    constructor(props) {
        super(props);
        this.opp = "bot";
    }

    forwardMessage = (inputText) => {
        this.transferLayer.sendRequest({
            type: "send_message_to_bot",
            content: inputText
        }, this.handleBotResponse);
    }
    
    handleBotResponse = (response) => {
        this.setState({ isLoading: false });
        if (response.success) {
            const { messages } = this.state;
            currentTime = new Date();
            const newResponse = {
                id: messages.length + 1,
                date: currentTime.toLocaleDateString(),
                time: currentTime.toLocaleTimeString(),
                text: response.content,
                user: this.opp
            };

            this.setState(prevState => ({
                messages: [...prevState.messages, newResponse]
            }), this.scrollToEnd);
        } else {
            this.displayErrorMessage("Failed to send message.");
        }
    };
}

class AdviserChatInterface extends ChatInterface {
    constructor(props) {
        super(props);
        this.opp = "adviser";
        this.intervalId = null;
    }

    startApp= () => {
        this.fetchAdvisorMessages();
        this.intervalId = setInterval(this.fetchAdvisorMessages, 5000);
      };
    
    stopApp = () => {
        clearInterval(this.intervalId);
    };

    fetchAdvisorMessages = () => {
        if(this.opp === "bot" || this.state.isLoading || this.state.loading) return;
        this.transferLayer.sendRequest({
            type: "get_adviser_conversation"
        }, (response) => {
            if (response.success) {
                let messages = response.content.map((message, index) => {
                    timeAll = new Date(message.time);
                    return {
                        id: index + 1,
                        date: timeAll.toLocaleDateString(),
                        time: timeAll.toLocaleTimeString(),
                        text: message.message,
                        user: message.username === gUsername ? gUsername : message.username
                    };
                });
                
                this.setState({ messages: messages }, this.scrollToEnd);
            }
            else {
                this.displayErrorMessage("Failed to fetch messages.");
            }
        });
    };

    forwardMessage = (inputText) => {
        this.transferLayer.sendRequest({
            type: "send_message_to_adviser",
            content: inputText
        }, this.handleAdvisorResponse);
    }

    handleAdvisorResponse = (response) => {
        this.setState({ isLoading: false });
        if (response.success) {
            console.log("sent message to advisor!");
        } else {
            this.displayErrorMessage("Failed to send message.");
        }
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        width: '100%'
    },
    chatBox: {
        flex: 1,
        borderWidth: 1,
        padding: 10,
    },
    messageContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'top'
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
        fontSize: 16,
        borderRadius: 5,
        padding: 5,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowColor: '#000',
        shadowOffset: { height: 2, width: 0 },
        elevation: 4, 
    },
    infoText: {
        fontSize: 10,
        paddingHorizontal: 10
    },
    timeText: {
        fontSize: 10,
        textAlign: 'center'
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
        padding: 10,
        fontSize: 16,
        marginTop:10,
    },
});

export { BotChatInterface, AdviserChatInterface};
