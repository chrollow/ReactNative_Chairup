import * as SecureStore from 'expo-secure-store';
import { Alert } from "react-native";
import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Update this to your server's IP/domain - use your computer's IP on the same network
const API_URL = "http://192.168.100.11:3000/api";

export const SET_CURRENT_USER = "SET_CURRENT_USER";

// New function to fetch the cart for a specific user
export const fetchUserCart = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/carts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return null;
  }
};

export const loginUser = async (user, dispatch) => {
  if (user.email && user.password) {
    try {
      // First, clear any existing cart state to prevent session bleed
      dispatch({
        type: 'CLEAR_CART'
      });
      
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
      
      // Explicitly fetch the user's cart using their token
      const userCart = await fetchUserCart(token);
      
      if (userCart && userCart.items) {
        dispatch({
          type: 'SET_CART',
          payload: userCart.items
        });
      } else {
        // Initialize with empty cart if none found
        dispatch({
          type: 'SET_CART',
          payload: []
        });
      }
      
      return true;
    } catch (error) {
      // ... error handling ...
    }
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
  try {
    const userData = await SecureStore.getItemAsync('userData');
    const token = await SecureStore.getItemAsync('userToken');
    
    // Clear push token on server before logout
    if (token) {
      try {
        await axios.post(
          `${API_URL}/users/clear-push-token`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log("Push token cleared on server");
      } catch (err) {
        console.error("Error clearing push token:", err);
      }
    }

    // Handle Google Sign-Out
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      console.log("Google Sign-Out successful");
    } catch (err) {
      console.error("Error during Google Sign-Out:", err);
    }
    
    // Clear local storage
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    
    // Clear auth state
    dispatch({
      type: SET_CURRENT_USER,
      payload: {
        isAuthenticated: false,
        user: {}
      }
    });
    
    // Clear cart state ONLY LOCALLY
    dispatch({
      type: 'CLEAR_CART'
    });
    
    console.log("Logged out successfully");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};