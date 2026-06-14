// src/components/home/WhyChooseUs.jsx
import { motion } from 'framer-motion';
import { FiDollarSign, FiShield, FiTruck, FiHeadphones } from 'react-icons/fi';

const WhyChooseUs = () => {
  const features = [
    {
      icon: FiDollarSign,
      title: 'Affordable Prices',
      description: 'Best prices on quality new and second-hand household items'
    },
    {
      icon: FiShield,
      title: 'Trusted Quality',
      description: 'Every item inspected for quality before listing'
    },
    {
      icon: FiTruck,
      title: 'Nationwide Delivery',
      description: 'Fast and reliable delivery across Kenya'
    },
    {
      icon: FiHeadphones,
      title: '24/7 Customer Support',
      description: 'We\'re here to help anytime via WhatsApp or phone'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Why Choose Us</h2>
          <p className="text-gray-600">Experience the Femuki difference</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-2xl text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;