import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import BaseInterface from './BaseInterface';
import TransferLayer from '../utils/TransferLayer';

class LoanInterface extends BaseInterface {
    constructor(props) {
        super(props);
        this.state = {
            selectedLoanProduct: null,
            loanProducts: [],
            loading: true
        };
        this.transferLayer = new TransferLayer();
    }

    componentDidMount() {
        this.transferLayer.connect().then(() => {
            this.fetchLoanProducts();
        }).catch(error => {
            this.setState({ loading: false });
            this.displayErrorMessage("Failed to connect to server: " + error.message);
        });
    }

    componentWillUnmount() {
        this.transferLayer.disconnect();
    }

    fetchLoanProducts = () => {
        this.transferLayer.sendRequest({
            type: "getLoanProducts"
        }, (response) => {
            this.setState({ loading: false });
            if (response.success) {
                this.setState({ loanProducts: response.products });
            } else {
                this.displayErrorMessage('Failed to fetch loan products.');
            }
        });
    };

    selectLoanProduct = (itemValue, itemIndex) => {
        this.setState({ selectedLoanProduct: itemValue });
    };

    navigateToLoanApplication = () => {
        const { navigation } = this.props;
        const { selectedLoanProduct } = this.state;
        if (selectedLoanProduct) {
            navigation.navigate('LoanAppDetail', { selectedLoanProduct });
        } else {
            alert('Please select a loan product.');
        }
    };

    render() {
        const { loanProducts, selectedLoanProduct } = this.state;

        return (
            <View style={styles.container}>
                <Text>Select a loan product:</Text>
                {loading && <ActivityIndicator size="large" />}
                {!loading && <Picker
                    selectedValue={selectedLoanProduct}
                    onValueChange={this.selectLoanProduct}>
                    {loanProducts.map(product => (
                        <Picker.Item key={product.id} label={product.name} value={product.id} />
                    ))}
                </Picker>
                }   
                <Button title="Apply" onPress={this.navigateToLoanApplication} />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20
    }
});

export default LoanInterface;
