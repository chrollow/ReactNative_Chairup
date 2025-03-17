import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Image, Alert, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = "http://192.168.1.39:3000/api";

// Register for WebBrowser redirect
WebBrowser.maybeCompleteAuthSession();

const FacebookLogin = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();

  // Modified to use only public_profile
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: '1196596965367294',
    redirectUri: 'https://auth.expo.io/@donn_baldoza/chairup',
    expoClientId: '1196596965367294',
    scopes: ['public_profile'] // Removed email scope
  });

  useEffect(() => {
    console.log("Facebook response:", JSON.stringify(response, null, 2));
    if (response?.type === 'success') {
      setIsLoading(true);
      const { access_token } = response.params;
      handleFacebookAuth(access_token);
    } else if (response?.type === 'error') {
      console.error("Facebook auth error:", response.error);
      setIsLoading(false);
      Alert.alert("Authentication Error", 
        `Facebook sign-in failed: ${response.error?.description || 'Unknown error'}`);
    }
  }, [response]);

  const handleFacebookAuth = async (accessToken) => {
    try {
      // Get user data from Facebook
      console.log("Getting Facebook user data...");
      const userDataResponse = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,picture.type(large)`
      );
      const userData = await userDataResponse.json();
      console.log("Facebook user data:", JSON.stringify(userData, null, 2));
      
      // Create a unique identifier using Facebook ID
      const uniqueIdentifier = `facebook_${userData.id}@placeholder.com`;
      
      // Send to backend
      console.log("Sending data to backend...");
      const apiResponse = await axios.post(`${API_URL}/auth/facebook`, {
        email: uniqueIdentifier,
        name: userData.name,
        facebookId: userData.id,
        profileImage: userData.picture?.data?.url
      });
      
      console.log("Backend response received");
      
      // Save auth data
      await SecureStore.setItemAsync('userToken', apiResponse.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(apiResponse.data.user));
      
      // Set authenticated state
      setIsAuthenticated(true);
      setIsLoading(false);
      
      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess(apiResponse.data.user);
      }
    } catch (error) {
      console.error('Facebook auth error:', error);
      Alert.alert('Login Error', 'Could not complete authentication. Please try again.');
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Navigate to home screen directly
  const goToHomeScreen = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      {!isAuthenticated ? (
        <TouchableOpacity 
          style={styles.facebookButton}
          onPress={() => {
            setIsLoading(true);
            setError(null);
            try {
              promptAsync({showInRecents: true});
            } catch (error) {
              console.error('Error starting Facebook auth:', error);
              setIsLoading(false);
              Alert.alert('Authentication Error', 'Could not start Facebook login');
            }
          }}
          disabled={!request || isLoading}
        >
          {isLoading ? (
            <Text style={styles.facebookText}>Connecting...</Text>
          ) : (
            <>
              <Image 
                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/600px-Facebook_Logo_%282019%29.png" }} 
                style={styles.facebookIcon} 
              />
              <Text style={styles.facebookText}>Sign in with Facebook</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.facebookButton, { backgroundColor: '#4CAF50' }]}
          onPress={goToHomeScreen}
        >
          <Text style={styles.facebookText}>Continue to Home Screen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
    width: '80%',
  },
  facebookIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  facebookText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default FacebookLogin;