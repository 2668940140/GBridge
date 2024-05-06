import React from 'react';
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

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeInterface} />
        <Stack.Screen name="Login" component={LoginInterface} />
        <Stack.Screen name="Register" component={RegisterInterface} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
