// src/components/cart/CartSummary.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTruck, FiShield, FiClock, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CartSummary = ({ cartItems, onApplyCoupon }) => {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);

  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Delivery fee: 1000 KES, free if subtotal > 50000
  const deliveryFee = subtotal > 50000 ? 0 : 1000;
  
  // No VAT - removed
  const tax = 0;
  
  const total = subtotal + deliveryFee + tax - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setIsApplyingCoupon(true);
    // Simulate API call
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'WELCOME10') {
        const discountAmount = subtotal * 0.1;
        setDiscount(discountAmount);
        toast.success('Coupon applied! 10% discount');
      } else if (couponCode.toUpperCase() === 'FEMUKI20') {
        const discountAmount = subtotal * 0.2;
        setDiscount(discountAmount);
        toast.success('Coupon applied! 20% discount');
      } else {
        toast.error('Invalid coupon code');
      }
      setIsApplyingCoupon(false);
    }, 1000);
  };
// Add this debug version of handleCheckout
const handleCheckout = () => {
  console.log('🔍 Checkout button clicked!');
  console.log('Cart items count:', cartItems.length);
  
  if (cartItems.length === 0) {
    toast.error('Your cart is empty');
    return;
  }
  
  console.log('Navigating to /checkout...');
  try {
    navigate('/checkout');
    console.log('Navigation called successfully');
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
  

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-6 sticky top-24"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
      
      {/* Items Count */}
      <div className="flex justify-between py-2 text-gray-600">
        <span>Subtotal ({cartItems.length} items)</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      {/* Delivery Fee */}
      <div className="flex justify-between py-2 text-gray-600">
        <div className="flex items-center space-x-2">
          <FiTruck size={16} />
          <span>Delivery Fee</span>
        </div>
        <span>
          {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
        </span>
      </div>

      {/* Free Delivery Message */}
      {subtotal > 0 && subtotal <= 50000 && (
        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg text-center">
          Add items worth KSH {(50000 - subtotal).toLocaleString()} more to get free delivery!
        </div>
      )}

      {/* Discount */}
      {discount > 0 && (
        <div className="flex justify-between py-2 text-green-600">
          <span>Discount</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Total */}
      <div className="flex justify-between py-2 text-xl font-bold text-gray-800">
        <span>Total</span>
        <span className="text-primary-600">{formatPrice(total)}</span>
      </div>

      {/* Coupon Code */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Coupon Code
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={isApplyingCoupon}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {isApplyingCoupon ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        className="w-full mt-6 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
      >
        <span>Proceed to Checkout</span>
        <FiArrowRight />
      </button>

      {/* Trust Badges */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <FiShield className="text-green-500" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <FiClock className="text-blue-500" />
          <span>Delivery in 2-5 business days</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">We Accept</p>
        <div className="flex justify-center space-x-4 mt-2">
          <img src="/mpesa.png" alt="M-Pesa" className="h-8" />
          <img src="/visa.png" alt="Visa" className="h-8" />
          <img src="/mastercard.png" alt="Mastercard" className="h-8" />
        </div>
      </div>
    </motion.div>
  );
};

export default CartSummary;