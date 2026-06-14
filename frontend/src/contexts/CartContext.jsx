// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  getCart, 
  addToCart as apiAddToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  getSavedItems
} from '../services/cart';
import { useAuthContext } from './AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
const CartContext = createContext();

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuthContext();
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 0,
    itemCount: 0,
  });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from API
  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setCartSummary({
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await getCart();
      if (result.success) {
        setCartItems(result.items || []);
        if (result.summary) {
          // Update summary with new pricing
          const subtotal = result.summary.subtotal || 0;
          const shipping = subtotal > 50000 ? 0 : 1000;
          const tax = 0;
          const discount = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
          const total = subtotal + shipping + tax - discount;
          
          setCartSummary({
            subtotal,
            shipping,
            tax,
            discount,
            total,
            itemCount: result.summary.itemCount || 0,
          });
        } else {
          updateCartSummary(result.items || []);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, appliedCoupon]);

  // Load saved items
  const loadSavedItems = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const result = await getSavedItems();
      if (result.success) {
        setSavedItems(result.saved || []);
      }
    } catch (error) {
      console.log('Saved items not available yet');
      setSavedItems([]);
    }
  }, [isAuthenticated]);

  // Update cart summary
  const updateCartSummary = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50000 ? 0 : 1000;
    const tax = 0;
    const discount = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
    const total = subtotal + shipping + tax - discount;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    setCartSummary({
      subtotal,
      shipping,
      tax,
      discount,
      total,
      itemCount,
    });
  };

  // Add to cart
  // src/contexts/CartContext.jsx - Update the addToCart function

// src/contexts/CartContext.jsx - Update addToCart function

const addToCart = async (productId, quantity = 1) => {
  if (!isAuthenticated) {
    toast.error('Please login to add items to cart');
    return { success: false };
  }

  setIsLoading(true);
  try {
    // First, get the product details
    const productResponse = await api.get(`/products/${productId}`);
    if (!productResponse.data.success) {
      throw new Error('Product not found');
    }
    
    const product = productResponse.data.data;
    
    // Then add to cart via API
    const result = await apiAddToCart(productId, quantity);
    if (result.success) {
      await loadCart(); // This will reload the cart with proper data
      toast.success('Added to cart!');
      return { success: true };
    }
    return result;
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast.error(error.response?.data?.message || 'Failed to add to cart');
    return { success: false };
  } finally {
    setIsLoading(false);
  }
};
  // Update quantity
  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) return { success: false };

    setIsLoading(true);
    try {
      const result = await updateCartItem(itemId, quantity);
      if (result.success) {
        await loadCart();
      }
      return result;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Remove from cart
  const removeItem = async (itemId) => {
    if (!isAuthenticated) return { success: false };

    setIsLoading(true);
    try {
      const result = await removeFromCart(itemId);
      if (result.success) {
        await loadCart();
        toast.success('Removed from cart');
      }
      return result;
    } catch (error) {
      console.error('Error removing item:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart
  const clearCartItems = async () => {
    if (!isAuthenticated) return { success: false };

    setIsLoading(true);
    try {
      const result = await clearCart();
      if (result.success) {
        await loadCart();
        toast.success('Cart cleared');
      }
      return result;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // Apply coupon
  const applyCouponCode = async (code) => {
    // Coupon functionality to be implemented
    if (code.toUpperCase() === 'WELCOME10') {
      setAppliedCoupon({ code, discount: 10 });
      await loadCart();
      toast.success('Coupon applied! 10% discount');
      return { success: true };
    } else if (code.toUpperCase() === 'FEMUKI20') {
      setAppliedCoupon({ code, discount: 20 });
      await loadCart();
      toast.success('Coupon applied! 20% discount');
      return { success: true };
    }
    toast.error('Invalid coupon code');
    return { success: false };
  };

  // Remove coupon
  const removeCouponCode = async () => {
    setAppliedCoupon(null);
    await loadCart();
    toast.success('Coupon removed');
    return { success: true };
  };

  useEffect(() => {
    loadCart();
    if (isAuthenticated) {
      loadSavedItems();
    }
  }, [isAuthenticated, loadCart, loadSavedItems]);

  const value = {
    cartItems,
    savedItems,
    cartSummary,
    appliedCoupon,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCartItems,
    applyCoupon: applyCouponCode,
    removeCoupon: removeCouponCode,
    loadCart,
    loadSavedItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;