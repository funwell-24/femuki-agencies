// src/pages/ContactPage.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiClock, 
  FiMessageCircle,
  FiSend,
  FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success('Message sent successfully!');
      setFormData({ fullName: '', email: '', phone: '', message: '' });
      
      // Reset submitted status after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: FiPhone,
      title: 'Phone',
      details: ['0797717981', '0791254076'],
      action: 'Call Us',
      onClick: () => window.location.href = 'tel:0797717981'
    },
    {
      icon: FiMessageCircle,
      title: 'WhatsApp',
      details: ['0791254076'],
      action: 'Chat on WhatsApp',
      onClick: () => window.open('https://wa.me/254791254076', '_blank')
    },
    {
      icon: FiMail,
      title: 'Email',
      details: ['info@femuki.com', 'sales@femuki.com'],
      action: 'Send Email',
      onClick: () => window.location.href = 'mailto:info@femuki.com'
    },
    {
      icon: FiMapPin,
      title: 'Location',
      details: ['Nairobi, Kenya'],
      action: 'Get Directions',
      onClick: () => window.open('https://maps.google.com', '_blank')
    }
  ];

  const businessHours = [
    { day: 'Monday - Friday', hours: '8:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '9:00 AM - 4:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-600">We'd love to hear from you. Get in touch with us</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-4">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={info.onClick}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="text-xl text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-gray-600 text-sm">{detail}</p>
                      ))}
                      <p className="text-primary-500 text-sm mt-2 font-medium">{info.action}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Business Hours */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiClock className="text-primary-500" />
                </div>
                <h3 className="font-semibold text-gray-800">Business Hours</h3>
              </div>
              <div className="space-y-2">
                {businessHours.map((item) => (
                  <div key={item.day} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.day}</span>
                    <span className="font-medium text-gray-800">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="text-3xl text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Message Sent!</h3>
                  <p className="text-gray-600">Thank you for contacting us. We'll get back to you soon.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Send us a message</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0712345678"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        rows="5"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="How can we help you?"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <FiSend size={18} />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">Google Map Integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;