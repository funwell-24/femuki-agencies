// src/components/cart/CartItem.jsx
import { useState } from 'react';
import { FiTrash2, FiPlus, FiMinus, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// src/components/cart/CartItem.jsx - Add safe formatting

const CartItem = ({ item, onUpdateQuantity, onRemove, onSaveForLater }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Safely get price
  const getPrice = () => {
    const price = item.price || item.product?.price || 0;
    return typeof price === 'number' ? price : parseFloat(price) || 0;
  };

  const getStock = () => {
    return item.stock || item.product?.quantity || 0;
  };

  const getCondition = () => {
    return item.condition || item.product?.product_condition || 'second-hand';
  };

  const getImage = () => {
    return item.image || item.product?.primary_image || item.product?.images?.[0]?.image_url || '/placeholder.jpg';
  };

  const formatPrice = (price) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const price = getPrice();
  const stock = getStock();
  const condition = getCondition();
  const imageUrl = getImage();
  const itemTotal = price * (item.quantity || 1);

  const handleIncreaseQuantity = async () => {
    if (item.quantity >= stock) {
      toast.error(`Only ${stock} items available`);
      return;
    }
    setIsLoading(true);
    await onUpdateQuantity(item.id, item.quantity + 1);
    setIsLoading(false);
  };

  const handleDecreaseQuantity = async () => {
    if (item.quantity <= 1) {
      handleRemove();
      return;
    }
    setIsLoading(true);
    await onUpdateQuantity(item.id, item.quantity - 1);
    setIsLoading(false);
  };

  const handleRemove = async () => {
    if (window.confirm('Remove this item from cart?')) {
      setIsLoading(true);
      await onRemove(item.id);
      setIsLoading(false);
    }
  };

  const handleSaveForLater = async () => {
    setIsLoading(true);
    await onSaveForLater(item.id);
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-lg shadow-sm p-4 mb-4"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Image */}
        <Link to={`/product/${item.slug || item.product?.slug}`} className="sm:w-32 h-32">
          <img
            src={imageUrl}
            alt={item.name || item.product?.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
          />
        </Link>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <Link to={`/product/${item.slug || item.product?.slug}`}>
                <h3 className="font-semibold text-lg text-gray-800 hover:text-primary-500 transition-colors">
                  {item.name || item.product?.name}
                </h3>
              </Link>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  condition === 'new' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {condition === 'new' ? 'New' : 'Second-Hand'}
                </span>
                {stock <= 5 && stock > 0 && (
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    Only {stock} left
                  </span>
                )}
                {stock === 0 && (
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-600 font-bold text-xl">
                {formatPrice(itemTotal)}
              </p>
              <p className="text-gray-500 text-sm">
                {formatPrice(price)} each
              </p>
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={handleDecreaseQuantity}
                  disabled={isLoading}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <FiMinus size={16} />
                </button>
                <span className="w-12 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={handleIncreaseQuantity}
                  disabled={isLoading || item.quantity >= stock}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <FiPlus size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveForLater}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-primary-500 transition-colors"
                >
                  <FiHeart size={16} />
                  <span className="text-sm hidden sm:inline">Save for later</span>
                </button>
                <button
                  onClick={handleRemove}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FiTrash2 size={16} />
                  <span className="text-sm hidden sm:inline">Remove</span>
                </button>
              </div>
            </div>

            {/* Delivery Estimate */}
            <div className="text-right text-xs text-gray-500">
              {item.freeShipping ? (
                <span className="text-green-600">Free Shipping</span>
              ) : (
                <span>Delivery: KSH 200-500</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;