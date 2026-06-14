// src/pages/FavoritesPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiMessageCircle, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

const FavoritesPage = () => {
  const { isAuthenticated } = useAuthContext();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchFavorites();
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/favorites');
      if (response.data.success) {
        setFavorites(response.data.data.favorites || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId) => {
    try {
      const response = await api.delete(`/favorites/${productId}`);
      if (response.data.success) {
        setFavorites(prev => prev.filter(f => f.product?.id !== productId));
        toast.success('Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleWhatsApp = (product) => {
    const message = `Hello, I am interested in ${product.name} listed on Femuki Agencies website. Price: ${formatPrice(product.price)}`;
    window.open(`https://wa.me/254791254076?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHeart className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Please Login</h2>
          <p className="text-gray-600 mb-6">Login to view your favorite items</p>
          <Link to="/login" className="btn-primary inline-block">Login</Link>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHeart className="text-4xl text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Favorites Yet</h2>
          <p className="text-gray-600 mb-6">Start adding items to your favorites</p>
          <Link to="/products" className="btn-primary inline-block">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Favorites</h1>
          <p className="text-gray-600">{favorites.length} saved items</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((fav, index) => {
            const product = fav.product;
            if (!product) return null;
            
            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link to={`/product/${product.slug}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.images?.[0] || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {product.product_condition === 'second-hand' && (
                      <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Second Hand
                      </span>
                    )}
                    {product.status === 'sold' && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD</span>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-gray-800 mb-1 hover:text-primary-500 line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-primary-600 font-bold text-lg mb-2">
                    {formatPrice(product.price)}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">
                    {product.category?.name || 'Uncategorized'}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 size={16} />
                      <span>Remove</span>
                    </button>
                    <button
                      onClick={() => handleWhatsApp(product)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <FiMessageCircle size={16} />
                      <span>Inquire</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;