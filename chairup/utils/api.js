import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://192.168.100.11:3000/api'
});

// Add request interceptor to automatically include auth token
API.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't modify Content-Type if it's form data
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get user's cart
export const getUserCart = async () => {
  try {
    const response = await API.get('/carts');
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

// Add/update cart item
export const updateCartItem = async (productId, quantity) => {
  try {
    const response = await API.post('/carts/items', { productId, quantity });
    return response.data;
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
};

// Remove item from cart
export const removeCartItem = async (productId) => {
  try {
    const response = await API.delete(`/carts/items/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const response = await API.delete('/carts');
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

export default API;