export default function productReducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      // This is the action we dispatch after fetching products from API
      return {
        ...state,
        products: action.payload
      };
    
    case 'ADD_TO_CART':
      // Check if product already exists in cart
      const existingProductIndex = state.cart.findIndex(
        item => item.product.id === action.payload.product.id
      );
      
      if (existingProductIndex >= 0) {
        // Product exists in cart, update quantity
        const updatedCart = [...state.cart];
        updatedCart[existingProductIndex].quantity += action.payload.quantity;
        
        return {
          ...state,
          cart: updatedCart
        };
      } else {
        // Product not in cart, add it
        return {
          ...state,
          cart: [...state.cart, action.payload]
        };
      }
      
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload)
      };
      
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item => 
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
      
    case 'CLEAR_CART':
      return {
        ...state,
        cart: []
      };
      
    case 'UPDATE_PRODUCTS':
      return {
        ...state,
        products: action.payload
      };
      
    default:
      return state;
  }
}