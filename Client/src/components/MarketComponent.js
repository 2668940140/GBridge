import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Modal, Image } from 'react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import BaseConComponent from './BaseConComponent';
import MultiSelect from 'react-native-multiple-select';
import { TwoButtonsInline } from './MyButton';
import { Dimensions } from 'react-native';
import parseItem from '../utils/ParseItem';
import InputModal from './InputModel';

global.windowWidth = Dimensions.get('window').width;

class MarketComponent extends BaseConComponent {
    constructor(props) {
        super(props);
        this.state = {
            type: "loan",
            items: [],
            selectedFilters: [],
            availableFilters: [
                { name: 'Full Payment', value: "Lump Sum Payment" },
                { name: 'Interest-Bearing Installments', value: "Interest-Bearing" },
                { name: 'Interest-Free Installments', value: "Interest-Free" }
            ],
            showModal: false,
            selectedItem: null,
            inputModalVisible: false,
        };
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.fetchItems();
        }).catch(() => {
            this.displayErrorMessage("Failed to establish connection.");
        });
    }

    fetchItems = async () => {
        if(!this.transferLayer || this.transferLayer.checkConnection() === false) 
        {
            console.log('Connection not established');
            return;
        }
        this.setState({ items: [] });
        const { selectedFilters, type } = this.state;
        console.log(type);
        content = selectedFilters.length === 0 ? { post_type: type === 'loan' ? 'lend' : 'borrow' } :
        {
            $and:[ 
                { post_type: type === 'loan' ? 'lend' : 'borrow' },
                { $or: selectedFilters.map(filter => ({ method: filter })) }
            ]
        }
        console.log(content);
        this.transferLayer.sendRequest({
            type: `get_market_posts`,
            content: content,
            extra: null
        }, response => {
            if (response.success) {
                if(!response.content || response.content.length == 0) return;
                this.setState({ items: parseItem(response.content).sort((a, b) => b.score - a.score) });
            } else {
                this.displayErrorMessage("Failed to fetch market items.");
            }
        });
    };

    onSelectedItemsChange = (selectedItems) => {
        this.setState({ selectedFilters: selectedItems }, () => {
            this.fetchItems();
        });       
    };

    handleItemPress = (item) => {
        this.setState({ showModal: true, selectedItem: item });
    };

    closeDialog = () => {
        this.setState({ showModal: false, selectedItem: null });
    };

    handleMatch = () => {
        this.setState({ inputModalVisible: true });
    };

    handlePost = (name) => {
        const { selectedItem } = this.state;
        if (selectedItem) {
            this.transferLayer.sendRequest({
                type: "make_deal",
                content: {
                    _id: selectedItem._id,
                    dealer: name
                },
                extra: null
            }, response => {
                if (response.success) {
                    this.displaySuccessMessage("Successful deal!");
                    this.closeInputModal();
                    this.closeDialog();
                    this.fetchItems();
                } else {
                    this.displayErrorMessage("Failed to make deal.");
                }
            });
        }
    };

    closeInputModal = () => {
        this.setState({ inputModalVisible: false });
    };

    renderItem = ({ item }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => this.handleItemPress(item)}>
            <Text>{item.poster} - {parseFloat(item.score).toFixed(3)} - {item.interest} - {item.amount} - {item.period}</Text>
        </TouchableOpacity>
    );

    renderEmptyComponent = () => {
        return (
            <View style={styles.emptyContainer}>
                <Text>No items available</Text>
            </View>
        );
    };

    switchTab = (tab) => {
        if(tab !== this.state.type){
            this.setState({ type: tab },this.fetchItems);
        }
    };

    render() {
        const { items, availableFilters, selectedFilters, showModal, type, selectedItem, inputModalVisible } = this.state;
        return (
            <View style={styles.container}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, type === 'loan' && styles.activeTab]} 
                        onPress={() => this.switchTab('loan')}
                    >
                        <Text style={styles.tabText}>Loan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, type === 'invest' && styles.activeTab]} 
                        onPress={() => this.switchTab('invest')}
                    >
                        <Text style={styles.tabText}>Invest</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.multiSelectContainer}>
                    <MultiSelect
                        items={availableFilters}
                        uniqueKey="value"
                        onSelectedItemsChange={this.onSelectedItemsChange}
                        selectedItems={selectedFilters}
                        selectText="Pick Filters"
                        searchInputPlaceholderText="Search Filters..."
                        onChangeInput={(text) => console.log(text)}
                        altFontFamily="ProximaNova-Light"
                        tagRemoveIconColor="black"
                        tagTextColor="black"
                        selectedItemTextColor="rgba(0, 123, 255, 1)"
                        selectedItemIconColor="rgba(0, 123, 255, 1)"
                        itemTextColor="black"
                        displayKey="name"
                        searchInputStyle={{ color: '#808080' }}
                        submitButtonColor="rgba(0, 123, 255, 0.8)"
                        submitButtonText="Apply"
                        styleItemsContainer={[styles.filterContainer,
                            {backgroundColor: '#F0F8FF',}
                        ]}
                        styleInputGroup={styles.inputContainer}  
                        tagContainerStyle={styles.filterContainer}                
                    />
                </View>
                <Text style={styles.title}>Post in the Market</Text>
                <Text style={styles.info}>poster-score-interest-amount-duration{"(/month)"}</Text>
                
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                <View style={styles.list}>
                    <FlatList
                    contentContainerStyle={styles.contentContainer}
                    data={items}
                    renderItem={this.renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={this.renderEmptyComponent}
                    />
                </View>
                </KeyboardAvoidingView>
                { inputModalVisible && (
                    <InputModal
                        modalVisible={inputModalVisible}
                        onConfirm={this.handlePost}
                        onRequestClose={this.closeInputModal}
                        title="Naming Your Deal"
                        placeholder="Enter your name here..."
                    />
                )}
                {showModal && selectedItem && (
                    <Modal
                        transparent={true}
                        visible={showModal}
                        onRequestClose={this.closeDialog}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Post Details</Text>
                                <Text style={styles.modalInfo}>Poster : {selectedItem.poster}</Text>
                                <Text style={styles.modalInfo}>Interest : {selectedItem.interest} /mouth</Text>
                                <Text style={styles.modalInfo}>Amount : {selectedItem.amount}</Text>
                                <Text style={styles.modalInfo}>Period : {selectedItem.period} mouths</Text>
                                <Text style={styles.modalInfo}>Method : {selectedItem.method}</Text>
                                <Text style={styles.modalInfo}>Score : {selectedItem.score}</Text>
                                {selectedItem.extra && (
                                    <>
                                    <Text style={styles.modalInfo}>Extra Info :</Text>
                                    <Image source={{ uri: selectedItem.extra }} style={styles.image} />
                                    </>                                  
                                )}
                                <Text style={styles.modalInfo}>Description</Text>
                                <Text style={styles.modalDes}>{selectedItem.description}</Text>
                                <TwoButtonsInline
                                    onPress1={this.handleMatch}
                                    title1="Match"
                                    onPress2={this.closeDialog}
                                    title2="Cancel"
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#808080'
    },
    activeTab: {
        borderBottomColor: 'blue'
    },
    multiSelectContainer: {
        paddingHorizontal: 10,
        width: windowWidth - 50,
    },
    filterContainer:{
        marginVertical: 5,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 123, 255, 0.6)',
    },
    inputContainer:{
        margin:5,
        borderBottomWidth: 2,
        borderBottomColor: '#808080'
    },
    title:{
        fontSize: 20,
        color: 'black',
        fontWeight: 'bold',
        marginVertical: 5
    },
    info:{
        fontSize: 16,
        marginVertical: 5
    },
    list:{
        flex: 1,
        borderBlockColor: 'black',
        borderWidth: 1,
        width: windowWidth - 70,
        padding: 15,
        marginVertical: 5
    },
    contentContainer: {
        padding:5,
        paddingBottom: 10,
    },
    emptyContainer: {
        fontWeight: "bold",
        fontSize: 24,
        padding: 20, // Adjust padding as needed
        alignItems: 'center', // Center the text horizontally
    },
    itemContainer: {
        fontSize: 16,
        padding: 10,
        marginVertical: 5,
        borderBottomWidth: 2,
        borderBottomColor: '#808080',
        width: windowWidth - 100,
        borderRadius: 10,
        backgroundColor: '#F0F8FF',
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 24
    },
    modalInfo: {
        marginVertical: 5,
        textAlign: "center",
        fontSize: 20
    },
    modalDes: {
        marginBottom: 10,
        fontSize: 16
    },
    image: {
        width: 100,
        height: 100,
        marginVertical: 5,
        alignSelf: 'center',
    },
});

export default MarketComponent;

