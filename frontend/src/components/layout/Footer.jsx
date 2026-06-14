// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiFacebook, 
  FiTwitter, 
  FiInstagram,
  FiYoutube 
} from 'react-icons/fi';

const Footer = () => {
  const quickLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Sell Your Item', path: '/sell' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms & Conditions', path: '/terms' },
  ];

  const categories = [
    'Beds', 'Mattresses', 'Sofas', 'TVs', 
    'Fridges', 'Microwaves', 'Electronics', 'Office Furniture'
  ];

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Femuki Agencies" className="h-10 w-auto" />
              <h3 className="text-xl font-bold text-primary-500">Femuki Agencies</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Quality new & second-hand household items at affordable prices across Kenya.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FiInstagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                <FiYoutube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category}>
                  <Link 
                    to={`/products?category=${category.toLowerCase()}`}
                    className="text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <FiMapPin className="text-primary-500 mt-1" />
                <span className="text-gray-400">Nairobi, Kenya</span>
              </li>
              <li className="flex items-center space-x-3">
                <FiPhone className="text-primary-500" />
                <span className="text-gray-400">0797717981</span>
              </li>
              <li className="flex items-center space-x-3">
                <FiPhone className="text-primary-500" />
                <span className="text-gray-400">0791254076</span>
              </li>
              <li className="flex items-center space-x-3">
                <FiMail className="text-primary-500" />
                <span className="text-gray-400">info@femuki.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Femuki Agencies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;