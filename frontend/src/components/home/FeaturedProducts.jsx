// src/components/home/FeaturedProducts.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../common/ProductCard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/featured');
      if (response.data.success) {
        setProducts(response.data.data || []);
      } else {
        // Fallback to regular products if featured endpoint fails
        const productsResponse = await api.get('/products?limit=4');
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data.products || []);
        }
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Fallback: fetch regular products
      try {
        const productsResponse = await api.get('/products?limit=4');
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data.products || []);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        toast.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
            <p className="text-gray-600">Check out our most popular items</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
            <p className="text-gray-600">Check out our most popular items</p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">No products available at the moment.</p>
            <Link to="/products" className="btn-primary inline-block mt-4">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Products</h2>
          <p className="text-gray-600">Check out our most popular items</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Link to="/products" className="btn-outline inline-block">
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;