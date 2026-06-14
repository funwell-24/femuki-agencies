// src/pages/SellPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

const SellPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    condition: 'second-hand',
    description: '',
    askingPrice: '',
    location: '',
    sellerName: '',
    sellerPhone: '',
    sellerEmail: ''
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const categories = [
    'Beds', 'Mattresses', 'Sofas', 'TVs', 'Fridges', 
    'Microwaves', 'Electronics', 'Office Furniture', 'Household Items'
  ];

  // First, fetch categories to get category IDs
  const [categoriesList, setCategoriesList] = useState([]);
  
  useState(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategoriesList(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          file,
          preview: reader.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.askingPrice || formData.askingPrice <= 0) newErrors.askingPrice = 'Valid price is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Your name is required';
    if (!formData.sellerPhone.trim()) newErrors.sellerPhone = 'Phone number is required';
    if (images.length === 0) newErrors.images = 'At least one product image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error('Please login to submit your product');
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    // Find category ID from category name
    const categoryObj = categoriesList.find(cat => cat.name === formData.category);
    const categoryId = categoryObj ? categoryObj.id : null;
    
    if (!categoryId) {
      toast.error('Please select a valid category');
      setIsSubmitting(false);
      return;
    }
    
    // Prepare FormData for submission
    const submitData = new FormData();
    submitData.append('product_name', formData.productName);
    submitData.append('category_id', categoryId);
    submitData.append('condition', formData.condition);
    submitData.append('description', formData.description);
    submitData.append('asking_price', formData.askingPrice);
    submitData.append('location', formData.location);
    submitData.append('seller_name', formData.sellerName);
    submitData.append('seller_phone', formData.sellerPhone);
    if (formData.sellerEmail) {
      submitData.append('seller_email', formData.sellerEmail);
    }
    
    // Append images
    images.forEach(image => {
      if (image.file) {
        submitData.append('images', image.file);
      }
    });
    
    try {
      const response = await api.post('/submissions', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Product submitted for review!');
        
        // Reset form after 3 seconds and redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error(error.response?.data?.message || 'Failed to submit product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-2xl text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Received!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your product. Our team will review it and get back to you within 24-48 hours.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sell to Femuki Agencies</h1>
          <p className="text-gray-600">Fill out the form below and we'll review your item for purchase</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="space-y-6">
            {/* Product Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.productName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Samsung 43 inch Smart TV"
                  />
                  {errors.productName && <p className="mt-1 text-xs text-red-500">{errors.productName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="condition"
                        value="new"
                        checked={formData.condition === 'new'}
                        onChange={handleInputChange}
                        className="text-primary-500"
                      />
                      <span>New</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="condition"
                        value="second-hand"
                        checked={formData.condition === 'second-hand'}
                        onChange={handleInputChange}
                        className="text-primary-500"
                      />
                      <span>Second-Hand</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe your product (condition, age, reason for selling, etc.)"
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asking Price (KES) *
                    </label>
                    <input
                      type="number"
                      name="askingPrice"
                      value={formData.askingPrice}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.askingPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 15000"
                    />
                    {errors.askingPrice && <p className="mt-1 text-xs text-red-500">{errors.askingPrice}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Nairobi, CBD"
                    />
                    {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p className="text-gray-600">Click to upload images</p>
                  <p className="text-xs text-gray-400 mt-1">Min 1, Max 10 images (JPG, PNG, up to 5MB each)</p>
                </label>
              </div>
              {errors.images && <p className="mt-1 text-xs text-red-500">{errors.images}</p>}
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.sellerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.sellerName && <p className="mt-1 text-xs text-red-500">{errors.sellerName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="sellerPhone"
                    value={formData.sellerPhone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.sellerPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0712345678"
                  />
                  {errors.sellerPhone && <p className="mt-1 text-xs text-red-500">{errors.sellerPhone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="sellerEmail"
                    value={formData.sellerEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg p-4 flex items-start space-x-3">
              <FiInfo className="text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <p>1. Our team will review your submission within 24-48 hours</p>
                <p>2. We may contact you for more information or to negotiate price</p>
                <p>3. If approved, we'll arrange pickup and payment</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default SellPage;