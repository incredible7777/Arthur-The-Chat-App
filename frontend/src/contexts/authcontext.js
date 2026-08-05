import React, { createContext, useContext, useState, useEffect } from "react";
import { getMyProfile, loginAsGuest } from "../services/authservice";
import { connectSocket, disconnectSocket } from "../services/socketservice";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Initialize user session on startup if token exists in localStorage
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await getMyProfile();
          setUser(userData);
          connectSocket(token);
        } catch (error) {
          console.error("Token verification failed, logging out:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Handle successful login (from OTP or Guest mode)
  const loginSuccess = (authToken, userData) => {
    localStorage.setItem("token", authToken);
    setToken(authToken);
    setUser(userData);
    connectSocket(authToken);
  };

  // Guest Mode login handler
  const handleGuestLogin = async () => {
    const data = await loginAsGuest();
    loginSuccess(data.token, data.user);
    return data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        loginSuccess,
        handleGuestLogin,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);