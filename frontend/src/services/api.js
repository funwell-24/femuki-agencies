// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Base URL configuration
// src/services/api.js
const API_BASE_URL = 'https://femuki-agencies-backend.onrender.com/api';
console.log('🔐 [Frontend] API_BASE_URL (hardcoded):', API_BASE_URL);


// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
// src/services/api.js - Update the response interceptor

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    if (response) {
      // Handle specific status codes
      switch (response.status) {
        case 401:
          // Don't redirect for profile and cart endpoints - just return empty data
          if (config?.url?.includes('/cart') || config?.url?.includes('/profile')) {
            // For profile, return null data
            if (config?.url?.includes('/profile')) {
              return Promise.resolve({ data: { success: false, data: null } });
            }
            return Promise.resolve({ data: { success: true, data: { items: [], summary: { itemCount: 0 } } } });
          }
          // For auth endpoints, clear token and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          if (!config?.url?.includes('/cart/saved') && !config?.url?.includes('/notifications')) {
            toast.error('Resource not found');
          }
          break;
        case 422:
          // Validation error - handled by component
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(response.data?.message || 'An error occurred');
      }
    } else if (error.request) {
      if (!error.config?.url?.includes('/cart') && !error.config?.url?.includes('/notifications')) {
        toast.error('Network error. Please check your connection.');
      }
    }
    
    return Promise.reject(error);
  }
);

// src/services/api.js - Add to request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 [Frontend] Request to:', config.url);
    console.log('🔐 [Frontend] Token exists:', !!token);
    if (token) {
      console.log('🔐 [Frontend] Token (first 50 chars):', token.substring(0, 50));
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 [Frontend] Auth header set');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// src/services/api.js - Update the response interceptor

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          // Don't redirect for admin endpoints - just return error
          if (config?.url?.includes('/admin') || 
              config?.url?.includes('/dashboard') ||
              config?.url?.includes('/cart') || 
              config?.url?.includes('/favorites') || 
              config?.url?.includes('/profile')) {
            return Promise.reject(error);
          }
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
          break;
        // ... rest of cases
      }
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const get = (url, config = {}) => api.get(url, config);
export const post = (url, data, config = {}) => api.post(url, data, config);
export const put = (url, data, config = {}) => api.put(url, data, config);
export const patch = (url, data, config = {}) => api.patch(url, data, config);
export const del = (url, config = {}) => api.delete(url, config);

// File upload helper
export const uploadFile = (url, file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

export default api;
