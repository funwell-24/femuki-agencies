// src/pages/OrderTrackingPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiCheckCircle, FiTruck, FiClock, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const OrderTrackingPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // If orderNumber is provided in URL params, use it to track
      if (orderNumber) {
        response = await api.get(`/orders/track/${orderNumber}`);
      } 
      // Otherwise check if we have order data from navigation state
      else if (location.state?.order) {
        setOrder(location.state.order);
        setLoading(false);
        return;
      }
      // Or get the most recent order from user's orders
      else {
        response = await api.get('/orders?limit=1');
        if (response.data.success && response.data.data.orders.length > 0) {
          setOrder(response.data.data.orders[0]);
          setLoading(false);
          return;
        } else {
          setError('No orders found');
          setLoading(false);
          return;
        }
      }
      
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError(response.data.message || 'Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.response?.data?.message || 'Failed to load order details');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const trackingSteps = [
    { key: 'pending', label: 'Order Placed', icon: FiClock, description: 'Your order has been received' },
    { key: 'confirmed', label: 'Order Confirmed', icon: FiCheckCircle, description: 'Your order has been confirmed' },
    { key: 'processing', label: 'Processing', icon: FiPackage, description: 'Your order is being prepared' },
    { key: 'shipped', label: 'Shipped', icon: FiTruck, description: 'Your order is on the way' },
    { key: 'delivered', label: 'Delivered', icon: FiHome, description: 'Your order has been delivered' }
  ];

  const getStatusProgress = (status) => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    const completedSteps = statusOrder.slice(0, currentIndex + 1);
    
    return trackingSteps.map(step => ({
      ...step,
      isCompleted: completedSteps.includes(step.key),
      isCurrent: step.key === status
    }));
  };

  const getCurrentStepIndex = (status) => {
    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    return statusOrder.indexOf(status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you\'re looking for does not exist.'}</p>
          <Link to="/dashboard" className="btn-primary inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stepsWithStatus = getStatusProgress(order.status);
  const currentStepIndex = getCurrentStepIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-primary-500 hover:text-primary-600 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order #{order.order_number}</h1>
              <p className="text-gray-500">Placed on {formatDate(order.created_at)}</p>
            </div>
            <div className="mt-2 sm:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-gray-600">Total Amount: <span className="font-bold text-primary-600">{formatPrice(order.total_amount)}</span></p>
            {order.tracking_number && (
              <p className="text-gray-600">Tracking Number: <span className="font-medium">{order.tracking_number}</span></p>
            )}
            {order.courier_name && (
              <p className="text-gray-600">Courier: <span className="font-medium">{order.courier_name}</span></p>
            )}
            {order.delivery_notes && (
              <p className="text-gray-600">Delivery Notes: <span className="font-medium">{order.delivery_notes}</span></p>
            )}
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-6">Order Status</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div 
              className="absolute left-6 top-0 w-0.5 bg-primary-500 transition-all duration-500"
              style={{ height: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
            ></div>
            
            {/* Steps */}
            <div className="space-y-8 relative">
              {stepsWithStatus.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = step.isCompleted;
                const isCurrent = step.isCurrent;
                
                return (
                  <div key={step.key} className="flex items-start space-x-4">
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-green-500' 
                        : isCurrent 
                          ? 'bg-primary-500 animate-pulse' 
                          : 'bg-gray-300'
                    }`}>
                      <Icon className="text-white" size={20} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className={`font-semibold ${
                        isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </h3>
                      <p className={`text-sm ${
                        isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                      {isCurrent && !isCompleted && (
                        <p className="text-xs text-primary-500 mt-1">In progress...</p>
                      )}
                      {isCompleted && step.key === 'delivered' && order.delivered_at && (
                        <p className="text-xs text-green-600 mt-1">Delivered on {formatDate(order.delivered_at)}</p>
                      )}
                      {isCompleted && step.key === 'shipped' && order.shipped_at && (
                        <p className="text-xs text-blue-600 mt-1">Shipped on {formatDate(order.shipped_at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold text-primary-600">
                  {formatPrice(item.subtotal || (item.price_at_time * item.quantity))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Delivery Information</h2>
          <p className="text-gray-700">{order.delivery_address}</p>
          <p className="text-gray-600 mt-2">Phone: {order.delivery_phone}</p>
          {order.delivery_notes && (
            <p className="text-gray-600 mt-2">Notes: {order.delivery_notes}</p>
          )}
        </div>

        {/* Payment Information */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Payment Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatPrice(order.subtotal || order.total_amount)}</span>
            </div>
            {order.shipping_cost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>{formatPrice(order.tax_amount)}</span>
              </div>
            )}
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-primary-600">{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-medium">
                {order.payment_method === 'mpesa' ? 'M-Pesa' : 
                 order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                 order.payment_method === 'bank_transfer' ? 'Bank Transfer' : order.payment_method}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Status:</span>
              <span className={`font-medium ${
                order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">Need help with your order?</p>
          <button 
            onClick={() => window.open('https://wa.me/254791254076', '_blank')}
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;