// src/components/dashboard/admin/OrdersTable.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiEye, 
  FiCheckCircle, 
  FiTruck, 
  FiPackage, 
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/orders', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined
        }
      });
      
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setTotalOrders(response.data.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { icon: FiClock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      confirmed: { icon: FiCheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
      processing: { icon: FiPackage, color: 'bg-purple-100 text-purple-700', label: 'Processing' },
      shipped: { icon: FiTruck, color: 'bg-indigo-100 text-indigo-700', label: 'Shipped' },
      delivered: { icon: FiCheckCircle, color: 'bg-green-100 text-green-700', label: 'Delivered' },
      cancelled: { icon: FiClock, color: 'bg-red-100 text-red-700', label: 'Cancelled' }
    };
    return config[status] || config.pending;
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      const response = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders(); // Refresh the list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewOrder = (orderId) => {
    window.open(`/order-tracking/${orderId}`, '_blank');
  };

  const exportOrders = async () => {
    try {
      const response = await api.get('/admin/orders/export', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Orders exported successfully');
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const statusOptions = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold text-lg text-gray-800">Orders Management</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw size={16} />
              <span>Refresh</span>
            </button>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            {/* Export Button */}
            <button
              onClick={exportOrders}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const StatusConfig = getStatusConfig(order.status);
                const StatusIcon = StatusConfig.icon;
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{order.order_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">Customer #{order.user_id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-gray-600">{order.items_count || 0}</td>
                    <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {order.payment_method === 'mpesa' ? 'M-Pesa' : 
                         order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                         order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${StatusConfig.color}`}>
                        <StatusIcon size={12} />
                        <span>{StatusConfig.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Order"
                        >
                          <FiEye size={16} />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={updating}
                          className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 bg-primary-500 text-white rounded-lg">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;