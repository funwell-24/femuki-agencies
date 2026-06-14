// src/components/products/ProductSort.jsx
import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ProductSort = ({ onSortChange, currentSort = 'newest' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'most_viewed', label: 'Most Viewed' },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === currentSort);
    return option ? option.label : 'Sort By';
  };

  const handleSortChange = (value) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Sort Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-primary-500 transition-colors"
      >
        <span className="text-gray-700">{getCurrentSortLabel()}</span>
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {/* Sort Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="py-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors
                    ${currentSort === option.value 
                      ? 'text-primary-500 bg-primary-50 font-semibold' 
                      : 'text-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {currentSort === option.value && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductSort;