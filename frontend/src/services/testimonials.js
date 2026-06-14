// src/services/testimonials.js
import { get, post, put, del } from './api';

// Get all approved testimonials (public)
export const getTestimonials = async (limit = 10, page = 1) => {
  try {
    const response = await get(`/testimonials?limit=${limit}&page=${page}`);
    
    if (response.data.success) {
      return {
        success: true,
        testimonials: response.data.data.testimonials,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, testimonials: [], pagination: null };
  } catch (error) {
    console.error('Get testimonials error:', error);
    return { success: false, testimonials: [] };
  }
};

// Get product testimonials
export const getProductTestimonials = async (productId, limit = 5) => {
  try {
    const response = await get(`/products/${productId}/testimonials?limit=${limit}`);
    
    if (response.data.success) {
      return { success: true, testimonials: response.data.data };
    }
    return { success: false, testimonials: [] };
  } catch (error) {
    console.error('Get product testimonials error:', error);
    return { success: false, testimonials: [] };
  }
};

// Add testimonial (authenticated users)
export const addTestimonial = async (testimonialData) => {
  try {
    const response = await post('/testimonials', {
      product_id: testimonialData.productId,
      rating: testimonialData.rating,
      review: testimonialData.review,
    });
    
    if (response.data.success) {
      toast.success('Thank you for your review!');
      return { success: true, testimonial: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Add testimonial error:', error);
    const message = error.response?.data?.message || 'Failed to submit review';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Update testimonial (owner only)
export const updateTestimonial = async (testimonialId, data) => {
  try {
    const response = await put(`/testimonials/${testimonialId}`, {
      rating: data.rating,
      review: data.review,
    });
    
    if (response.data.success) {
      toast.success('Review updated');
      return { success: true, testimonial: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update testimonial error:', error);
    return { success: false, error: error.message };
  }
};

// Delete testimonial (owner or admin)
export const deleteTestimonial = async (testimonialId) => {
  try {
    const response = await del(`/testimonials/${testimonialId}`);
    
    if (response.data.success) {
      toast.success('Review deleted');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return { success: false, error: error.message };
  }
};

// Get user's testimonials
export const getUserTestimonials = async () => {
  try {
    const response = await get('/user/testimonials');
    
    if (response.data.success) {
      return { success: true, testimonials: response.data.data };
    }
    return { success: false, testimonials: [] };
  } catch (error) {
    console.error('Get user testimonials error:', error);
    return { success: false, testimonials: [] };
  }
};

// Admin: Get all testimonials (including pending)
export const getAllTestimonials = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await get(`/admin/testimonials?${params.toString()}`);
    
    if (response.data.success) {
      return {
        success: true,
        testimonials: response.data.data.testimonials,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, testimonials: [], pagination: null };
  } catch (error) {
    console.error('Get all testimonials error:', error);
    return { success: false, testimonials: [] };
  }
};

// Admin: Approve testimonial
export const approveTestimonial = async (testimonialId) => {
  try {
    const response = await post(`/admin/testimonials/${testimonialId}/approve`);
    
    if (response.data.success) {
      toast.success('Review approved');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Approve testimonial error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Reject testimonial
export const rejectTestimonial = async (testimonialId, reason = '') => {
  try {
    const response = await post(`/admin/testimonials/${testimonialId}/reject`, { reason });
    
    if (response.data.success) {
      toast.success('Review rejected');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Reject testimonial error:', error);
    return { success: false, error: error.message };
  }
};

// Get testimonial statistics (admin)
export const getTestimonialStats = async () => {
  try {
    const response = await get('/admin/testimonials/stats');
    
    if (response.data.success) {
      return { success: true, stats: response.data.data };
    }
    return { success: false, stats: null };
  } catch (error) {
    console.error('Get testimonial stats error:', error);
    return { success: false, stats: null };
  }
};