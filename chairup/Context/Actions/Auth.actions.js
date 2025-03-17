import * as SecureStore from 'expo-secure-store';
import { Alert } from "react-native";
import axios from 'axios';

// Change to your server IP or domain
const API_URL = "http://192.168.1.39:3000/api";

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const loginUser = async (user, dispatch) => {
  if (user.email && user.password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      const { token, user: userData } = response.data;
      
      // Store token securely
      await SecureStore.setItemAsync('userToken', token);
      
      // Store user data
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      
      // Update context
      dispatch({
        type: SET_CURRENT_USER,
        payload: {
          isAuthenticated: true,
          user: userData
        }
      });
      
      return true;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      Alert.alert("Error", message);
      return false;
    }
  } else {
    Alert.alert("Error", "Please provide your credentials");
    return false;
  }
};

export const registerUser = async (userData) => {
  try {
    console.log("Attempting registration with:", userData);
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log("Registration success:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Registration error:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Status code:", error.response.status);
      return { success: false, message: error.response.data.message || "Registration failed" };
    } else if (error.request) {
      console.error("No response received");
      return { success: false, message: "No response from server" };
    } else {
      console.error("Error message:", error.message);
      return { success: false, message: error.message || "Registration failed" };
    }
  }
};

export const logoutUser = async (dispatch) => {
  await SecureStore.deleteItemAsync("userToken");
  await SecureStore.deleteItemAsync("userData");
  
  dispatch({
    type: SET_CURRENT_USER,
    payload: {
      isAuthenticated: false,
      user: {}
    }
  });
};