import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import BaseConComponent from '../components/BaseConComponent';
import { MyButton } from '../components/MyButton';
import DefaultUserIcon from '../assets/default_user_icon.png';
import DefaultOppIcon from '../assets/default_opp_icon.png';

class AdviserInterface extends BaseConComponent {
    constructor(props) {
        super(props);
        state = {
            activeUser: null,
            conversations: {}, // Messages are stored by username
            showSidebar: false,
            inputText: "",
            isLoading: false
        };
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.transferLayer.sendRequest(global.adviser, this.fetchAdvisorMessages);
        }).catch(() => {
            this.displayErrorMessage("Failed to connect to the server.");
        });
    }

    fetchAdvisorMessages = () => {
        if (response.success) {
            let { conversations } = this.state;
            response.content.forEach(({ username, message, time }) => {
                if (!conversations[username]) {
                    conversations[username] = [];
                }
                timeAll = new Date(time);
                conversations[username].push({
                    id: conversations[username].length + 1,
                    date : timeAll.toLocaleDateString(),
                    time : timeAll.toLocaleTimeString(),
                    text: message,
                    user: username,
                    opp: "adviser",
                });
            });
            this.setState({ conversations: conversations });
        } else {
            this.displayErrorMessage("Failed to login as adviser and fetch messages.");
        }
    };

    toggleSidebar = () => {
        this.setState(prevState => ({ showSidebar: !prevState.showSidebar }));
    };

    setActiveUser = (username) => {
        this.setState({ activeUser: username, panelActive: false });
    };

    renderMessageItem = ({ item }) => {
        const isUser = item.user !== "adviser";
        let icon = isUser ? DefaultUserIcon : DefaultOppIcon;
        currentDate = new Date().toLocaleDateString();
        return (
            <>
            <Text style={styles.timeText}>
                    {item.date != currentDate && (item.date + " ")}
                    {item.time}
            </Text>
            <Text style={[
                styles.infoText, isUser ? styles.userMessage : styles.responseMessage]}>
                    {item.user === gUsername ? "You" : item.user}
            </Text>
            <View style={[
                styles.messageContainer, isUser ? styles.userMessage : styles.responseMessage]}>
                <Image source={icon} style={styles.avatar} />
                <Text style={styles.messageText}>{item.text}</Text>
            </View>
            </>
        );
    };

    renderUserList = () => {
        const { conversations } = this.state;
        return (
            <View style={styles.sidebar}>
                <FlatList
                    data={Object.keys(conversations)}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.userItem} onPress={() => this.setActiveUser(item)}>
                            <Text>{item}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item}
                />
            </View>
        );
    };

    sendMessage = () => {
        this.setState({ isLoading: true });
        const { activeUser, inputText, conversations } = this.state;
        currentTime = new Date();
        let newMessage = { 
            id: conversations[activeUser].length + 1,
            date: currentTime.toLocaleDateString(),
            time: currentTime.toLocaleTimeString(),
            text: inputText,
            user: "adviser"
        };

        // Add the new message to the state
        this.setState(prevState => ({
            conversations: {
                ...prevState.conversations,
                [activeUser]: [...prevState.conversations[activeUser], newMessage]
            },
            inputText: '', // Clear the input box
            isLoading: false
        }));

        this.transferLayer.sendRequest({
            message: inputText,
            username: activeUser
        });
    };

    render() {
        const { activeUser, conversations, showSidebar,isLoading } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior="padding">
                {showSidebar && this.renderUserList()}
                <View style={styles.inputContainer} >
                    <Text style={styles.title}>{this.props.chatType} Chat with</Text>
                    <MyButton title={activeUser || "Select User"} onPress={this.toggleSidebar} />
                </View>
                <FlatList
                    data={conversations[activeUser] || []}
                    renderItem={this.renderMessageItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize:30 }}>No messages</Text>}  
                    inverted
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#888"
                        value={inputText}
                        onChangeText={text => this.setState({ inputText: text })}
                    />
                    {isLoading ? <ActivityIndicator size="small" color="#0000ff" /> : <MyButton title="Send" onPress={this.sendMessage} disable={!inputText.trim()} />}
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
    sidebar: {
        width: 200,
        backgroundColor: '#f0f0f0',
        padding: 10,
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
    infoText: {
        fontSize: 10,
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
        padding: 10
    },
    userItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
});

export default AdviserInterface;
