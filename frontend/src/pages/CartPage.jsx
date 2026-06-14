// src/pages/CartPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import { FiShoppingCart } from 'react-icons/fi';
import { useCartContext } from '../contexts/CartContext';
import { useAuthContext } from '../contexts/AuthContext';

const CartPage = () => {
  const { isAuthenticated } = useAuthContext();
  const { cartItems, cartSummary, isLoading, updateQuantity, removeItem, loadCart } = useCartContext();

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated, loadCart]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    await updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId) => {
    await removeItem(itemId);
  };

  const handleSaveForLater = async (itemId) => {
    // Save for later functionality
    await removeItem(itemId);
    toast.success('Item saved for later');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingCart className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">Login to view your cart</p>
          <Link to="/login" className="btn-primary inline-block">Login</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingCart className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added any items yet</p>
          <Link to="/products" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({cartSummary.itemCount} items)</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                onSaveForLater={handleSaveForLater}
              />
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <CartSummary cartItems={cartItems} cartSummary={cartSummary} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;