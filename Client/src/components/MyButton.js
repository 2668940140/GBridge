import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LogoutIcon from '../assets/logout.png';
import HomeIcon from '../assets/home.png';
import ScoreIcon from '../assets/score.png';
import MarketIcon from '../assets/market.png';
import ProfileIcon from '../assets/profile.png';
import BellIcon from '../assets/bell.png';
import { resetNavigator } from '../utils/ResetNavigator';
import InputModal from './InputModel';

const IPSetting = () => {
  const [visibility, setVisibility] = React.useState(false);

  return (
    <TouchableOpacity onPress={() => {
      setVisibility(true);
    }} style={styles.logout}>
      <InputModal modalVisible={visibility} onConfirm={(text) => {
        console.log(text);
        global.host = text.trim();
        setVisibility(false);
      }} onRequestClose={() => setVisibility(false)} 
      title={"Enter server ip:"} 
      placeholder={global.host}
      />
    </TouchableOpacity>
  );
};

const IconButton = ({ onPress, image, selected }) => {
    return (
      <TouchableOpacity onPress={onPress}>
        <Image source={image} style={[styles.logout, selected ? 
          {backgroundColor: 'rgba(0, 123, 255, 0.6)'} : {}]} />
      </TouchableOpacity>
    );
  };

const BottomBar = ({ navigation, selected }) => {
    return (
      <View style={styles.buttonContainer}>
        <HomeButton onPress={() => resetNavigator(navigation, 'Home')} selected={selected==='Home'} />
        <MarketButton onPress={() => navigation.navigate('PersonalPage')} selected={selected==='PersonalPage'} />
        <ProfileButton onPress={() => navigation.navigate('PersonalInfo')} selected={selected==='PersonalInfo'} />
        <ScoreButton onPress={() => navigation.navigate('Score')} selected={selected==='Score'} />
      </View>
    );
  }

const NotificationButton = ({ onPress }) => {
    return (
      <IconButton onPress={onPress} image={BellIcon} />
    );
  };

const LogoutButton = ({ onPress }) => {
    return (
      <IconButton onPress={onPress} image={LogoutIcon} />
    );
  };

const HomeButton = ({ onPress, selected }) => {
    return (
      <IconButton onPress={onPress} image={HomeIcon} selected={selected}/>
    );
  }

const ScoreButton = ({ onPress, selected }) => {
    return (
      <IconButton onPress={onPress} image={ScoreIcon} selected={selected}/>
    );
  }

const MarketButton = ({ onPress, selected }) => {
    return (
      <IconButton onPress={onPress} image={MarketIcon} selected={selected}/>
    );
  }

const ProfileButton = ({ onPress, selected }) => {
    return (
      <IconButton onPress={onPress} image={ProfileIcon} selected={selected}/>
    );
  }

const MyButton = ({ title, onPress, disable}) => {
    return (
        <TouchableOpacity style={[disable ? styles.buttonDisabled : styles.buttonEnable, styles.button]} onPress={onPress} disabled={disable}>
        <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
    }

const SingleButton = ({title, onPress, disable}) => {
  return (
    <TouchableOpacity style={[disable ? styles.buttonDisabled : styles.buttonEnable, styles.button1, styles.button]} onPress={onPress} disabled={disable}>
        <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const TwoButtonsInline = ({title1, title2, onPress1, onPress2, disable1, disable2}) => {
    return (
      <View style={styles.container}>
        <MyButton title={title1} onPress={onPress1} disable={disable1}/>
        <MyButton title={title2} onPress={onPress2} disable={disable2}/>
      </View>
    );
  };
  
const styles = StyleSheet.create({
    container: {
      flexDirection: 'row', // Align children in a row
      justifyContent: 'center', // Center children horizontally in the container
      alignItems: 'center', // Align children vertically in the center
      marginTop: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    button: {
        margin: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007BFF',
        borderRadius: 20,
        shadowOpacity: 0.3,
        shadowRadius: 3,
        shadowColor: '#000',
        shadowOffset: { height: 2, width: 0 },
        elevation: 4,  // Adds depth, shadows on Android
    },
    buttonDisabled: {
        opacity: 0.8
    },
    buttonEnable:{
        opacity: 1
    },
    button1: {
      width: '30%',
    },
    buttonText: {
        color: 'white',  // Makes text color white for better visibility on blue background
        fontWeight: 'bold',  // Makes the text bold
        width: '100%',
        textAlign: 'center'
    },
    logout: {
      width: 40,
      height: 40,
      borderRadius: 5,
      padding: 2,
      marginHorizontal: 10,
      resizeMode: 'contain',
    },
  });

  export { MyButton, TwoButtonsInline, SingleButton, LogoutButton, BottomBar,
     IPSetting, NotificationButton};
  