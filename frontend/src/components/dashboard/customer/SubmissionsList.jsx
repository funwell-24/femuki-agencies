// src/components/dashboard/customer/SubmissionsList.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCheckCircle, FiXCircle, FiEye, FiMessageCircle, FiPackage } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthContext } from '../../../contexts/AuthContext';

const SubmissionsList = () => {
  const { isAuthenticated } = useAuthContext();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/submissions');
      if (response.data.success) {
        setSubmissions(response.data.data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: {
        color: 'bg-yellow-100 text-yellow-700',
        icon: FiClock,
        label: 'Pending Review',
        description: 'Your submission is waiting to be reviewed'
      },
      reviewing: {
        color: 'bg-blue-100 text-blue-700',
        icon: FiEye,
        label: 'Under Review',
        description: 'Our team is reviewing your item'
      },
      approved: {
        color: 'bg-green-100 text-green-700',
        icon: FiCheckCircle,
        label: 'Approved',
        description: 'Your item has been approved! We will contact you.'
      },
      rejected: {
        color: 'bg-red-100 text-red-700',
        icon: FiXCircle,
        label: 'Rejected',
        description: 'Unfortunately, we cannot purchase this item'
      },
      purchased: {
        color: 'bg-purple-100 text-purple-700',
        icon: FiPackage,
        label: 'Purchased',
        description: 'Item has been purchased by Femuki Agencies'
      }
    };
    return config[status] || config.pending;
  };

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

  const getImageUrl = (submission) => {
    if (submission.images && submission.images.length > 0) {
      return submission.images[0].image_url || submission.images[0];
    }
    return '/placeholder.jpg';
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Please Login</h3>
        <p className="text-gray-500 mb-6">Login to view your submissions</p>
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
            <div key={i} className="border rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No submissions yet</h3>
        <p className="text-gray-500 mb-6">Want to sell your items to Femuki Agencies?</p>
        <Link to="/sell" className="btn-primary inline-block">
          Sell Your Item
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission, index) => {
        const StatusConfig = getStatusConfig(submission.status);
        const StatusIcon = StatusConfig.icon;
        
        return (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getImageUrl(submission)}
                        alt={submission.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {submission.product_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{submission.category?.name || 'Uncategorized'}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {submission.condition === 'new' ? 'New' : submission.condition === 'second-hand' ? 'Second-Hand' : submission.condition}
                        </span>
                        <span className="text-sm font-semibold text-primary-600">
                          {formatPrice(submission.asking_price)}
                        </span>
                        {submission.negotiated_price && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Offer: {formatPrice(submission.negotiated_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full ${StatusConfig.color}`}>
                  <StatusIcon size={14} />
                  <span className="text-sm font-medium">{StatusConfig.label}</span>
                </div>
              </div>

              {/* Status Details */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-500">
                      Submitted: {formatDate(submission.created_at)}
                    </span>
                    {submission.reviewed_at && (
                      <span className="text-gray-500">
                        Reviewed: {formatDate(submission.reviewed_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{StatusConfig.description}</p>
                </div>

                {/* Admin Notes */}
                {submission.admin_notes && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <FiMessageCircle className="text-blue-500 mt-0.5" size={14} />
                      <div>
                        <p className="text-xs font-semibold text-blue-700">Note from Admin:</p>
                        <p className="text-sm text-blue-800">{submission.admin_notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons for Approved/Purchased */}
                {(submission.status === 'approved' || submission.status === 'purchased') && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => window.open(`https://wa.me/254791254076?text=Hello, I have a question about my submission: ${submission.product_name}`, '_blank')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      <FiMessageCircle size={14} />
                      <span>Contact Admin</span>
                    </button>
                  </div>
                )}

                {/* Re-submit button for rejected */}
                {submission.status === 'rejected' && (
                  <div className="mt-3 flex justify-end">
                    <Link
                      to="/sell"
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                    >
                      Submit New Item
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SubmissionsList;