// src/components/common/Loader.jsx
import { motion } from 'framer-motion';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;