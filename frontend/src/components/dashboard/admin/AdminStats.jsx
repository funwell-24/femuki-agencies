// src/components/dashboard/admin/AdminStats.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiPackage, 
  FiUsers, 
  FiShoppingCart, 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown,
  FiEye,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    soldProducts: 0,
    pendingSubmissions: 0,
    productViews: 0,
    customerInquiries: 0,
    monthlyGrowth: {
      revenue: 0,
      orders: 0,
      customers: 0
    }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real stats from API
  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        const data = response.data.data;
        setStats({
          totalProducts: data.products?.total || 0,
          totalCustomers: data.users?.total || 0,
          totalOrders: data.orders?.total || 0,
          totalRevenue: data.revenue?.total || 0,
          soldProducts: data.products?.sold || 0,
          pendingSubmissions: data.submissions?.pending || 0,
          productViews: data.views?.total || 0,
          customerInquiries: 0, // Will be added later
          monthlyGrowth: {
            revenue: data.revenue?.monthly_growth || 0,
            orders: data.orders?.monthly_growth || 0,
            customers: data.users?.monthly_growth || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const response = await api.get('/admin/orders?page=1&limit=5');
      if (response.data.success) {
        setRecentOrders(response.data.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    }
  };

  // Fetch top products
  const fetchTopProducts = async () => {
    try {
      const response = await api.get('/products?sort_by=popular&limit=4');
      if (response.data.success) {
        setTopProducts(response.data.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchRecentOrders(), fetchTopProducts()]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentOrders(), fetchTopProducts()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: FiPackage,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      trend: stats.monthlyGrowth.products || '+0%',
      trendUp: true
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: FiUsers,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      trend: `+${stats.monthlyGrowth.customers}%`,
      trendUp: stats.monthlyGrowth.customers >= 0
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: FiShoppingCart,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      trend: `+${stats.monthlyGrowth.orders}%`,
      trendUp: stats.monthlyGrowth.orders >= 0
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: FiDollarSign,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      trend: `+${stats.monthlyGrowth.revenue}%`,
      trendUp: stats.monthlyGrowth.revenue >= 0
    },
    {
      title: 'Sold Products',
      value: stats.soldProducts,
      icon: FiCheckCircle,
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-600',
      trend: '+0%',
      trendUp: true
    },
    {
      title: 'Pending Submissions',
      value: stats.pendingSubmissions,
      icon: FiClock,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      trend: stats.pendingSubmissions > 0 ? `+${stats.pendingSubmissions}` : '0',
      trendUp: stats.pendingSubmissions > 0
    },
    {
      title: 'Product Views',
      value: formatNumber(stats.productViews),
      icon: FiEye,
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      trend: '+0%',
      trendUp: true
    },
    {
      title: 'Inquiries',
      value: stats.customerInquiries,
      icon: FiMessageSquare,
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-600',
      trend: '0',
      trendUp: false
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-500 transition-colors"
        >
          <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`text-xl ${card.textColor}`} size={24} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  card.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.trendUp ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                  <span>{card.trend}</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Recent Orders</h3>
            <button 
              onClick={() => window.location.href = '/admin/orders'}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{order.order_number}</p>
                    <p className="text-sm text-gray-500">Customer ID: {order.user_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">{formatPrice(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Top Products</h3>
            <button 
              onClick={() => window.location.href = '/admin/products'}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.views || 0} views</p>
                  </div>
                  <p className="font-semibold text-gray-700">{formatPrice(product.price)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No products found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;