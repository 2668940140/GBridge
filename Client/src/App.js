import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginInterface from './screens/LoginInterface';
import RegisterInterface from './screens/RegisterInterface';
import HomeScreen from './screens/HomeScreen';
import WelcomeInterface from './screens/WelcomeInterface';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeInterface} />
        <Stack.Screen name="Login" component={LoginInterface} />
        <Stack.Screen name="Register" component={RegisterInterface} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
