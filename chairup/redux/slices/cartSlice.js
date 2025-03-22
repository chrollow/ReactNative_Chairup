import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(item => item.product._id === product._id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 0
      );
    },
    updateCartItem: (state, action) => {
      const { productId, quantity } = action.payload;
      const existingItem = state.items.find(item => item.product._id === productId);
      
      if (existingItem) {
        existingItem.quantity = quantity;
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 0
      );
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.product._id !== productId);
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 0
      );
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addToCart, updateCartItem, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;