// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import { 
  getProducts, 
  getProduct, 
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getCategories 
} from '../services/products';

/**
 * Custom hook for product management
 * Provides product listing, filtering, and details
 */
const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState(initialFilters);

  // Load all products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getProducts(filters, pagination.page, pagination.limit);
    
    if (result.success) {
      setProducts(result.products);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, [filters, pagination.page, pagination.limit]);

  // Load featured products
  const loadFeaturedProducts = useCallback(async () => {
    const result = await getFeaturedProducts(8);
    if (result.success) {
      setFeaturedProducts(result.products);
    }
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    const result = await getCategories();
    if (result.success) {
      setCategories(result.categories);
    }
  }, []);

  // Search products
  const search = useCallback(async (query, page = 1) => {
    setLoading(true);
    const result = await searchProducts(query, page, pagination.limit);
    
    if (result.success) {
      setProducts(result.products);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    }
    
    setLoading(false);
    return result;
  }, [pagination.limit]);

  // Filter by category
  const filterByCategory = useCallback(async (categorySlug, page = 1) => {
    setLoading(true);
    const result = await getProductsByCategory(categorySlug, page, pagination.limit);
    
    if (result.success) {
      setProducts(result.products);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    }
    
    setLoading(false);
    return result;
  }, [pagination.limit]);

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Change page
  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Get single product
  const getSingleProduct = async (identifier) => {
    const result = await getProduct(identifier);
    return result;
  };

  // Initial load
  useEffect(() => {
    loadProducts();
    loadFeaturedProducts();
    loadCategories();
  }, [loadProducts, loadFeaturedProducts, loadCategories]);

  return {
    // State
    products,
    featuredProducts,
    categories,
    loading,
    error,
    pagination,
    filters,
    
    // Actions
    loadProducts,
    loadFeaturedProducts,
    loadCategories,
    search,
    filterByCategory,
    updateFilters,
    resetFilters,
    goToPage,
    getProduct: getSingleProduct,
  };
};

export default useProducts;