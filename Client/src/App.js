import React, { useEffect, useRef } from 'react';
import { AppState, Button, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginInterface from './screens/LoginInterface';
import RegisterInterface from './screens/RegisterInterface';
import HomeScreen from './screens/HomeScreen';
import WelcomeInterface from './screens/WelcomeInterface';
import PostInterface from './screens/PostInterface';
import PersonalPage from './screens/PersonalPage';
import PersonalSettings from './screens/PersonalSettings';
import RepaymentInterface from './screens/RepaymentInterface';
import ScoreInterface from './screens/ScoreInterface';
import VerificationInterface from './screens/VerificationInterface';
import PersonalInfo from './screens/PersonalInfo';
import AdviserInterface from './screens/AdviserInterface';
import { BotChatInterface, AdviserChatInterface } from './screens/ChatInterface';
import { AsynRemove } from './utils/AsynSL';
import { resetNavigator } from './utils/ResetNavigator';
import { LogoutButton } from './components/MyButton';
import Global from './config/Global';
import SplashScreen from "react-native-splash-screen";

const Stack = createNativeStackNavigator();

const confirmLogout = (navigation) => {
  Alert.alert(
    "Confirm Logout", // Dialog Title
    "Are you sure you want to log out?", // Dialog Message
    [
      {
        text: "Cancel",
        onPress: () => console.log("Logout canceled"),
        style: "cancel"
      },
      { 
        text: "Log Out", 
        onPress: () => {
          console.log("User logged out");
          gUsername = "";
          gPassword = "";
          sessionToken = "";
          resetNavigator(navigation, "Welcome");// Navigate to the welcome screen upon confirmation
        }
      }
    ],
    { cancelable: false } // This prevents tapping outside of the alert from dismissing it
  );
};

class App extends React.Component{

  componentDidMount() {
    SplashScreen.hide();
  }

  render(){
  return (
    <NavigationContainer >
      <Stack.Navigator initialRouteName="Welcome"  
          screenOptions={{
            headerStyle: {
              backgroundColor: 'rgba(0, 123, 255, 0.6)',
            },
            headerTitleStyle: {
              color: 'white',
              fontWeight: 'bold',
            },
            headerTitleAlign: 'center',
            headerRight: () => (
              <LogoutButton onPress={() => confirmLogout(navigationRef.current)} />
            ),
          }}
        >
        <Stack.Screen name="Welcome" component={WelcomeInterface} options={{headerRight:null}}/>
        <Stack.Screen name="Login" component={LoginInterface} options={{headerRight:null}}/>
        <Stack.Screen name="Register" component={RegisterInterface} options={{headerRight:null}}/>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Post" component={PostInterface} />
        <Stack.Screen name="PersonalPage" component={PersonalPage} />
        <Stack.Screen name="PersonalSettings" component={PersonalSettings} />
        <Stack.Screen name="Repay" component={RepaymentInterface} />
        <Stack.Screen name="Score" component={ScoreInterface} />
        <Stack.Screen name="Verification" component={VerificationInterface} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfo} />      
        <Stack.Screen name="BotChat" component={BotChatInterface} />
        <Stack.Screen name="AdviserChat" component={AdviserChatInterface} />
        <Stack.Screen name="Adviser" component={AdviserInterface} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
}

export default App;
