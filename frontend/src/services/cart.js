// src/services/cart.js
import { get, post, put, del } from './api';
import toast from 'react-hot-toast'; 
// Get user's cart
export const getCart = async () => {
  try {
    const response = await get('/cart');
    
    if (response.data.success) {
      return {
        success: true,
        cart: response.data.data.cart,
        items: response.data.data.items,
        summary: response.data.data.summary,
      };
    }
    return { success: false, cart: null, items: [], summary: null };
  } catch (error) {
    console.error('Get cart error:', error);
    return { success: false, items: [], summary: null };
  }
};

// Add item to cart
export const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await post('/cart/items', { product_id: productId, quantity });
    
    if (response.data.success) {
      toast.success('Item added to cart');
      return {
        success: true,
        cart: response.data.data.cart,
        item: response.data.data.item,
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Add to cart error:', error);
    const message = error.response?.data?.message || 'Failed to add item to cart';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await put(`/cart/items/${itemId}`, { quantity });
    
    if (response.data.success) {
      return {
        success: true,
        cart: response.data.data.cart,
        summary: response.data.data.summary,
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update cart item error:', error);
    return { success: false, error: error.message };
  }
};

// Remove item from cart
export const removeFromCart = async (itemId) => {
  try {
    const response = await del(`/cart/items/${itemId}`);
    
    if (response.data.success) {
      toast.success('Item removed from cart');
      return {
        success: true,
        cart: response.data.data.cart,
        summary: response.data.data.summary,
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Remove from cart error:', error);
    toast.error('Failed to remove item');
    return { success: false, error: error.message };
  }
};

// Clear entire cart
export const clearCart = async () => {
  try {
    const response = await del('/cart/clear');
    
    if (response.data.success) {
      toast.success('Cart cleared');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Clear cart error:', error);
    return { success: false, error: error.message };
  }
};

// Apply coupon code
export const applyCoupon = async (code) => {
  try {
    const response = await post('/cart/coupon', { code });
    
    if (response.data.success) {
      toast.success('Coupon applied successfully');
      return {
        success: true,
        discount: response.data.data.discount,
        total: response.data.data.total,
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Apply coupon error:', error);
    const message = error.response?.data?.message || 'Invalid coupon code';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Remove coupon
export const removeCoupon = async () => {
  try {
    const response = await del('/cart/coupon');
    
    if (response.data.success) {
      toast.success('Coupon removed');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Remove coupon error:', error);
    return { success: false, error: error.message };
  }
};

// Move item to saved for later
export const moveToSaved = async (itemId) => {
  try {
    const response = await post(`/cart/items/${itemId}/save`);
    
    if (response.data.success) {
      toast.success('Item saved for later');
      return {
        success: true,
        cart: response.data.data.cart,
        saved: response.data.data.saved,
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Move to saved error:', error);
    return { success: false, error: error.message };
  }
};

// Move from saved to cart
export const moveToCart = async (savedId) => {
  try {
    const response = await post(`/cart/saved/${savedId}/move`);
    
    if (response.data.success) {
      toast.success('Item moved to cart');
      return {
        success: true,
        cart: response.data.data.cart,
        saved: response.data.data.saved,
      };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Move to cart error:', error);
    return { success: false, error: error.message };
  }
};

// Get saved items
export const getSavedItems = async () => {
  try {
    const response = await get('/cart/saved');
    
    if (response.data.success) {
      return { success: true, saved: response.data.data };
    }
    return { success: false, saved: [] };
  } catch (error) {
    console.error('Get saved items error:', error);
    return { success: false, saved: [] };
  }
};

// Remove saved item
export const removeSavedItem = async (savedId) => {
  try {
    const response = await del(`/cart/saved/${savedId}`);
    
    if (response.data.success) {
      toast.success('Item removed from saved');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Remove saved item error:', error);
    return { success: false, error: error.message };
  }
};