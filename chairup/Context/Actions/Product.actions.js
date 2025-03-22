import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Update this to your server's IP/domain
const API_URL = "http://192.168.1.39:3000/api";

// Get all products
export const getProducts = async () => {
  try {
    console.log("Fetching products from:", `${API_URL}/products`);
    const response = await axios.get(`${API_URL}/products`);
    console.log(`Fetched ${response.data.length} products`);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
};

// Create a new product (admin only)
export const createProduct = async (productData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.post(
      `${API_URL}/products`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, product: response.data };
  } catch (error) {
    console.error("Error creating product:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to create product" 
    };
  }
};

// Update product (admin only)
export const updateProduct = async (id, productData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.put(
      `${API_URL}/products/${id}`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, product: response.data };
  } catch (error) {
    console.error("Error updating product:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to update product" 
    };
  }
};

// Delete product (admin only)
export const deleteProduct = async (id) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    await axios.delete(
      `${API_URL}/products/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to delete product" 
    };
  }
};

// Cart and Checkout Actions
export const processCheckout = async (orderData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.post(
      `${API_URL}/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, order: response.data };
  } catch (error) {
    console.error("Error processing checkout:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to process checkout" 
    };
  }
};

// Get user's orders
export const getUserOrders = async () => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.get(
      `${API_URL}/orders/user`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, orders: response.data };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return { success: false, orders: [] };
  }
};

// Review and Rating Actions
export const addReview = async (productId, reviewData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.post(
      `${API_URL}/products/${productId}/reviews`,
      reviewData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, review: response.data };
  } catch (error) {
    console.error("Error adding review:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to add review" 
    };
  }
};

export const updateReview = async (productId, reviewId, reviewData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.put(
      `${API_URL}/products/${productId}/reviews/${reviewId}`,
      reviewData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, review: response.data };
  } catch (error) {
    console.error("Error updating review:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Failed to update review" 
    };
  }
};

export const getProductReviews = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}/products/${productId}/reviews`);
    return { success: true, reviews: response.data };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return { success: false, reviews: [] };
  }
};

export const getUserReviews = async () => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    
    const response = await axios.get(
      `${API_URL}/reviews/user`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return { success: true, reviews: response.data };
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return { success: false, reviews: [] };
  }
};