// src/components/home/HeroSection.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiMessageCircle, FiPhone, FiUpload } from 'react-icons/fi';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="container-custom py-16 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Quality New & Second-Hand
              <span className="block text-yellow-300">Household Items</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Shop affordable, quality furniture and electronics. Free delivery on orders over KSH 50,000.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/products" className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                <FiShoppingBag size={20} />
                View Products
              </Link>
              <a href="https://wa.me/254791254076" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <FiMessageCircle size={20} />
                WhatsApp Now
              </a>
              <Link to="/sell" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
                <FiUpload size={20} />
                Sell Your Item
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🛋️</span>
                  <p className="font-semibold">Sofas</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">📺</span>
                  <p className="font-semibold">TVs</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🛏️</span>
                  <p className="font-semibold">Beds</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🧊</span>
                  <p className="font-semibold">Fridges</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;