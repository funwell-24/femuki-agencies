// src/components/products/ProductFilters.jsx
import { useState, useEffect } from 'react';
import { FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ProductFilters = ({ filters, onFilterChange, onClose, isMobile }) => {
  const [isExpanded, setIsExpanded] = useState({});
  const [localFilters, setLocalFilters] = useState(filters);

  const categories = [
    { id: 1, name: 'Beds', slug: 'beds' },
    { id: 2, name: 'Mattresses', slug: 'mattresses' },
    { id: 3, name: 'Sofas', slug: 'sofas' },
    { id: 4, name: 'TVs', slug: 'tvs' },
    { id: 5, name: 'Fridges', slug: 'fridges' },
    { id: 6, name: 'Microwaves', slug: 'microwaves' },
    { id: 7, name: 'Electronics', slug: 'electronics' },
    { id: 8, name: 'Office Furniture', slug: 'office-furniture' },
    { id: 9, name: 'Household Items', slug: 'household-items' },
  ];

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'second-hand', label: 'Second-Hand' },
  ];

  const availabilityOptions = [
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleSection = (section) => {
    setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryChange = (categorySlug) => {
    const currentCategories = localFilters.category || [];
    let newCategories;
    
    if (currentCategories.includes(categorySlug)) {
      newCategories = currentCategories.filter(c => c !== categorySlug);
    } else {
      newCategories = [...currentCategories, categorySlug];
    }
    
    const newFilters = { ...localFilters, category: newCategories };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleConditionChange = (condition) => {
    const newFilters = { ...localFilters, condition };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAvailabilityChange = (status) => {
    const newFilters = { ...localFilters, status };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (type, value) => {
    const newFilters = {
      ...localFilters,
      priceRange: {
        ...localFilters.priceRange,
        [type]: value ? parseFloat(value) : null
      }
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      category: [],
      condition: '',
      status: '',
      priceRange: { min: null, max: null }
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.category?.length) count += localFilters.category.length;
    if (localFilters.condition) count++;
    if (localFilters.status) count++;
    if (localFilters.priceRange?.min) count++;
    if (localFilters.priceRange?.max) count++;
    return count;
  };

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between text-left font-semibold text-gray-700"
      >
        <span>{title}</span>
        {isExpanded[section] ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      <AnimatePresence>
        {isExpanded[section] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FiFilter className="text-primary-500" />
          <h3 className="font-semibold text-lg">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Clear All
          </button>
        )}
        {isMobile && (
          <button onClick={onClose} className="text-gray-500">
            <FiX size={24} />
          </button>
        )}
      </div>

      {/* Filter Content */}
      <div className="p-4">
        {/* Categories */}
        <FilterSection title="Categories" section="categories">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.category?.includes(category.slug) || false}
                  onChange={() => handleCategoryChange(category.slug)}
                  className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700 flex-1">{category.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Condition */}
        <FilterSection title="Condition" section="condition">
          <div className="space-y-2">
            {conditions.map((condition) => (
              <label key={condition.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={localFilters.condition === condition.value}
                  onChange={() => handleConditionChange(condition.value)}
                  className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-gray-700">{condition.label}</span>
              </label>
            ))}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="condition"
                value=""
                checked={!localFilters.condition}
                onChange={() => handleConditionChange('')}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-gray-700">All</span>
            </label>
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" section="price">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Minimum Price (KES)</label>
              <input
                type="number"
                placeholder="Min"
                value={localFilters.priceRange?.min || ''}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Maximum Price (KES)</label>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.priceRange?.max || ''}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" section="availability">
          <div className="space-y-2">
            {availabilityOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={localFilters.status === option.value}
                  onChange={() => handleAvailabilityChange(option.value)}
                  className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value=""
                checked={!localFilters.status}
                onChange={() => handleAvailabilityChange('')}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-gray-700">All</span>
            </label>
          </div>
        </FilterSection>
      </div>

      {/* Apply Button for Mobile */}
      {isMobile && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Apply Filters ({getActiveFilterCount()})
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;