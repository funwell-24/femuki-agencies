// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiGrid, 
  FiShoppingCart, 
  FiUsers, 
  FiUpload, 
  FiPlus,
  FiLogOut,
  FiBarChart2
} from 'react-icons/fi';
import AdminStats from '../components/dashboard/admin/AdminStats';
import ProductsTable from '../components/dashboard/admin/ProductsTable';
import OrdersTable from '../components/dashboard/admin/OrdersTable';
import UsersTable from '../components/dashboard/admin/UsersTable';
import SubmissionsTable from '../components/dashboard/admin/SubmissionsTable';
import AddProductForm from '../components/dashboard/admin/AddProductForm';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/');
      toast.error('Access denied. Admin only.');
      return;
    }
    
    setUser(parsedUser);
  }, [navigate]);

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: FiBarChart2 },
    { id: 'products', label: 'Products', icon: FiGrid },
    { id: 'orders', label: 'Orders', icon: FiShoppingCart },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'submissions', label: 'Submissions', icon: FiUpload },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const renderContent = () => {
    if (showAddProduct) {
      return (
        <AddProductForm 
          onSuccess={() => setShowAddProduct(false)}
          onCancel={() => setShowAddProduct(false)}
        />
      );
    }
    
    switch (activeTab) {
      case 'stats':
        return <AdminStats />;
      case 'products':
        return <ProductsTable />;
      case 'orders':
        return <OrdersTable />;
      case 'users':
        return <UsersTable />;
      case 'submissions':
        return <SubmissionsTable />;
      default:
        return <AdminStats />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white sticky top-0 z-10">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome back, {user.full_name}</p>
            </div>
            <div className="flex items-center space-x-4 mt-3 sm:mt-0">
              {activeTab === 'products' && !showAddProduct && (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="flex items-center space-x-2 bg-primary-500 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FiPlus size={16} />
                  <span>Add Product</span>
                </button>
              )}
              {showAddProduct && (
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back to Products
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-10">
        <div className="container-custom">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowAddProduct(false);
                  }}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id && !showAddProduct
                      ? 'border-primary-500 text-primary-500'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-8">
        <motion.div
          key={showAddProduct ? 'add-product' : activeTab}
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

export default AdminDashboard;