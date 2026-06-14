// src/components/dashboard/admin/AddProductForm.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';

const AddProductForm = ({ product, onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    condition: 'second-hand',
    quantity: 1,
    dimensions: '',
    featured: false
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id || '',
        description: product.description || '',
        price: product.price || '',
        condition: product.product_condition || 'second-hand',
        quantity: product.quantity || 1,
        dimensions: product.dimensions || '',
        featured: product.featured || false
      });
      // Load existing images for edit mode
      if (product.images && product.images.length > 0) {
        setImages(product.images.map(img => ({
          url: img.image_url,
          isPrimary: img.is_primary,
          preview: img.image_url
        })));
      }
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
          preview: reader.result,
          isPrimary: prev.length === 0 && !product
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!product && images.length === 0) newErrors.images = 'At least one product image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('category_id', formData.category_id);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price);
    submitData.append('condition', formData.condition);
    submitData.append('quantity', formData.quantity);
    submitData.append('dimensions', formData.dimensions);
    submitData.append('featured', formData.featured ? 'true' : 'false');
    
    // Append new images
    images.forEach(image => {
      if (image.file) {
        submitData.append('images', image.file);
      }
    });
    
    try {
      let response;
      if (product) {
        response = await api.put(`/admin/products/${product.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/admin/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        toast.success(product ? 'Product updated successfully!' : 'Product added successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800">
          {product ? 'Edit Product' : 'Add New Product'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">Fill in the product details below</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Samsung 43 inch Smart TV"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.category_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>}
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
            placeholder="Detailed product description..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (KES) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 28500"
            />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="new">New</option>
              <option value="second-hand">Second-Hand</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensions (Optional)
            </label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 150cm x 80cm x 45cm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="featured"
            id="featured"
            checked={formData.featured}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
          />
          <label htmlFor="featured" className="text-sm font-medium text-gray-700">
            Feature this product on homepage
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images {!product && '*'} (Max 10 images)
          </label>
          
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
              <p className="text-gray-600">Click or drag images to upload</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 5MB each</p>
            </label>
          </div>
          
          {errors.images && <p className="mt-1 text-xs text-red-500">{errors.images}</p>}
          
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    {!image.isPrimary && images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="px-2 py-1 bg-primary-500 text-white text-xs rounded"
                      >
                        Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                    >
                      Delete
                    </button>
                  </div>
                  {image.isPrimary && (
                    <span className="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FiSave size={16} />
              <span>{product ? 'Update Product' : 'Save Product'}</span>
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
};

export default AddProductForm;