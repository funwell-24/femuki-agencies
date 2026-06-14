// src/services/orders.js
import { get, post, put } from './api';

// Create new order
export const createOrder = async (orderData) => {
  try {
    const response = await post('/orders', {
      items: orderData.items,
      delivery_address: orderData.deliveryAddress,
      delivery_phone: orderData.deliveryPhone,
      payment_method: orderData.paymentMethod,
      notes: orderData.notes,
    });
    
    if (response.data.success) {
      toast.success('Order placed successfully!');
      return { success: true, order: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Create order error:', error);
    return { success: false, error: error.message };
  }
};

// Get user's orders
export const getUserOrders = async (page = 1, limit = 10) => {
  try {
    const response = await get(`/orders?page=${page}&limit=${limit}`);
    
    if (response.data.success) {
      return {
        success: true,
        orders: response.data.data.orders,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, orders: [], pagination: null };
  } catch (error) {
    console.error('Get user orders error:', error);
    return { success: false, orders: [] };
  }
};

// Get single order by ID
export const getOrder = async (orderId) => {
  try {
    const response = await get(`/orders/${orderId}`);
    
    if (response.data.success) {
      return { success: true, order: response.data.data };
    }
    return { success: false, order: null };
  } catch (error) {
    console.error('Get order error:', error);
    return { success: false, order: null };
  }
};

// Track order by order number
export const trackOrder = async (orderNumber) => {
  try {
    const response = await get(`/orders/track/${orderNumber}`);
    
    if (response.data.success) {
      return { success: true, order: response.data.data };
    }
    return { success: false, order: null };
  } catch (error) {
    console.error('Track order error:', error);
    return { success: false, order: null };
  }
};

// Cancel order
export const cancelOrder = async (orderId, reason = '') => {
  try {
    const response = await post(`/orders/${orderId}/cancel`, { reason });
    
    if (response.data.success) {
      toast.success('Order cancelled successfully');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Cancel order error:', error);
    return { success: false, error: error.message };
  }
};

// Request return
export const requestReturn = async (orderId, reason, description) => {
  try {
    const response = await post(`/orders/${orderId}/return`, {
      reason,
      description,
    });
    
    if (response.data.success) {
      toast.success('Return request submitted');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Request return error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Get all orders
export const getAllOrders = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await get(`/admin/orders?${params.toString()}`);
    
    if (response.data.success) {
      return {
        success: true,
        orders: response.data.data.orders,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, orders: [], pagination: null };
  } catch (error) {
    console.error('Get all orders error:', error);
    return { success: false, orders: [] };
  }
};

// Admin: Update order status
export const updateOrderStatus = async (orderId, status, notes = '') => {
  try {
    const response = await put(`/admin/orders/${orderId}/status`, { status, notes });
    
    if (response.data.success) {
      toast.success(`Order status updated to ${status}`);
      return { success: true, order: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update order status error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus, transactionId = null) => {
  try {
    const response = await put(`/admin/orders/${orderId}/payment`, {
      payment_status: paymentStatus,
      transaction_id: transactionId,
    });
    
    if (response.data.success) {
      toast.success(`Payment status updated to ${paymentStatus}`);
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update payment status error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Get order statistics
export const getOrderStats = async () => {
  try {
    const response = await get('/admin/orders/stats');
    
    if (response.data.success) {
      return { success: true, stats: response.data.data };
    }
    return { success: false, stats: null };
  } catch (error) {
    console.error('Get order stats error:', error);
    return { success: false, stats: null };
  }
};