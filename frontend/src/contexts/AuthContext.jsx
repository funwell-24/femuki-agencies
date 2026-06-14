// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '../services/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to check and update auth state from localStorage
  const checkAuthState = useCallback(() => {
    const token = localStorage.getItem('token');
    const currentUser = getCurrentUser();
    
    console.log('Checking auth state - Token:', !!token);
    console.log('Checking auth state - User:', currentUser);
    
    if (token && currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
      return true;
    } else {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuthState();
    setIsLoading(false);
    
    // Listen for storage events (when localStorage changes in another tab)
    const handleStorageChange = () => {
      checkAuthState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuthState]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    const result = await apiLogin(email, password);
    
    if (result.success && result.user) {
      // Verify localStorage was set
      const storedUser = localStorage.getItem('user');
      console.log('Stored user after login:', storedUser);
      
      // Force update state
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Double-check after a short delay
      setTimeout(() => {
        checkAuthState();
      }, 100);
      
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return result;
  }, [checkAuthState]);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    const result = await apiRegister(userData);
    
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
    return result;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;