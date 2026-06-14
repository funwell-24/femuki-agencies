// src/components/dashboard/admin/ProductsTable.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiCheckCircle, 
  FiXCircle,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPlus
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import AddProductForm from './AddProductForm';

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch real products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/products');
      if (response.data.success) {
        setProducts(response.data.data.products || []);
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
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><FiCheckCircle size={12} className="mr-1" /> Available</span>;
    }
    if (status === 'sold') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><FiXCircle size={12} className="mr-1" /> Sold</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{status}</span>;
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        const response = await api.delete(`/admin/products/${productId}`);
        if (response.data.success) {
          toast.success('Product deleted successfully');
          fetchProducts(); // Refresh the list
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      const response = await api.patch(`/admin/products/${productId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Product marked as ${newStatus}`);
        fetchProducts(); // Refresh the list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Filter products based on search and status filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || product.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (showAddForm || editingProduct) {
    return (
      <AddProductForm 
        product={editingProduct}
        onSuccess={() => {
          setShowAddForm(false);
          setEditingProduct(null);
          fetchProducts();
        }}
        onCancel={() => {
          setShowAddForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="font-semibold text-lg text-gray-800">Products Management</h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <FiPlus size={16} />
              <span>Add Product</span>
            </button>
            
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Products</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Condition</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Views</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">ID: {product.id}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{product.category?.name || 'Uncategorized'}</td>
                <td className="px-4 py-3 font-semibold text-primary-600">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.product_condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {product.product_condition === 'new' ? 'New' : 'Second-Hand'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={product.quantity === 0 ? 'text-red-500' : 'text-gray-600'}>
                    {product.quantity}
                  </span>
                </td>
                <td className="px-4 py-3">{getStatusBadge(product.status)}</td>
                <td className="px-4 py-3 text-gray-600">{product.views || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FiEye size={16} />
                    </button>
                    <button 
                      onClick={() => setEditingProduct(product)}
                      className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleStatusToggle(product.id, product.status)}
                      className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <FiCheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
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
  );
};

export default ProductsTable;