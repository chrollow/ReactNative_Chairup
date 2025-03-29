export const ProductReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.payload
      };
      
    case 'ADD_TO_CART':
      const { product, quantity } = action.payload;
      
      // Check if product is already in cart
      const existItem = state.cart.find(item => item.product._id === product._id);
      
      if (existItem) {
        // If exists, update quantity
        return {
          ...state,
          cart: state.cart.map(item => 
            item.product._id === product._id 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      } else {
        // Add new item to cart
        return {
          ...state,
          cart: [...state.cart, { product, quantity }]
        };
      }
      
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product._id !== action.payload)
      };
      
    case 'CLEAR_CART':
      return {
        ...state,
        cart: []
      };
      
    case 'UPDATE_CART_ITEM':
      const { productId, newQuantity } = action.payload;
      
      if (newQuantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.product._id !== productId)
        };
      }
      
      return {
        ...state,
        cart: state.cart.map(item => 
          item.product._id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      };
      
    case 'SET_CART':
      return {
        ...state,
        cart: action.payload
      };
      
    default:
      return state;
  }
};