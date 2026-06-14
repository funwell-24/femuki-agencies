// src/components/products/ProductGrid.jsx
import { motion } from 'framer-motion';
import ProductCard from '../common/ProductCard';
import { FiGrid, FiList } from 'react-icons/fi';

const ProductGrid = ({ products, loading, viewMode = 'grid', onViewModeChange }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="h-64 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="flex space-x-2">
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 h-48">
                <img
                  src={product.images?.[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.product_condition === 'new' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {product.product_condition === 'new' ? 'New' : 'Second-Hand'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'available'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.status === 'available' ? 'Available' : 'Sold'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-primary-600 font-bold text-xl">
                    KSH {product.price.toLocaleString()}
                  </span>
                  <button className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Grid View
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid;