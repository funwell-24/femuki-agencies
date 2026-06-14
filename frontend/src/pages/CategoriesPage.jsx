// src/pages/CategoriesPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CategoryCard from '../components/common/CategoryCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop by Category</h1>
            <p className="text-gray-600">Browse our products by category</p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No categories available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop by Category</h1>
          <p className="text-gray-600">Browse our products by category</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <CategoryCard category={category} />
            </motion.div>
          ))}
        </div>

        {/* Featured Categories Banner */}
        <div className="mt-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Can't find what you're looking for?</h2>
          <p className="mb-4 opacity-90">Contact us and we'll help you find the perfect item</p>
          <Link to="/contact" className="inline-block bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;