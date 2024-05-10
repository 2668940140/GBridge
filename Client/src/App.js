import React, { useEffect, useRef } from 'react';
import { AppState, Button, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginInterface from './screens/LoginInterface';
import RegisterInterface from './screens/RegisterInterface';
import HomeScreen from './screens/HomeScreen';
import WelcomeInterface from './screens/WelcomeInterface';
import InvestmentInterface from './screens/InvestmentInterface';
import PersonalPage from './screens/PersonalPage';
import PersonalSettings from './screens/PersonalSettings';
import LoanInterface from './screens/LoanInterface';
import MatchInterface from './screens/MatchInterface';
import LoanAppDetail from './screens/LoanAppDetail';
import RepaymentInterface from './screens/RepaymentInterface';
import ScoreInterface from './screens/ScoreInterface';
import VerificationInterface from './screens/VerificationInterface';
import PersonalInfo from './screens/PersonalInfo';
import { AsynRemove } from './utils/AsynSL';
import { resetNavigator } from './utils/ResetNavigator';
import { LogoutButton } from './components/MyButton';
import Global from './config/Global';

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

function App() {
  const navigationRef = useRef();

  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'background') {
            console.log('App has gone to the background!');
            // Ideally, you might want to clear sensitive data here
            // clearAuthenticationData();
        }
    });

    return () => {
        appStateListener.remove();
    };
}, []);

const clearAuthenticationData = async () => {
    try {
        await AsynRemove('username');
        await AsynRemove('password');
        await AsynRemove('sessionToken');
        console.log('Authentication data removed from storage.');
        resetNavigator(navigationRef.current, "Welcome");
    } catch (error) {
        console.error('Failed to clear authentication data:', error);
    }
};


  return (
    <NavigationContainer ref={navigationRef} >
      <Stack.Navigator initialRouteName="PersonalInfo"  
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
        <Stack.Screen name="Investment" component={InvestmentInterface} />
        <Stack.Screen name="PersonalPage" component={PersonalPage} />
        <Stack.Screen name="PersonalSettings" component={PersonalSettings} />
        <Stack.Screen name="Loan" component={LoanInterface} />
        <Stack.Screen name="Match" component={MatchInterface} />
        <Stack.Screen name="LoanAppDetail" component={LoanAppDetail} />
        <Stack.Screen name="Repayment" component={RepaymentInterface} />
        <Stack.Screen name="Score" component={ScoreInterface} />
        <Stack.Screen name="Verification" component={VerificationInterface} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfo} />        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
