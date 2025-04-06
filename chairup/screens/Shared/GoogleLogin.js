import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const API_URL = "http://192.168.1.39:3000/api";

const GoogleLogin = ({ onLoginSuccess }) => {
  const navigation = useNavigation();
  const [error, setError] = useState();
  const [userInfo, setUserInfo] = useState();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "342445904600-4diarlo8slhta1kjb6cj6s3eqb2r9cjf.apps.googleusercontent.com",
    });
  }, []);

  const signin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      setUserInfo(response);
      console.log('Google User Info:', response);

      if (!response?.data?.user) {
        throw new Error('Failed to get user information');
      }

      // Send to backend with proper data structure
      const apiResponse = await axios.post(`${API_URL}/auth/google`, {
        email: response.data.user.email,
        name: response.data.user.name,
        profileImage: response.data.user.photo
      });

      // Save auth data locally
      await SecureStore.setItemAsync('userToken', apiResponse.data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(apiResponse.data.user));

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(apiResponse.data.user);
      }

      // Reset navigation to Main screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }]
      });

    } catch (e) {
      console.error('Google Sign-In Error:', e);
      Alert.alert('Error', e.message || 'Sign in failed');
      setError(e);
    }
  };

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        style={styles.googleButton}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signin}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  googleButton: {
    width: 240,
    height: 48,
  }
});

export default GoogleLogin;