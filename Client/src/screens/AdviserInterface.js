import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, TextInput, ActivityIndicator, Modal, Image, Keyboard, AppState } from 'react-native';
import { MyButton } from '../components/MyButton';
import DefaultUserIcon from '../assets/default_user_icon.png';
import DefaultOppIcon from '../assets/default_opp_icon.png';
import BaseConInterface from './BaseConInterface';
import { preset } from '../jest.config';
import { th } from 'date-fns/locale';

class AdviserInterface extends BaseConInterface {
    constructor(props) {
        super(props);
        this.state = {
            activeUser: null,
            conversations: {}, // Messages are stored by username
            showSidebar: false,
            inputText: '',
            isLoading: false,
            appState: AppState.currentState
        };
        this.messageBox = React.createRef();
        this.intervalId = null;
    }

    handleAppStateChange = (nextAppState) => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            console.log('App has come to the foreground!');
            if (this.startApp) {
                this.fetchWithNewConnection();
                this.startApp();
            }
        } else if (nextAppState.match(/inactive|background/)) {
            console.log('App has gone to the background');
            if (this.stopApp)
                this.stopApp();
        }
        this.setState({ appState: nextAppState });
    };

    startApp = () => {
        this.intervalId = setInterval(this.fetchWithNewConnection, 5000);
    };

    stopApp = () => {
        clearInterval(this.intervalId);
    };

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            this.scrollToEnd,
        );
        this.keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            this.scrollToEnd,
        );
        this.changeAppState = AppState.addEventListener('change', this.handleAppStateChange);
        this.fetchWithNewConnection();
        this.startApp();
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        this.changeAppState.remove();
        if (this.stopApp)
            this.stopApp();
        super.componentWillUnmount();
    }

    fetchWithNewConnection = () => {
        if (this.state.isLoading) return;
        this.transferLayer.connect().then(() => {
            this.transferLayer.sendRequest(global.adviser, this.fetchAdvisorMessages);
        }).catch(() => {
            this.displayErrorMessage("Failed to connect to the server.");
        });
    }

    scrollToEnd = () => {
        this.messageBox.current?.scrollToEnd({ animated: true });
    };

    fetchAdvisorMessages = (response) => {
        if (response.success) {
            if (response.type === 'adviser_login') {
                console.log("Adviser logged in successfully.");
                return;
            }

            if (response.content) {
                let { conversations } = this.state;
                response.content.forEach((container) => {
                    const { username, msg, time } = container.content;
                    let newUser = conversations[username] ? false : true;
                    timeAll = new Date(time);
                    if (!newUser) {
                        let real_new = true;
                        conversations[username].forEach((message) => {
                            console.log(message.text);
                            if (message.text === msg) {
                                real_new = false;
                            }
                        });
                        if (!real_new)
                            return;
                    }
                    let newMessage = {
                        id: newUser ? 1 : conversations[username].length + 1,
                        date: timeAll.toLocaleDateString(),
                        time: timeAll.toLocaleTimeString(),
                        text: msg,
                        user: username,
                        opp: "adviser",
                    };
                    console.log(newMessage);
                    conversations[username] = newUser ? [newMessage] : [...conversations[username], newMessage];
                });

                this.setState({ conversations }, this.handleFetchOver);
            }
        } else {
            this.displayErrorMessage("Failed to login as adviser or fetch messages.");
            this.transferLayer.closeConnection();
        }
    };

    handleFetchOver = () => {
        this.scrollToEnd();
        this.transferLayer.closeConnection();
    };

    toggleSidebar = () => {
        this.setState(prevState => ({ showSidebar: !prevState.showSidebar }));
    };

    setActiveUser = (username) => {
        this.setState({ activeUser: username, panelActive: false });
    };

    renderMessageItem = ({ item }) => {
        const isUser = item.user === "adviser";
        let icon = isUser ? DefaultOppIcon : DefaultUserIcon;
        currentDate = new Date().toLocaleDateString();
        if (isUser) {
            return (
                <>
                    <Text style={styles.timeText}>
                        {item.date != currentDate && (item.date + " ")}
                        {item.time}
                    </Text>
                    <Text style={[styles.infoText, { textAlign: 'right' }]}>You</Text>
                    <View style={[styles.messageContainer, styles.userMessage]}>
                        <Text style={[styles.messageText, { backgroundColor: "#99CCFF" }]}>{item.text}</Text>
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
                <View style={[styles.messageContainer, styles.responseMessage]}>
                    <Image source={icon} style={styles.avatar} />
                    <Text style={[styles.messageText, { backgroundColor: "white" }]}>{item.text}</Text>
                </View>
            </>
        );
    };

    renderUserList = () => {
        const { conversations, showSidebar } = this.state;
        return (
            <Modal
                animationType='slide'
                transparent={true}
                visible={showSidebar}
                onRequestClose={this.toggleSidebar}>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <FlatList
                            data={Object.keys(conversations)}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.userItem} onPress={() => {
                                    this.setActiveUser(item);
                                    this.toggleSidebar();
                                }}>
                                    <Text style={{ fontSize: 18, }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={item => item}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 30 }}>No users</Text>}
                        />
                    </View>
                </View>
            </Modal>
        );
    };

    sendMessage = () => {
        const { activeUser, inputText, conversations } = this.state;
        if (inputText.trim() === '') {
            this.displayErrorMessage("Message cannot be empty.");
            return;
        }
        this.stopApp();
        this.setState({ isLoading: true }, () => {
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
            }), this.scrollToEnd);

            this.transferLayer.connect().then(() => {
                this.transferLayer.sendRequest(global.adviser, (response) => {
                    if (response.success) {
                        console.log("login successfully.");
                        this.transferLayer.sendRequest({
                            message: inputText,
                            username: activeUser
                        });
                    } else {
                        this.displayErrorMessage("Failed to login.");
                    }
                    this.transferLayer.closeConnection();
                    this.setState({ isLoading: false }, this.startApp);
                });
            }).catch(() => {
                this.displayErrorMessage("Failed to connect to the server.");
                this.setState({ isLoading: false }, this.startApp);
            });
        });
    };

    render() {
        const { activeUser, conversations, showSidebar, isLoading, inputText } = this.state;
        return (
            <KeyboardAvoidingView style={styles.container} behavior="padding">
                {showSidebar && this.renderUserList()}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} >
                    <Text style={styles.title}>{this.props.chatType} Chat with </Text>
                    <TouchableOpacity onPress={this.toggleSidebar}>
                        <Text style={[styles.title, { color: '#007BFF' }]}>{activeUser || 'Select a User'}</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    ref={this.messageBox}
                    style={styles.chatBox}
                    data={activeUser && conversations[activeUser] || []}
                    renderItem={this.renderMessageItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', fontSize: 30 }}>No messages</Text>}
                />
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#888"
                        value={inputText}
                        onChangeText={text => this.setState({ inputText: text })}
                    />
                    {isLoading ? <ActivityIndicator size="small" color="#0000ff" /> : <MyButton title="Send" onPress={this.sendMessage} disable={!inputText || !activeUser} />}
                </View>
            </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "right",
        marginRight: '60%',
        marginTop: 100,
        marginBottom: 50,
        width: '40%',
    },
    modalView: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        padding: 20,
        alignItems: "left",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    chatBox: {
        flex: 1,
        borderWidth: 1,
    },
    messageContainer: {
        flexDirection: 'row',
        paddingVertical: 5,
        alignItems: 'top'
    },
    userMessage: {
        justifyContent: 'flex-end',
        marginLeft: 50,
    },
    responseMessage: {
        justifyContent: 'flex-start',
        marginRight: 50,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginHorizontal: 5
    },
    messageText: {
        fontSize: 16,
        padding: 5,
        borderRadius: 5,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowColor: '#000',
        shadowOffset: { height: 2, width: 0 },
        elevation: 4,
    },
    infoText: {
        fontSize: 10,
        paddingHorizontal: 14,
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
        marginTop: 10,
    },
    userItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '100%',
    },
});

export default AdviserInterface;
