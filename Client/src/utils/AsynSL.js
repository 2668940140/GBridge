import AsyncStorage from '@react-native-async-storage/async-storage';

const AsynLoad = async (key) =>{
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.log(error);
    }
}

const AsynSave = async (key, value) =>{
    try {
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        console.log(error);
    }
}

const AsynRemove = async (key) =>{
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.log(error);
    }
}

export {AsynLoad, AsynSave, AsynRemove};