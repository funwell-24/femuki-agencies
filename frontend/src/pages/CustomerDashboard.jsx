// src/pages/CustomerDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiPackage, 
  FiHeart, 
  FiUpload, 
  FiLogOut,
  FiShoppingBag
} from 'react-icons/fi';
import ProfileForm from '../components/dashboard/customer/ProfileForm';
import OrdersList from '../components/dashboard/customer/OrdersList';
import SavedProducts from '../components/dashboard/customer/SavedProducts';
import SubmissionsList from '../components/dashboard/customer/SubmissionsList';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'orders', label: 'My Orders', icon: FiPackage },
    { id: 'saved', label: 'Saved Items', icon: FiHeart },
    { id: 'submissions', label: 'My Submissions', icon: FiUpload },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileForm />;
      case 'orders':
        return <OrdersList />;
      case 'saved':
        return <SavedProducts />;
      case 'submissions':
        return <SubmissionsList />;
      default:
        return <ProfileForm />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user.full_name}!</h1>
              <p className="opacity-90">Manage your account, orders, and more</p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 sm:mt-0 flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerDashboard;