// src/hooks/useCart.js
import { useCartContext } from '../contexts/CartContext';

/**
 * Custom hook for shopping cart
 * Provides cart state and operations
 */
const useCart = () => {
  const cart = useCartContext();
  
  return {
    // State
    items: cart.cartItems,
    savedItems: cart.savedItems,
    summary: cart.cartSummary,
    appliedCoupon: cart.appliedCoupon,
    isLoading: cart.isLoading,
    itemCount: cart.cartSummary?.itemCount || 0,
    subtotal: cart.cartSummary?.subtotal || 0,
    total: cart.cartSummary?.total || 0,
    
    // Actions
    addToCart: cart.addToCart,
    updateQuantity: cart.updateQuantity,
    removeItem: cart.removeItem,
    clearCart: cart.clearCartItems,
    applyCoupon: cart.applyCoupon,
    removeCoupon: cart.removeCoupon,
    mergeGuestCart: cart.mergeGuestCart,
    loadCart: cart.loadCart,
    loadSavedItems: cart.loadSavedItems,
  };
};

export default useCart;