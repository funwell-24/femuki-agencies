// src/components/common/ProductCard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiMessageCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCartContext } from '../../contexts/CartContext';

const ProductCard = ({ product, onFavoriteToggle }) => {
  const { isAuthenticated } = useAuthContext();
  const { addToCart } = useCartContext(); // Add this line to get addToCart from context
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && product.id) {
      checkFavorite();
    }
  }, [isAuthenticated, product.id]);

  const checkFavorite = async () => {
    try {
      const response = await api.get(`/favorites/check/${product.id}`);
      if (response.data.success) {
        setIsSaved(response.data.data.is_favorited);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    const message = `Hello, I am interested in ${product.name} listed on Femuki Agencies website. Price: ${formatPrice(product.price)}`;
    window.open(`https://wa.me/254791254076?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (product.status === 'sold') {
      toast.error('This product is already sold');
      return;
    }
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    const result = await addToCart(product.id, 1);
    if (!result.success) {
      toast.error('Failed to add to cart');
    }
  };

  const handleSaveFavorite = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      return;
    }
    
    setIsLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/favorites/${product.id}`);
        setIsSaved(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/favorites/${product.id}`);
        setIsSaved(true);
        toast.success('Saved to favorites');
      }
      if (onFavoriteToggle) onFavoriteToggle();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the correct image URL
  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url || product.images[0];
    }
    if (product.primary_image) {
      return product.primary_image;
    }
    return '/placeholder.jpg';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="card group"
    >
      <Link to={`/product/${product.slug}`}>
        <div className="relative overflow-hidden">
          <img
            src={getImageUrl()}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
            }}
          />
          <div className="absolute top-2 right-2 flex space-x-2">
            <button
              onClick={handleSaveFavorite}
              disabled={isLoading}
              className="bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
            >
              <FiHeart className={`text-xl ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} />
            </button>
          </div>
          {product.product_condition === 'second-hand' && (
            <span className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              Second Hand
            </span>
          )}
          {product.status === 'sold' && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-xl transform -rotate-12">
                SOLD
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-primary-600 font-bold text-xl mb-2">{formatPrice(product.price)}</p>
          <p className="text-gray-500 text-sm mb-3">
            {product.category?.name || 'Uncategorized'}
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={handleAddToCart}
              disabled={product.status === 'sold'}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg font-semibold
                transition-all duration-300
                ${product.status === 'sold'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
                }
              `}
            >
              <FiShoppingCart />
              <span>Buy</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300"
            >
              <FiMessageCircle />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;