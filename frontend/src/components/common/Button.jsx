// src/components/common/Button.jsx
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-gray-800 text-white hover:bg-gray-900',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-semibold transition-all duration-300
        ${disabled && 'opacity-50 cursor-not-allowed'}
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;