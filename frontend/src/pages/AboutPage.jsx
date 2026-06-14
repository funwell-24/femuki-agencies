// src/pages/AboutPage.jsx
import { motion } from 'framer-motion';
import { FiAward, FiUsers, FiTruck, FiHeart, FiTarget, FiEye } from 'react-icons/fi';

const AboutPage = () => {
  const stats = [
    { value: '5+', label: 'Years of Experience', icon: FiAward },
    { value: '1000+', label: 'Happy Customers', icon: FiUsers },
    { value: '5000+', label: 'Items Sold', icon: FiTruck },
    { value: '100%', label: 'Customer Satisfaction', icon: FiHeart },
  ];

  const values = [
    {
      title: 'Quality Assurance',
      description: 'We carefully inspect every item to ensure it meets our quality standards before listing.',
      icon: FiTarget
    },
    {
      title: 'Affordable Prices',
      description: 'We offer competitive prices on both new and second-hand household items.',
      icon: FiHeart
    },
    {
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We provide fast support and easy returns.',
      icon: FiUsers
    },
    {
      title: 'Trust & Transparency',
      description: 'We believe in honest business practices and transparent communication.',
      icon: FiEye
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20">
        <div className="container-custom text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            About Femuki Agencies
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 max-w-2xl mx-auto"
          >
            Your trusted partner for quality new and second-hand household items across Kenya
          </motion.p>
        </div>
      </div>

      {/* Company Overview */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Femuki Agencies started as a small second-hand shop in Nairobi, Kenya, with a mission to provide quality household items at affordable prices. Over the years, we've grown into a trusted marketplace serving customers across the country.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              What sets us apart is our commitment to quality and customer satisfaction. Every item we sell undergoes thorough inspection to ensure it meets our standards. We've helped thousands of Kenyans furnish their homes affordably without compromising on quality.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, Femuki Agencies is more than just a shop – we're a complete marketplace where customers can buy, sell, and trade household items with confidence.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gray-100 rounded-xl h-96 flex items-center justify-center"
          >
            <img src="/about-image.jpg" alt="Femuki Agencies" className="rounded-xl object-cover w-full h-full" />
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-2xl text-primary-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl shadow-sm p-8 text-center"
          >
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTarget className="text-3xl text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Our Mission</h3>
            <p className="text-gray-600">
              To provide quality household items at affordable prices while ensuring customer satisfaction through reliable service and transparent business practices.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-8 text-center"
          >
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiEye className="text-3xl text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Our Vision</h3>
            <p className="text-gray-600">
              To become Kenya's leading online marketplace for household items, connecting buyers and sellers in a trusted, efficient, and user-friendly platform.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-gray-50 py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-xl text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to shop with us?</h2>
        <p className="text-gray-600 mb-6">Browse our products or contact us for assistance</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <a href="/products" className="btn-primary inline-block">View Products</a>
          <a href="/contact" className="btn-outline inline-block">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;