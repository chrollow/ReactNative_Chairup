import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainNavigator from './Navigation/MainNavigator';
import AuthGlobal, { AuthContext } from './Context/Store/AuthGlobal';
import ProductProvider from './Context/Store/ProductGlobal';
import * as SecureStore from 'expo-secure-store';

const Stack = createStackNavigator();

// Create a separate Navigator component to access the AuthContext
const AppNavigator = () => {
  const { stateUser, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Add this function to check auth status on app launch
  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        dispatch({
          type: 'SET_CURRENT_USER',
          payload: {
            isAuthenticated: true,
            user: JSON.parse(userData)
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error checking auth status', error);
      return false;
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const bootstrapAsync = async () => {
      let token = null;
      try {
        token = await SecureStore.getItemAsync('userToken');
      } catch (e) {
        console.log('Failed to get token', e);
      }
      setUserToken(token);
      if (token) {
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          dispatch({
            type: 'SET_CURRENT_USER',
            payload: {
              isAuthenticated: true,
              user: parsedUserData
            }
          });
        }
      }
      setIsLoading(false);
    };

    bootstrapAsync();
    checkAuthStatus(); // Call this in useEffect at app startup
  }, [dispatch]);

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <Stack.Navigator>
      {!stateUser.isAuthenticated ? (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'ChairUp - Login' }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'ChairUp - Register' }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Main" 
          component={MainNavigator} 
          options={{ 
            headerShown: false
          }}
        />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <AuthGlobal>
        <ProductProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ProductProvider>
      </AuthGlobal>
    </View>
  );
}