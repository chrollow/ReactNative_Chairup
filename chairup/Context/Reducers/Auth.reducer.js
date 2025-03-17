import * as SecureStore from 'expo-secure-store';
import { SET_CURRENT_USER } from "../Actions/Auth.actions";

export default function(state, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user
      };
    case "LOGOUT":
      // Clear stored tokens
      SecureStore.deleteItemAsync('userToken');
      SecureStore.deleteItemAsync('userData');
      
      return {
        ...state,
        isAuthenticated: false,
        user: {}
      };
    default:
      return state;
  }
}