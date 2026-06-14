// src/pages/ProductsPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductFilters from '../components/products/ProductFilters';
import ProductGrid from '../components/products/ProductGrid';
import ProductSearch from '../components/products/ProductSearch';
import ProductSort from '../components/products/ProductSort';
import { FiFilter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') ? [searchParams.get('category')] : [],
    condition: '',
    status: '',
    priceRange: { min: null, max: null }
  });
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filters.condition) params.condition = filters.condition;
      if (filters.category && filters.category.length > 0) {
        params.category = filters.category[0];
      }
      if (filters.priceRange.min) params.min_price = filters.priceRange.min;
      if (filters.priceRange.max) params.max_price = filters.priceRange.max;
      if (sortBy) params.sort_by = sortBy;
      
      const response = await api.get('/products', { params });
      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setFilteredProducts(response.data.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filters, sortBy]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.category && newFilters.category.length > 0) {
      params.category = newFilters.category[0];
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">All Products</h1>
          <p className="text-gray-600">Browse our collection of quality household items</p>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <ProductSearch onSearch={setSearchTerm} />
          </div>
          <div className="flex items-center space-x-3">
            <ProductSort onSortChange={setSortBy} currentSort={sortBy} />
            <button
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg"
            >
              <FiFilter />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <ProductGrid products={filteredProducts} loading={loading} />
          </div>
        </div>

        {/* Mobile Filters Modal */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
              onClick={() => setShowMobileFilters(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute right-0 top-0 bottom-0 w-80 bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <ProductFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  isMobile={true}
                  onClose={() => setShowMobileFilters(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductsPage;