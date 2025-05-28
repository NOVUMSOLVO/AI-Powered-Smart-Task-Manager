import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

// Create Auth Context
export const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setIsLoggedIn(true);
        setError(null);
      } catch (err) {
        console.error('Authentication error:', err);
        // Token might be invalid
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('token', response.access_token);
      
      // Get user details
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setIsLoggedIn(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    try {
      await authAPI.register(userData);
      // After registration, log in the user
      return await login(userData.username, userData.password);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Failed to register. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    try {
      const updatedUser = await authAPI.updateUser(userData);
      setUser(updatedUser);
      setError(null);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const contextValue = {
    isLoggedIn,
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
