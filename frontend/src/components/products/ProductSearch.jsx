// src/components/products/ProductSearch.jsx
import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const ProductSearch = ({ onSearch, initialValue = '', placeholder = "Search products...", suggestions = [] }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = (term = searchTerm) => {
    if (term.trim()) {
      saveRecentSearch(term);
      onSearch(term);
      setShowSuggestions(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    
    // If empty, trigger search with empty
    if (!value.trim()) {
      onSearch('');
    }
  };

  // Handle key press (Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setShowSuggestions(false);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const popularSearches = ['Samsung TV', 'Sofa', 'Fridge', 'Mattress', 'Bed', 'Microwave'];

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {searchTerm && filteredSuggestions.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-gray-500 px-3 py-2">Suggestions</p>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(suggestion);
                      handleSearch(suggestion);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
                  >
                    <FiSearch size={14} className="text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!searchTerm && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-xs text-gray-500">Recent Searches</p>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('recentSearches');
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchTerm(search);
                      handleSearch(search);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
                  >
                    <FiSearch size={14} className="text-gray-400" />
                    <span>{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!searchTerm && recentSearches.length === 0 && (
              <div className="p-2">
                <p className="text-xs text-gray-500 px-3 py-2">Popular Searches</p>
                <div className="flex flex-wrap gap-2 px-3 pb-3">
                  {popularSearches.map((popular, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(popular);
                        handleSearch(popular);
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-100 hover:text-primary-600 transition-colors"
                    >
                      {popular}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchTerm && filteredSuggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p>No suggestions found</p>
                <button
                  onClick={() => handleSearch()}
                  className="mt-2 text-primary-500 hover:text-primary-600"
                >
                  Search for "{searchTerm}"
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductSearch;