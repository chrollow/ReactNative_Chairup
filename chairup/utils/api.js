import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://192.168.1.39:3000/api'
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

export default API;