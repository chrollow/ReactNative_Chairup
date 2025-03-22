import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addReview, updateReview, getProductReviews, getUserReviews } from '../../Context/Actions/Product.actions';

export const createReview = createAsyncThunk(
  'reviews/create',
  async ({ productId, reviewData }, { rejectWithValue }) => {
    try {
      const result = await addReview(productId, reviewData);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result.review;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const editReview = createAsyncThunk(
  'reviews/update',
  async ({ productId, reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const result = await updateReview(productId, reviewId, reviewData);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result.review;
    } catch (error) {
      return rejectWithValue(error.message);
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