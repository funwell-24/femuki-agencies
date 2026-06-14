// src/components/home/Testimonials.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const sampleTestimonials = [
        {
          id: 1,
          name: 'John Mwangi',
          rating: 5,
          text: 'Bought a sofa from Femuki Agencies. Excellent condition and affordable price. Delivery was prompt!',
          product: 'Leather Sofa'
        },
        {
          id: 2,
          name: 'Sarah Kamau',
          rating: 5,
          text: 'The Samsung TV I bought works perfectly. Great customer service and response time on WhatsApp.',
          product: 'Samsung TV'
        },
        {
          id: 3,
          name: 'Peter Otieno',
          rating: 4,
          text: 'Good experience overall. The mattress was in great condition and delivery was on time.',
          product: 'Comfort Mattress'
        }
      ];
      setTestimonials(sampleTestimonials);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">What Our Customers Say</h2>
            <p className="text-gray-600">Real reviews from real customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">What Our Customers Say</h2>
          <p className="text-gray-600">Real reviews from real customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`text-sm ${
                      i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold text-gray-800">{testimonial.name}</p>
                <p className="text-sm text-gray-500">Purchased: {testimonial.product}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;