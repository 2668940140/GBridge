import React, { useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Modal, Button } from 'react-native';
import BaseConComponent from './BaseConComponent';
import MultiSelect from 'react-native-multiple-select';
import { TwoButtonsInline } from './MyButton';

class MarketComponent extends BaseConComponent {
    constructor(props) {
        super(props);
        this.state = {
            type: "loan",
            items: [],
            selectedFilters: [],
            availableFilters: [
                { id: 'filter1', name: 'Full Payment', value: "Lump Sum Payment" },
                { id: 'filter2', name: 'Interest-Bearing Installments', value: "Interest-Bearing" },
                { id: 'filter3', name: 'Interest-Free Installments', value: "Interest-Free" }
            ],
            showModal: false,
            selectedItem: null
        };
    }

    componentDidMount() {
        this.establishConnection().then(() => {
            this.fetchItems();
        }).catch(() => {
            this.displayErrorMessage("Failed to establish connection.");
        });
    }

    fetchItems = () => {
        const { type } = this.props;
        const { selectedFilters } = this.state;
        content = {
            $and:[ 
                { post_type: type},
                { $or: selectedFilters.map(filter => ({ method: filter.value })) }
            ]
        }

        this.transferLayer.sendRequest({
            type: `get_market_posts`,
            content: content,
            extra: null
        }, response => {
            if (response.success) {
                this.setState({ items: response.content });
            } else {
                this.displayErrorMessage("Failed to fetch market items.");
            }
        });
    };

    onSelectedItemsChange = (selectedItems) => {
        this.setState({ selectedFilters: selectedItems });
    };

    applyFilters = () => {
        this.fetchItems();
    };

    handleItemPress = (item) => {
        this.setState({ showModal: true, selectedItem: item });
    };

    closeDialog = () => {
        this.setState({ showModal: false, selectedItem: null });
    };

    handleMatch = () => {
        const { selectedItem } = this.state;
        if (selectedItem) {
            this.transferLayer.sendRequest({
                type: "matchItem",
                data: { itemId: selectedItem.id }
            }, response => {
                if (response.success) {
                    this.displaySuccessMessage("Match successful!");
                    this.closeDialog();
                } else {
                    this.displayErrorMessage("Failed to make a match.");
                }
            });
        }
    };

    renderItem = ({ item }) => (
        <TouchableOpacity style={styles.itemContainer} onPress={() => this.handleItemPress(item)}>
            <Text>{item.poster} - {item.interest} - {item.amount} - {item.period}</Text>
        </TouchableOpacity>
    );

    switchTab = (tab) => {
        this.setState({ type: tab });
    };

    render() {
        const { items, availableFilters, selectedFilters, showModal, type, selectedItem } = this.state;
        console.log(availableFilters);
        console.log(type);
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
                        uniqueKey="id"
                        onSelectedItemsChange={this.onSelectedItemsChange}
                        selectedItems={selectedFilters}
                        selectText="Pick Filters"
                        searchInputPlaceholderText="Search Filters..."
                        onChangeInput={(text) => console.log(text)}
                        altFontFamily="ProximaNova-Light"
                        tagRemoveIconColor="blacks"
                        tagTextColor="black"
                        selectedItemTextColor="rgba(0, 123, 255, 1)"
                        selectedItemIconColor="rgba(0, 123, 255, 1)"
                        itemTextColor="black"
                        displayKey="name"
                        searchInputStyle={{ color: '#808080' }}
                        submitButtonColor="rgba(0, 123, 255, 0.8)"
                        submitButtonText="Apply"
                        styleItemsContainer={[styles.filterContainer,
                            {backgroundColor: '#e0e0e0',}
                        ]}
                        styleInputGroup={styles.inputContainer}  
                        tagContainerStyle={styles.filterContainer}                
                    />
                </View>
                <Text style={styles.title}>Post in the Market</Text>
                <Text style={styles.info}>poster-interest-amount-duration{"(per mouth)"}</Text>
                <FlatList
                    style={styles.list}
                    data={items}
                    renderItem={this.renderItem}
                    keyExtractor={item => item.interest.toString()}
                />
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
                                {selectedItem.extra && (
                                    <>
                                    <Text style={styles.modalInfo}>Extra Info :</Text>
                                    <Image source={{ uri: extra }} style={styles.image} />
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
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
    tabText: {
        color: 'black'
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
        fontSize: 18,
        borderBottomWidth: 2,
        borderBottomColor: '#808080'
    },
    title:{
        fontSize: 20,
        color: 'black',
        fontWeight: 'bold',
        marginVertical: 10
    },
    title:{
        fontSize: 16,
        marginVertical: 10
    },
    list:{
        borderBlockColor: 'black',
        borderWidth: 1,
        width: windowWidth - 70,
        padding: 15,
        marginVertical: 5
    },
    itemContainer: {
        fontSize: 16,
        padding: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#808080',
        width: windowWidth - 100,
        borderRadius: 10,
        backgroundColor: '#e0e0e0',
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

