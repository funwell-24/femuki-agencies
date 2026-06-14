// src/services/products.js
import { get, post, put, del } from './api';

// Get all products with filters
export const getProducts = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to params
    if (filters.category && filters.category.length > 0) {
      params.append('category', filters.category.join(','));
    }
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.status) params.append('status', filters.status);
    if (filters.minPrice) params.append('min_price', filters.minPrice);
    if (filters.maxPrice) params.append('max_price', filters.maxPrice);
    if (filters.search) params.append('search', filters.search);
    
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await get(`/products?${params.toString()}`);
    
    if (response.data.success) {
      return {
        success: true,
        products: response.data.data.products,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, products: [], pagination: null };
  } catch (error) {
    console.error('Get products error:', error);
    return { success: false, products: [], pagination: null, error: error.message };
  }
};

// Get single product by slug or ID
export const getProduct = async (identifier) => {
  try {
    const response = await get(`/products/${identifier}`);
    
    if (response.data.success) {
      // Increment view count
      await incrementViewCount(identifier);
      return { success: true, product: response.data.data };
    }
    return { success: false, product: null };
  } catch (error) {
    console.error('Get product error:', error);
    return { success: false, product: null, error: error.message };
  }
};

// Increment product view count
export const incrementViewCount = async (productId) => {
  try {
    await post(`/products/${productId}/view`);
  } catch (error) {
    console.error('Increment view error:', error);
  }
};

// Get featured products
export const getFeaturedProducts = async (limit = 8) => {
  try {
    const response = await get(`/products/featured?limit=${limit}`);
    
    if (response.data.success) {
      return { success: true, products: response.data.data };
    }
    return { success: false, products: [] };
  } catch (error) {
    console.error('Get featured products error:', error);
    return { success: false, products: [] };
  }
};

// Get products by category
export const getProductsByCategory = async (categorySlug, page = 1, limit = 20) => {
  try {
    const response = await get(`/categories/${categorySlug}/products?page=${page}&limit=${limit}`);
    
    if (response.data.success) {
      return {
        success: true,
        products: response.data.data.products,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, products: [], pagination: null };
  } catch (error) {
    console.error('Get products by category error:', error);
    return { success: false, products: [] };
  }
};

// Get related products
export const getRelatedProducts = async (productId, categoryId, limit = 4) => {
  try {
    const response = await get(`/products/${productId}/related?limit=${limit}`);
    
    if (response.data.success) {
      return { success: true, products: response.data.data };
    }
    return { success: false, products: [] };
  } catch (error) {
    console.error('Get related products error:', error);
    return { success: false, products: [] };
  }
};

// Search products
export const searchProducts = async (query, page = 1, limit = 20) => {
  try {
    const response = await get(`/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    
    if (response.data.success) {
      return {
        success: true,
        products: response.data.data.products,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, products: [], pagination: null };
  } catch (error) {
    console.error('Search products error:', error);
    return { success: false, products: [] };
  }
};

// Admin: Add new product
export const addProduct = async (productData) => {
  try {
    const formData = new FormData();
    
    // Append all product data
    Object.keys(productData).forEach(key => {
      if (key !== 'images') {
        formData.append(key, productData[key]);
      }
    });
    
    // Append images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    const response = await post('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    if (response.data.success) {
      toast.success('Product added successfully');
      return { success: true, product: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Add product error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Update product
export const updateProduct = async (productId, productData) => {
  try {
    const formData = new FormData();
    
    Object.keys(productData).forEach(key => {
      if (key !== 'images' && key !== 'removedImages') {
        formData.append(key, productData[key]);
      }
    });
    
    // Append new images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    // Append removed image IDs
    if (productData.removedImages && productData.removedImages.length > 0) {
      formData.append('removed_images', JSON.stringify(productData.removedImages));
    }
    
    const response = await put(`/admin/products/${productId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    if (response.data.success) {
      toast.success('Product updated successfully');
      return { success: true, product: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update product error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Delete product
export const deleteProduct = async (productId) => {
  try {
    const response = await del(`/admin/products/${productId}`);
    
    if (response.data.success) {
      toast.success('Product deleted successfully');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Delete product error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Toggle product status (available/sold)
export const toggleProductStatus = async (productId, status) => {
  try {
    const response = await patch(`/admin/products/${productId}/status`, { status });
    
    if (response.data.success) {
      toast.success(`Product marked as ${status}`);
      return { success: true, product: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Toggle product status error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Toggle featured status
export const toggleFeatured = async (productId, featured) => {
  try {
    const response = await patch(`/admin/products/${productId}/featured`, { featured });
    
    if (response.data.success) {
      toast.success(featured ? 'Product featured' : 'Product removed from featured');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Toggle featured error:', error);
    return { success: false, error: error.message };
  }
};

// Get all categories
export const getCategories = async () => {
  try {
    const response = await get('/categories');
    
    if (response.data.success) {
      return { success: true, categories: response.data.data };
    }
    return { success: false, categories: [] };
  } catch (error) {
    console.error('Get categories error:', error);
    return { success: false, categories: [] };
  }
};

// Get single category
export const getCategory = async (categorySlug) => {
  try {
    const response = await get(`/categories/${categorySlug}`);
    
    if (response.data.success) {
      return { success: true, category: response.data.data };
    }
    return { success: false, category: null };
  } catch (error) {
    console.error('Get category error:', error);
    return { success: false, category: null };
  }
};