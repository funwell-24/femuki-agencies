// src/components/layout/MobileMenu.jsx (Updated with Context)
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiGrid, 
  FiTag, 
  FiDollarSign, 
  FiMail, 
  FiShoppingCart, 
  FiHeart,
  FiUser,
  FiLogOut,
  FiX,
  FiPhone,
  FiMessageCircle,
  FiBarChart2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCartContext } from '../../contexts/CartContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import useWhatsApp from '../../hooks/useWhatsApp';

const MobileMenu = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthContext();
  const { cartSummary } = useCartContext();
  const { isMobileMenuOpen, closeMobileMenu } = useThemeContext();
  const { contactFemuki, sellItem } = useWhatsApp();

  const menuItems = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Products', path: '/products', icon: FiGrid },
    { name: 'Categories', path: '/categories', icon: FiTag },
    { name: 'Sell Your Item', path: '/sell', icon: FiDollarSign },
    { name: 'Contact', path: '/contact', icon: FiMail },
  ];

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login');
  };

  const handleWhatsApp = () => {
    contactFemuki();
    closeMobileMenu();
  };

  const handleCall = () => {
    window.location.href = 'tel:0797717981';
  };

  const itemCount = cartSummary?.itemCount || 0;

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <img src="/logo.png" alt="Femuki" className="h-10 w-10 rounded-full bg-white p-1" />
                  <div>
                    <h2 className="font-bold text-lg">Femuki Agencies</h2>
                    <p className="text-xs opacity-90">Quality Household Items</p>
                  </div>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              {/* User Info if logged in */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3 pt-2 border-t border-white border-opacity-20">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-primary-500 font-bold text-lg">
                      {user.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{user.full_name || 'User'}</p>
                    <p className="text-xs opacity-90">{user.email || 'user@example.com'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200"
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                {/* Cart */}
                <Link
                  to="/cart"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <FiShoppingCart size={20} />
                    <span className="font-medium">Cart</span>
                  </div>
                  {itemCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* Favorites */}
                <Link
                  to="/favorites"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200"
                >
                  <FiHeart size={20} />
                  <span className="font-medium">Favorites</span>
                </Link>

                {/* Dashboard for logged in users */}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-gray-200 my-3" />
                    <Link
                      to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all duration-200"
                    >
                      <FiBarChart2 size={20} />
                      <span className="font-medium">
                        {user?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <FiLogOut size={20} />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Footer with Contact Options */}
            <div className="border-t border-gray-200 p-4 space-y-3">
              <p className="text-xs text-gray-500 text-center mb-2">Need help? Contact us</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCall}
                  className="flex-1 flex items-center justify-center space-x-2 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FiPhone size={18} />
                  <span>Call</span>
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FiMessageCircle size={18} />
                  <span>WhatsApp</span>
                </button>
              </div>
              
              {/* Sell Button */}
              <button
                onClick={() => {
                  sellItem();
                  closeMobileMenu();
                }}
                className="w-full py-2 text-center text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
              >
                Sell Your Item
              </button>
              
              {/* Login/Register for guests */}
              {!isAuthenticated && (
                <div className="pt-2 flex space-x-3">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex-1 text-center py-2 bg-primary-500 text-white rounded-lg font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="flex-1 text-center py-2 border border-primary-500 text-primary-600 rounded-lg font-semibold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;