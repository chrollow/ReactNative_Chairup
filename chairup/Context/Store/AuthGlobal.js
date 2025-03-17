import React, { createContext, useReducer } from "react";
import authReducer from "../Reducers/Auth.reducer";

export const AuthContext = createContext();

const AuthGlobal = ({ children }) => {
  const [stateUser, dispatch] = useReducer(authReducer, { 
    isAuthenticated: false,
    user: {}
  });

  return (
    <AuthContext.Provider value={{ stateUser, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthGlobal;