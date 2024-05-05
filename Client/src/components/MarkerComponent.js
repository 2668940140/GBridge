import React, { Component } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import BaseComponent from './BaseComponent';
import TransferLayer from '../utils/TransferLayer';
import MultiSelect from 'react-native-multiple-select';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

// Define individual tab screens
function LoanMarket({ navigation }) {
    return <MarketList type="loan" navigation={navigation} />;
}

function InvestMarket({ navigation }) {
    return <MarketList type="invest" navigation={navigation} />;
}

class MarketComponent extends BaseComponent {
    render() {
        return (
            <Tab.Navigator>
                <Tab.Screen name="Loan" component={LoanMarket} />
                <Tab.Screen name="Invest" component={InvestMarket} />
            </Tab.Navigator>
        );
    }
}

class MarketList extends BaseComponent {
    state = {
        items: [],
        selectedFilters: [],
        availableFilters: [
            { id: 'filter1', name: 'Filter 1' },
            { id: 'filter2', name: 'Filter 2' },
            { id: 'filter3', name: 'Filter 3' }
        ],
        showModal: false,
        selectedItem: null
    };

    transferLayer = new TransferLayer();

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchItems();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    componentWillUnmount() {
        this.transferLayer.closeConnection();
    }

    fetchItems = () => {
        const { type } = this.props;
        const { selectedFilters } = this.state;
        
        transferLayer.sendRequest({
            type: `getMarketItems`,
            data: { marketType: type, filters: selectedFilters }
        }, response => {
            if (response.success) {
                this.setState({ items: response.items });
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
            <Text>{item.title} - {item.status}</Text>
        </TouchableOpacity>
    );

    render() {
        const { items, availableFilters, selectedFilters } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <MultiSelect
                    hideTags
                    items={availableFilters}
                    uniqueKey="id"
                    onSelectedItemsChange={this.onSelectedItemsChange}
                    selectedItems={selectedFilters}
                    selectText="Pick Filters"
                    searchInputPlaceholderText="Search Filters..."
                    onChangeInput={(text) => console.log(text)}
                    tagRemoveIconColor="#CCC"
                    tagBorderColor="#CCC"
                    tagTextColor="#CCC"
                    selectedItemTextColor="#CCC"
                    selectedItemIconColor="#CCC"
                    itemTextColor="#000"
                    displayKey="name"
                    searchInputStyle={{ color: '#CCC' }}
                    submitButtonColor="#48d22b"
                    submitButtonText="Apply"
                    fixedHeight={true}
                    onConfirm={this.applyFilters}
                />
                <FlatList
                    data={items}
                    renderItem={this.renderItem}
                    keyExtractor={item => item.id.toString()}
                />
                {showModal && selectedItem && (
                    <Modal
                        transparent={true}
                        visible={showModal}
                        onRequestClose={this.closeDialog}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                                <Text>{selectedItem.description}</Text>
                                <Button title="Close" onPress={this.closeDialog} />
                                <Button title="Match" onPress={this.handleMatch} color="#2196F3" />
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    itemContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
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
        fontWeight: "bold"
    }
});

export default MarketComponent;

