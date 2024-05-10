import {launchImageLibrary} from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';

const pickImage = (resolve, title) => {
    const options = {
        title: title || 'Select Image',
        storageOptions: {
            skipBackup: true,
            path: 'images',
        },
        mediaType: 'photo',
        quality: 1,
        includeBase64: true,
    };
    
    launchImageLibrary(options, (response) => {
        if (response.didCancel) {
            console.log('User cancelled image picker');
        } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
        } else {
            resolve('data:image/jpeg;base64,' + response.assets[0].base64);
        }
    });
};

const pickCropImage = (resolve) => {
    const pickerOptions = {
        width: userIcon.width,
        height: userIcon.height,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageMaxWidth: userIcon.compressImageMaxWidth,
        compressImageMaxHeight: userIcon.compressImageMaxHeight,
        compressImageQuality: userIcon.compressImageQuality,
        includeBase64: true, 
        mediaType: 'photo',
    };

    ImagePicker.openPicker(pickerOptions)
    .then(image => {
        console.log(image);
        if (image.data) {
            resolve('data:image/jpeg;base64,' + image.data);
        }
    })
    .catch(e => {
        if (e.code === 'E_PICKER_CANCELLED') {
            console.log('User cancelled image picker');
        } else if (e.code === 'E_NO_IMAGE_SELECTED') {
            console.log('No image selected');
        } else {
            console.error('ImagePicker Error:', e);
        }
    });
};

export {pickImage, pickCropImage};