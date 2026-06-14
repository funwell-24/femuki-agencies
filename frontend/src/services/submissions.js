// src/services/submissions.js
import { get, post, put, del } from './api';

// Submit product for sale
export const submitProduct = async (submissionData) => {
  try {
    const formData = new FormData();
    
    // Append all submission data
    Object.keys(submissionData).forEach(key => {
      if (key !== 'images') {
        formData.append(key, submissionData[key]);
      }
    });
    
    // Append images
    if (submissionData.images && submissionData.images.length > 0) {
      submissionData.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    if (response.data.success) {
      toast.success('Product submitted for review!');
      return { success: true, submission: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Submit product error:', error);
    const message = error.response?.data?.message || 'Failed to submit product';
    toast.error(message);
    return { success: false, error: message };
  }
};

// Get user's submissions
export const getUserSubmissions = async (page = 1, limit = 10) => {
  try {
    const response = await get(`/submissions?page=${page}&limit=${limit}`);
    
    if (response.data.success) {
      return {
        success: true,
        submissions: response.data.data.submissions,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, submissions: [], pagination: null };
  } catch (error) {
    console.error('Get user submissions error:', error);
    return { success: false, submissions: [] };
  }
};

// Get single submission
export const getSubmission = async (submissionId) => {
  try {
    const response = await get(`/submissions/${submissionId}`);
    
    if (response.data.success) {
      return { success: true, submission: response.data.data };
    }
    return { success: false, submission: null };
  } catch (error) {
    console.error('Get submission error:', error);
    return { success: false, submission: null };
  }
};

// Update submission (customer)
export const updateSubmission = async (submissionId, submissionData) => {
  try {
    const response = await put(`/submissions/${submissionId}`, submissionData);
    
    if (response.data.success) {
      toast.success('Submission updated');
      return { success: true, submission: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update submission error:', error);
    return { success: false, error: error.message };
  }
};

// Delete submission (customer)
export const deleteSubmission = async (submissionId) => {
  try {
    const response = await del(`/submissions/${submissionId}`);
    
    if (response.data.success) {
      toast.success('Submission deleted');
      return { success: true };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Delete submission error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Get all submissions
export const getAllSubmissions = async (filters = {}, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await get(`/admin/submissions?${params.toString()}`);
    
    if (response.data.success) {
      return {
        success: true,
        submissions: response.data.data.submissions,
        pagination: response.data.data.pagination,
      };
    }
    return { success: false, submissions: [], pagination: null };
  } catch (error) {
    console.error('Get all submissions error:', error);
    return { success: false, submissions: [] };
  }
};

// Admin: Review submission (approve/reject)
export const reviewSubmission = async (submissionId, action, data = {}) => {
  try {
    const response = await post(`/admin/submissions/${submissionId}/review`, {
      action, // 'approve', 'reject', 'negotiate'
      ...data,
    });
    
    if (response.data.success) {
      const message = action === 'approve' 
        ? 'Submission approved!' 
        : action === 'reject' 
          ? 'Submission rejected' 
          : 'Negotiation price sent';
      toast.success(message);
      return { success: true, submission: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Review submission error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Update submission status
export const updateSubmissionStatus = async (submissionId, status, notes = '') => {
  try {
    const response = await put(`/admin/submissions/${submissionId}/status`, {
      status,
      notes,
    });
    
    if (response.data.success) {
      toast.success(`Submission status updated to ${status}`);
      return { success: true, submission: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Update submission status error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Mark as purchased
export const markAsPurchased = async (submissionId, purchasePrice) => {
  try {
    const response = await post(`/admin/submissions/${submissionId}/purchase`, {
      purchase_price: purchasePrice,
    });
    
    if (response.data.success) {
      toast.success('Product marked as purchased');
      return { success: true, submission: response.data.data };
    }
    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Mark as purchased error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Get submission statistics
export const getSubmissionStats = async () => {
  try {
    const response = await get('/admin/submissions/stats');
    
    if (response.data.success) {
      return { success: true, stats: response.data.data };
    }
    return { success: false, stats: null };
  } catch (error) {
    console.error('Get submission stats error:', error);
    return { success: false, stats: null };
  }
};