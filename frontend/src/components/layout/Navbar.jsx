// src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react';  // Make sure useEffect is imported here
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiShoppingCart, 
  FiUser, 
  FiHeart,
  FiLogOut,
  FiUser as FiProfile
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthContext } from '../../contexts/AuthContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    };
    
    updateCartCount();
    
    // Listen for storage events (when cart changes in other tabs/components)
    window.addEventListener('storage', updateCartCount);
    
    // Custom event for same-tab updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
    setIsUserMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    setIsUserMenuOpen(false);
    if (user?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Sell', path: '/sell' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Femuki Agencies" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-primary-600">Femuki</h1>
              <p className="text-xs text-gray-500">Agencies</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-700 hover:text-primary-500 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <FiShoppingCart className="text-2xl text-gray-700 hover:text-primary-500" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            <Link to="/favorites" className="relative">
              <FiHeart className="text-2xl text-gray-700 hover:text-primary-500" />
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50"
                    >
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiProfile size={16} />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={handleDashboardClick}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiUser size={16} />
                        <span>Dashboard</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FiLogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary text-sm py-2 px-4"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <FiX className="text-2xl" />
            ) : (
              <FiMenu className="text-2xl" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="container-custom py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block py-2 text-gray-700 hover:text-primary-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <hr />
              <Link
                to="/cart"
                className="flex items-center justify-between py-2 text-gray-700 hover:text-primary-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="bg-primary-500 text-white px-2 py-1 rounded-full text-xs">{cartCount}</span>
                )}
              </Link>
              <Link
                to="/favorites"
                className="block py-2 text-gray-700 hover:text-primary-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Favorites
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block py-2 text-gray-700 hover:text-primary-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                    className="block py-2 text-gray-700 hover:text-primary-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block btn-primary text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;