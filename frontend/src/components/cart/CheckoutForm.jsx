// src/components/cart/CheckoutForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FiCreditCard, 
  FiSmartphone, 
  FiDollarSign, 
  FiTruck, 
  FiMapPin, 
  FiPhone, 
  FiUser,
  FiCheckCircle,
  FiHome
} from 'react-icons/fi';

const CheckoutForm = ({ cartItems, total, onSubmit }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mpesa');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    county: '',
    zipCode: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Thika', 'Machakos',
    'Eldoret', 'Kitale', 'Kakamega', 'Garissa', 'Meru', 'Nyeri', 'Embu'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9]{10,12}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.county) newErrors.county = 'County is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMpesaPayment = async () => {
    toast.loading('Initiating M-Pesa payment...', { id: 'mpesa' });
    
    setTimeout(() => {
      toast.dismiss('mpesa');
      toast.success('STK Push sent to your phone. Please enter PIN to complete payment.');
      
      setTimeout(() => {
        processOrder('mpesa');
      }, 3000);
    }, 1500);
  };

  const processOrder = async (paymentMethod) => {
    const orderData = {
      items: cartItems,
      total: total,
      paymentMethod: paymentMethod,
      deliveryDetails: formData,
      orderNumber: `FEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    
    await onSubmit(orderData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    if (selectedPaymentMethod === 'mpesa') {
      await handleMpesaPayment();
    } else if (selectedPaymentMethod === 'cash_on_delivery') {
      toast.success('Order placed! You will pay upon delivery');
      await processOrder('cash_on_delivery');
    } else if (selectedPaymentMethod === 'bank_transfer') {
      toast.loading('Processing bank transfer...', { id: 'bank' });
      setTimeout(async () => {
        toast.dismiss('bank');
        toast.success('Order placed! Please complete bank transfer');
        await processOrder('bank_transfer');
      }, 1500);
    }
    
    setIsSubmitting(false);
  };

  const paymentMethods = [
    {
      id: 'mpesa',
      name: 'M-Pesa',
      icon: FiSmartphone,
      description: 'Pay via M-Pesa STK Push'
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      icon: FiTruck,
      description: 'Pay when you receive the items'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: FiHome,  // Using FiHome instead (valid icon)
      description: 'Direct bank transfer to our account'
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Delivery Information */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiTruck className="mr-2 text-primary-500" />
          Delivery Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`pl-10 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Doe"
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="john@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`pl-10 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0712345678"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              County <span className="text-red-500">*</span>
            </label>
            <select
              name="county"
              value={formData.county}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.county ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select County</option>
              {counties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
            {errors.county && <p className="mt-1 text-xs text-red-500">{errors.county}</p>}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="2"
                className={`pl-10 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Street address, building, apartment"
              ></textarea>
            </div>
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City/Town <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nairobi"
            />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code (Optional)
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="00100"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Special delivery instructions, gate code, etc."
            ></textarea>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FiCreditCard className="mr-2 text-primary-500" />
          Payment Method
        </h3>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.id}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPaymentMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selectedPaymentMethod === method.id}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="mt-1 mr-3"
                />
                <Icon className={`mr-3 ${
                  selectedPaymentMethod === method.id ? 'text-primary-500' : 'text-gray-400'
                }`} size={24} />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{method.name}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-primary-600">
              {new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0
              }).format(total)}
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>Place Order</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CheckoutForm;