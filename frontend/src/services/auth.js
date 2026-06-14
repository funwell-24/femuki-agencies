// src/services/auth.js
import api, { post } from './api';
import toast from 'react-hot-toast';

// User login
export const login = async (email, password) => {
  try {
    const response = await post('/auth/login', { email, password });
    
    console.log('Login response:', response.data); // Debug log
    
    if (response.data.success) {
      const { token, refresh_token, user } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success(`Welcome back, ${user.full_name}!`);
      return { success: true, user };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Login error:', error);
    const message = error.response?.data?.message || 'Invalid email or password';
    toast.error(message);
    return { success: false, error: message };
  }
};

// User registration
export const register = async (userData) => {
  try {
    const response = await post('/auth/register', {
      full_name: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
    });
    
    console.log('Register response:', response.data); // Debug log
    
    if (response.data.success) {
      const { token, refresh_token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Registration successful! Welcome to Femuki Agencies.');
      return { success: true, user };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Register error:', error);
    const message = error.response?.data?.message || 'Registration failed. Please try again.';
    toast.error(message);
    return { success: false, error: message };
  }
};

// User logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  toast.success('Logged out successfully');
  return { success: true };
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Get token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

// Forgot password - request reset link
export const forgotPassword = async (email) => {
  try {
    const response = await post('/auth/forgot-password', { email });
    if (response.data.success) {
      toast.success('Password reset link sent to your email');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to send reset link';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await post('/auth/reset-password', { token, password: newPassword });
    if (response.data.success) {
      toast.success('Password reset successful. Please login.');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to reset password';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Change password (authenticated user)
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    if (response.data.success) {
      toast.success('Password changed successfully');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to change password';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', {
      full_name: profileData.fullName,
      phone: profileData.phone,
      address: profileData.address,
      city: profileData.city,
      county: profileData.county,
    });
    
    if (response.data.success) {
      const updatedUser = response.data.data;
      // Update localStorage
      const currentUser = getCurrentUser();
      const mergedUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      toast.success('Profile updated successfully');
      return { success: true, user: mergedUser };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update profile';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Verify email
export const verifyEmail = async (token) => {
  try {
    const response = await post('/auth/verify-email', { token });
    if (response.data.success) {
      toast.success('Email verified successfully');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to verify email';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Resend verification email
export const resendVerification = async () => {
  try {
    const response = await post('/auth/resend-verification');
    if (response.data.success) {
      toast.success('Verification email sent');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to send verification email';
    toast.error(message);
    return { success: false, error: message };
  }
};