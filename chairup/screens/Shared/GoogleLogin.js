import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, Image, Alert, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

const API_URL = "http://192.168.1.39:3000/api";

// Register for WebBrowser redirect
WebBrowser.maybeCompleteAuthSession();

const GoogleLogin = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();

  // Get this value from app.json
  const CLIENT_ID = '562957089179-v0glkbdo2sc169prvf84hhrdi0p2rouj.apps.googleusercontent.com';
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: CLIENT_ID,
    iosClientId: CLIENT_ID,
    expoClientId: CLIENT_ID,
    webClientId: CLIENT_ID,
    redirectUri: 'https://auth.expo.io/@donn_baldoza/chairup',
  });

  useEffect(() => {
    if (request) {
      console.log("Auth request ready with redirect:", request.redirectUri);
    } else {
      console.log("Auth request not ready yet");
    }
    
    if (response) {
      console.log("Full response:", JSON.stringify(response));
    }
  }, [request, response]);

  useEffect(() => {
    console.log('Constants.linkingUri:', Constants.linkingUri);
    console.log('Constants.experienceUrl:', Constants.experienceUrl);
    console.log('Current redirectUri:', request?.redirectUri);
  }, [request]);

  useEffect(() => {
    console.log("Google response type:", response?.type);
    if (response?.type === 'success') {
      setIsLoading(true);
      handleGoogleAuth(response.authentication);
    } else if (response?.type === 'error') {
      console.error("Google auth error:", response.error);
      setIsLoading(false);
      Alert.alert('Authentication Error', 'Google sign-in failed');
    }
  }, [response]);

  const handleGoogleAuth = async (authentication) => {
    try {
      const { accessToken, idToken } = authentication;
      
      // Get user info
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userData = await userInfoResponse.json();

      // Send to your backend
      const apiResponse = await axios.post(`${API_URL}/auth/google`, {
        email: userData.email,
        name: userData.name,
        profileImage: userData.picture
      });

      // Save auth data
      await SecureStore.setItemAsync('userToken', apiResponse.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(apiResponse.data.user));

      // Set authenticated state
      setIsAuthenticated(true);
      setIsLoading(false);

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(apiResponse.data.user);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Login Error', 'Could not complete authentication. Please try again.');
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
          style={styles.googleButton}
          onPress={() => {
            setIsLoading(true);
            promptAsync({ showInRecents: true })
              .catch(error => {
                console.error("Error launching Google auth:", error);
                setIsLoading(false);
                Alert.alert('Authentication Error', 'Could not start Google login');
              });
          }}
          disabled={!request || isLoading}
        >
          {isLoading ? (
            <Text style={styles.googleText}>Connecting...</Text>
          ) : (
            <>
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.googleButton, { backgroundColor: '#4CAF50' }]}
          onPress={goToHomeScreen}
        >
          <Text style={[styles.googleText, { color: 'white' }]}>Continue to Home Screen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
    width: '80%',
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  googleText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GoogleLogin;