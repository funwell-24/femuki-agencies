// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiEdit2, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../services/auth';
import api from '../services/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    county: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch user profile from backend API
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          const userData = response.data.data;
          setProfile({
            full_name: userData.full_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            county: userData.county || ''
          });
          
          // Update localStorage with latest data
          const currentUser = getCurrentUser();
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!profile.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!profile.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profile.email)) newErrors.email = 'Email is invalid';
    if (!profile.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const response = await api.put('/auth/profile', {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        county: profile.county
      });
      
      if (response.data.success) {
        // Update localStorage with updated data
        const currentUser = getCurrentUser();
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    
    setIsSaving(false);
  };

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Thika', 'Machakos',
    'Eldoret', 'Kitale', 'Kakamega', 'Garissa', 'Meru', 'Nyeri', 'Embu'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-500">
                    {profile.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div>
                  <h1 className="text-white text-xl font-semibold">{profile.full_name || 'Your Name'}</h1>
                  <p className="text-primary-100 text-sm">Member since 2024</p>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <FiEdit2 size={16} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`pl-10 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300'
                    } ${!isEditing && 'bg-gray-50'}`}
                  />
                </div>
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled={true}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`pl-10 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } ${!isEditing && 'bg-gray-50'}`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County
                </label>
                <select
                  name="county"
                  value={profile.county}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    !isEditing && 'bg-gray-50'
                  }`}
                >
                  <option value="">Select County</option>
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="2"
                    className={`pl-10 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      !isEditing && 'bg-gray-50'
                    }`}
                    placeholder="Your street address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City/Town
                </label>
                <input
                  type="text"
                  name="city"
                  value={profile.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    !isEditing && 'bg-gray-50'
                  }`}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;