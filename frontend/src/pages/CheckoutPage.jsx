// src/pages/CheckoutPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CheckoutForm from '../components/cart/CheckoutForm';
import { FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useCartContext } from '../contexts/CartContext';
import { useAuthContext } from '../contexts/AuthContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { cartItems, cartSummary, isLoading, loadCart, clearCartItems } = useCartContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
    setLoading(false);
  }, [isAuthenticated, loadCart]);

  const subtotal = cartSummary.subtotal;
  const deliveryFee = cartSummary.shipping;
  const total = cartSummary.total;

  const handlePlaceOrder = async (orderData) => {
    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: subtotal,
        shipping_cost: deliveryFee,
        tax_amount: 0,
        discount_amount: cartSummary.discount,
        total_amount: total,
        payment_method: orderData.paymentMethod,
        delivery_address: `${orderData.deliveryDetails.address}, ${orderData.deliveryDetails.city}, ${orderData.deliveryDetails.county}`,
        delivery_phone: orderData.deliveryDetails.phone,
        delivery_notes: orderData.deliveryDetails.notes || ''
      };

      const response = await api.post('/orders', orderPayload);
      
      if (response.data.success) {
        toast.success('Order placed successfully!');
        await clearCartItems();
        navigate('/order-tracking', { state: { order: response.data.data } });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-600 hover:text-primary-500 mb-6">
          <FiArrowLeft />
          <span>Back to Cart</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CheckoutForm cartItems={cartItems} total={total} onSubmit={handlePlaceOrder} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.product?.name || item.name} x{item.quantity}</span>
                    <span>KSH {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between py-1">
                    <span>Subtotal</span>
                    <span>KSH {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? 'Free' : `KSH ${deliveryFee.toLocaleString()}`}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary-600">KSH {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;