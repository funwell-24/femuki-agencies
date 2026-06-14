// src/components/dashboard/admin/SubmissionsTable.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiEye, 
  FiCheckCircle, 
  FiXCircle, 
  FiMessageCircle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const SubmissionsTable = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Fetch submissions from API
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/submissions', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchTerm || undefined
        }
      });
      
      if (response.data.success) {
        setSubmissions(response.data.data.submissions || []);
        setTotalSubmissions(response.data.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, statusFilter, searchTerm]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { icon: FiClock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      reviewing: { icon: FiEye, color: 'bg-blue-100 text-blue-700', label: 'Reviewing' },
      approved: { icon: FiCheckCircle, color: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { icon: FiXCircle, color: 'bg-red-100 text-red-700', label: 'Rejected' },
      purchased: { icon: FiDollarSign, color: 'bg-purple-100 text-purple-700', label: 'Purchased' }
    };
    return config[status] || config.pending;
  };

  const handleReview = (submission) => {
    setSelectedSubmission(submission);
    setReviewNotes(submission.admin_notes || '');
    setNegotiatedPrice(submission.negotiated_price?.toString() || submission.asking_price?.toString() || '');
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    setProcessing(true);
    try {
      const response = await api.post(`/admin/submissions/${selectedSubmission.id}/review`, {
        action: 'approve',
        notes: reviewNotes,
        negotiated_price: parseFloat(negotiatedPrice)
      });
      
      if (response.data.success) {
        toast.success(`Submission approved for ${formatPrice(parseFloat(negotiatedPrice))}`);
        fetchSubmissions(); // Refresh the list
        setShowReviewModal(false);
        
        // Send WhatsApp notification
        const message = `Hello ${selectedSubmission.seller_name}, your item "${selectedSubmission.product_name}" has been approved for ${formatPrice(parseFloat(negotiatedPrice))}. Our team will contact you for pickup.`;
        window.open(`https://wa.me/${selectedSubmission.seller_phone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve submission');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    
    setProcessing(true);
    try {
      const response = await api.post(`/admin/submissions/${selectedSubmission.id}/review`, {
        action: 'reject',
        notes: reviewNotes
      });
      
      if (response.data.success) {
        toast.error('Submission rejected');
        fetchSubmissions(); // Refresh the list
        setShowReviewModal(false);
        
        // Send WhatsApp notification
        const message = `Hello ${selectedSubmission.seller_name}, unfortunately your item "${selectedSubmission.product_name}" has been rejected. Reason: ${reviewNotes || 'Does not meet our current requirements'}`;
        window.open(`https://wa.me/${selectedSubmission.seller_phone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject submission');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPurchased = async (submissionId) => {
    if (!window.confirm('Mark this item as purchased?')) return;
    
    setProcessing(true);
    try {
      const response = await api.post(`/admin/submissions/${submissionId}/purchase`, {
        purchase_price: selectedSubmission?.negotiated_price || selectedSubmission?.asking_price
      });
      
      if (response.data.success) {
        toast.success('Product marked as purchased');
        fetchSubmissions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalSubmissions / itemsPerPage);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="font-semibold text-lg text-gray-800">Seller Submissions</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Refresh Button */}
              <button
                onClick={fetchSubmissions}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiRefreshCw size={16} />
                <span>Refresh</span>
              </button>

              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Seller</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Asking Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No submissions found
                  </td>
                </tr>
              ) : (
                submissions.map((submission, index) => {
                  const StatusConfig = getStatusConfig(submission.status);
                  const StatusIcon = StatusConfig.icon;
                  return (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{submission.product_name}</p>
                          <p className="text-xs text-gray-500">{submission.condition}</p>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-800">{submission.seller_name}</p>
                          <p className="text-xs text-gray-500">{submission.seller_phone}</p>
                        </div>
                       </td>
                      <td className="px-4 py-3 text-gray-600">{submission.category?.name || 'N/A'}</td>
                      <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(submission.asking_price)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(submission.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${StatusConfig.color}`}>
                          <StatusIcon size={12} />
                          <span>{StatusConfig.label}</span>
                        </span>
                       </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleReview(submission)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          {(submission.status === 'pending' || submission.status === 'reviewing') && (
                            <button
                              onClick={() => handleReview(submission)}
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              title="Review"
                            >
                              <FiCheckCircle size={16} />
                            </button>
                          )}
                          {submission.status === 'approved' && (
                            <button
                              onClick={() => handleMarkPurchased(submission.id)}
                              className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Mark as Purchased"
                            >
                              <FiDollarSign size={16} />
                            </button>
                          )}
                          <button 
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Message Seller"
                            onClick={() => window.open(`https://wa.me/${submission.seller_phone}`, '_blank')}
                          >
                            <FiMessageCircle size={16} />
                          </button>
                        </div>
                       </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalSubmissions)} of {totalSubmissions} submissions
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <FiChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-primary-500 text-white rounded-lg">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Review Submission</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-800">{selectedSubmission.product_name}</p>
                  <p className="text-sm text-gray-500">Seller: {selectedSubmission.seller_name}</p>
                  <p className="text-sm text-gray-500">Phone: {selectedSubmission.seller_phone}</p>
                  <p className="text-primary-600 font-semibold mt-1">{formatPrice(selectedSubmission.asking_price)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Negotiated Price (KES)
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={negotiatedPrice}
                      onChange={(e) => setNegotiatedPrice(e.target.value)}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    rows="3"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes for the seller..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default SubmissionsTable;