// src/components/common/CategoryCard.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

const CategoryCard = ({ category }) => {
  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Beds': '🛏️',
      'Mattresses': '🛌',
      'Sofas': '🛋️',
      'TVs': '📺',
      'Fridges': '🧊',
      'Microwaves': '🔥',
      'Electronics': '💻',
      'Office Furniture': '🪑',
      'Household Items': '🏠'
    };
    return icons[categoryName] || '📦';
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link to={`/products?category=${category.slug}`}>
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
          {/* Category Image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-orange-100">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">{getCategoryIcon(category.name)}</span>
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
          </div>
          
          {/* Category Info */}
          <div className="p-4 text-center">
            <h3 className="font-semibold text-lg text-gray-800 mb-1">
              {category.name}
            </h3>
            <p className="text-gray-500 text-sm mb-3">
              {category.product_count || 0} products
            </p>
            <div className="inline-flex items-center text-primary-500 font-medium text-sm group-hover:text-primary-600">
              <span>Browse</span>
              <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" size={14} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;