// src/components/dashboard/customer/SavedProducts.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthContext } from '../../../contexts/AuthContext';

const SavedProducts = () => {
  const { isAuthenticated } = useAuthContext();
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedProducts();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSavedProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/favorites');
      if (response.data.success) {
        const favorites = response.data.data.favorites || [];
        setSavedProducts(favorites.map(fav => fav.product));
      }
    } catch (error) {
      console.error('Error fetching saved products:', error);
      toast.error('Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleRemoveSaved = async (productId) => {
    try {
      const response = await api.delete(`/favorites/${productId}`);
      if (response.data.success) {
        setSavedProducts(prev => prev.filter(p => p.id !== productId));
        toast.success('Removed from saved items');
      }
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const handleWhatsApp = (product) => {
    const message = `Hello, I am interested in ${product.name} listed on Femuki Agencies website. Price: ${formatPrice(product.price)}`;
    window.open(`https://wa.me/254791254076?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = (product) => {
    if (product.status === 'sold') {
      toast.error('This product is already sold');
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Added to cart!');
  };

  const getImageUrl = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].image_url || product.images[0];
    }
    return '/placeholder.jpg';
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Please Login</h3>
        <p className="text-gray-500 mb-6">Login to view your saved items</p>
        <Link to="/login" className="btn-primary inline-block">
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (savedProducts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No saved items</h3>
        <p className="text-gray-500 mb-6">Save products you love and they'll appear here</p>
        <Link to="/products" className="btn-primary inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedProducts.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Product Image */}
            <Link to={`/product/${product.slug}`} className="sm:w-32 h-32 bg-gray-100">
              <img
                src={getImageUrl(product)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/placeholder.jpg'; }}
              />
            </Link>

            {/* Product Info */}
            <div className="flex-1 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-lg text-gray-800 hover:text-primary-500 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.product_condition === 'new' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {product.product_condition === 'new' ? 'New' : 'Second-Hand'}
                    </span>
                    {product.status === 'sold' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        Sold
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary-600 font-bold text-xl">{formatPrice(product.price)}</p>
                  <p className="text-xs text-gray-500">ID: {product.id}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.status === 'sold'}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      product.status === 'sold'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    <FiShoppingCart size={14} />
                    <span>Buy Now</span>
                  </button>
                  <button
                    onClick={() => handleWhatsApp(product)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <FiMessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveSaved(product.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SavedProducts;