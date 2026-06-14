// src/components/layout/WhatsAppFloat.jsx
import { FiMessageCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const WhatsAppFloat = () => {
  const phoneNumbers = ['254791254076', '254797717981'];
  const defaultMessage = "Hello! I'm interested in your products on Femuki Agencies Marketplace.";

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(defaultMessage);
    window.open(`https://wa.me/${phoneNumbers[0]}?text=${message}`, '_blank');
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: 'spring' }}
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110"
    >
      <FiMessageCircle size={28} />
    </motion.button>
  );
};

export default WhatsAppFloat;