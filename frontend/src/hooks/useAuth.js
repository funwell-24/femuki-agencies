// src/hooks/useAuth.js
import { useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for authentication
 * Provides user authentication state and methods
 */
const useAuth = () => {
  const auth = useAuthContext();
  
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isAdmin: auth.isAdmin,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    updateUser: auth.updateUser,
  };
};

export default useAuth;