// src/components/dashboard/customer/OrdersList.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthContext } from '../../../contexts/AuthContext';

const OrdersList = () => {
  const { isAuthenticated } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders');
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: FiClock, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-700', icon: FiPackage, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-700', icon: FiPackage, label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-700', icon: FiTruck, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-700', icon: FiCheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-700', icon: FiClock, label: 'Cancelled' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
        <Icon size={12} />
        <span>{label}</span>
      </span>
    );
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getTrackingSteps = (orderStatus) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: FiClock },
      { key: 'confirmed', label: 'Confirmed', icon: FiPackage },
      { key: 'processing', label: 'Processing', icon: FiPackage },
      { key: 'shipped', label: 'Shipped', icon: FiTruck },
      { key: 'delivered', label: 'Delivered', icon: FiCheckCircle }
    ];
    
    // Determine which steps are completed based on order status
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    
    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Please Login</h3>
        <p className="text-gray-500 mb-6">Login to view your orders</p>
        <Link to="/login" className="btn-primary inline-block">
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h3>
        <p className="text-gray-500 mb-6">You haven't placed any orders yet</p>
        <Link to="/products" className="btn-primary inline-block">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {/* Order Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <span className="font-semibold text-gray-800">{order.order_number}</span>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold text-primary-600">{formatPrice(order.total_amount)}</p>
                </div>
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="text-primary-500 hover:text-primary-600"
                >
                  {expandedOrder === order.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Order Items Summary */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {order.items && order.items.slice(0, 3).map((item, idx) => (
                  <div key={item.id} className="w-12 h-12 bg-gray-200 rounded-lg border-2 border-white overflow-hidden">
                    <img 
                      src={item.product_image || '/placeholder.jpg'} 
                      alt={item.product_name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                  </div>
                ))}
                {order.items && order.items.length > 3 && (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center text-xs font-semibold text-gray-600">
                    +{order.items.length - 3}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {order.items_count || (order.items?.length || 0)} item{order.items_count !== 1 ? 's' : ''}
                </p>
                <Link 
                  to={`/order-tracking/${order.id}`}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center space-x-1"
                >
                  <FiEye size={12} />
                  <span>View Details</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expandedOrder === order.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t bg-gray-50"
              >
                <div className="p-4 space-y-4">
                  {/* Tracking Timeline */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Order Status</h4>
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="space-y-4 relative">
                        {getTrackingSteps(order.status).map((step) => {
                          const Icon = step.icon;
                          const isCompleted = step.completed;
                          return (
                            <div key={step.key} className="flex items-center space-x-3 relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                <Icon size={14} className="text-white" />
                              </div>
                              <div>
                                <p className={`font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                                  {step.label}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Delivery Address</h4>
                    <p className="text-sm text-gray-600">{order.delivery_address}</p>
                    <p className="text-sm text-gray-600">Phone: {order.delivery_phone}</p>
                  </div>

                  {/* Items List */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items && order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                              <img 
                                src={item.product_image || '/placeholder.jpg'} 
                                alt={item.product_name} 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{item.product_name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium">{formatPrice(item.subtotal || (item.price_at_time * item.quantity))}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-sm text-gray-500">
                      Paid via {order.payment_method === 'mpesa' ? 'M-Pesa' : 
                               order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                               order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Unknown'}
                    </p>
                    <button 
                      onClick={() => window.open('https://wa.me/254791254076', '_blank')}
                      className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                    >
                      Need Help?
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default OrdersList;