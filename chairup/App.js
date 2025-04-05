import React, { useState, useEffect, useContext, useRef } from 'react';
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
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { fetchUserCart } from './Context/Actions/Product.actions';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { createRef } from 'react';
import { savePushTokenToServer } from './utils/notifications';

// Create a navigation ref
export const navigationRef = createRef();

const Stack = createStackNavigator();

// Configure notifications to show alerts when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications (add this function to your App component)
async function registerForPushNotificationsAsync() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);
    
    // Save token to server
    await savePushTokenToServer(token);
  } else {
    alert('Must use physical device for push notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4a6da7',
    });
  }

  return token;
}

// Create a separate Navigator component to access the AuthContext
const AppNavigator = () => {
  const { stateUser, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Modify the checkAuthStatus function
  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        // Set authenticated user
        dispatch({
          type: 'SET_CURRENT_USER',
          payload: {
            isAuthenticated: true,
            user: JSON.parse(userData)
          }
        });
        
        // Fetch and set cart
        const cartResult = await fetchUserCart();
        if (cartResult.success) {
          dispatch({
            type: 'SET_CART',
            payload: cartResult.cart
          });
        }
        
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
          
          // Update push token whenever app starts with a valid user
          registerForPushNotificationsAsync();
        }
      }
      setIsLoading(false);
    };
    
    bootstrapAsync();
  }, []);

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
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync();

    // This listener handles notifications received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received in foreground:', notification);
      }
    );

    // This listener handles when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        
        if (data.orderId) {
          // Navigate to order details (existing code)
          navigationRef.current.navigate('ProductNavigator', {
            screen: 'OrderDetails',
            params: { orderId: data.orderId }
          });
        } 
        else if (data.promotionId) {
          // Correctly navigate through the nested structure
          navigationRef.current.navigate('Main', {
            screen: 'ProductNavigator',
            params: {
              screen: 'Home',
              params: { 
                promoCode: data.code,
                showPromoModal: true
              }
            }
          });
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <AuthGlobal>
          <ProductProvider>
            <NavigationContainer ref={navigationRef}>
              <AppNavigator />
            </NavigationContainer>
          </ProductProvider>
        </AuthGlobal>
      </View>
    </Provider>
  );
}