import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProductReviews, getUserReviews } from '../../Context/Actions/Product.actions';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.100.11:3000';

export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({productId, reviewData}, {rejectWithValue}) => {
    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        return rejectWithValue('Authentication required. Please log in again.');
      }
      
      // Set timeout to 10 seconds to avoid long waiting
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // Add the token to headers
        },
        timeout: 10000 // 10 seconds timeout
      };
      
      console.log('Sending review data to server:', {
        url: `${BASE_URL}/api/products/${productId}/reviews`,
        data: reviewData
      });
      
      const response = await axios.post(
        `${BASE_URL}/api/products/${productId}/reviews`, 
        reviewData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Review creation error details:', error.message);
      // If there's a response with an error message
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      // Network errors or other issues
      return rejectWithValue('Network error - please check your connection and try again');
    }
  }
);

export const editReview = createAsyncThunk(
  'reviews/update',
  async ({ productId, reviewId, reviewData }, { rejectWithValue }) => {
    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('userToken');
      
      if (!token) {
        return rejectWithValue('Authentication required. Please log in again.');
      }
      
      // Set the same configuration as createReview
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // 10 seconds timeout
      };
      
      console.log('Sending update review data to server:', {
        url: `${BASE_URL}/api/products/${productId}/reviews/${reviewId}`,
        reviewId: reviewId
      });
      
      const response = await axios.put(
        `${BASE_URL}/api/products/${productId}/reviews/${reviewId}`, 
        reviewData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Review update error details:', error.message);
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('Network error - please check your connection and try again');
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchByProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const result = await getProductReviews(productId);
      if (!result.success) {
        return rejectWithValue('Failed to fetch reviews');
      }
      return { productId, reviews: result.reviews };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  'reviews/fetchByUser',
  async (_, { rejectWithValue }) => {
    try {
      const result = await getUserReviews();
      if (!result.success) {
        return rejectWithValue('Failed to fetch your reviews');
      }
      return result.reviews;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    productReviews: {}, // { productId: [reviews] }
    userReviews: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        const review = action.payload;
        const productId = review.productId;
        
        // Add to product reviews if we have them loaded
        if (state.productReviews[productId]) {
          state.productReviews[productId].unshift(review);
        }
        
        // Add to user reviews
        state.userReviews.unshift(review);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editReview.fulfilled, (state, action) => {
        state.loading = false;
        const updatedReview = action.payload;
        const productId = updatedReview.productId;
        
        // Update in product reviews if loaded
        if (state.productReviews[productId]) {
          const index = state.productReviews[productId].findIndex(
            r => r._id === updatedReview._id
          );
          if (index !== -1) {
            state.productReviews[productId][index] = updatedReview;
          }
        }
        
        // Update in user reviews
        const userIndex = state.userReviews.findIndex(
          r => r._id === updatedReview._id
        );
        if (userIndex !== -1) {
          state.userReviews[userIndex] = updatedReview;
        }
      })
      .addCase(editReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, reviews } = action.payload;
        state.productReviews[productId] = reviews;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.userReviews = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default reviewSlice.reducer;