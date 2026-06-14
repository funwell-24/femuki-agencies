// src/routes.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FavoritesPage from './pages/FavoritesPage';
// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const SellPage = lazy(() => import('./pages/SellPage'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Page transition wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// 404 Page Component
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center">
      <div className="text-9xl font-bold text-primary-500 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/" className="btn-primary inline-block">Go Home</a>
        <a href="/products" className="btn-outline inline-block">Browse Products</a>
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/products" element={<PageTransition><ProductsPage /></PageTransition>} />
        <Route path="/product/:slug" element={<PageTransition><ProductDetailsPage /></PageTransition>} />
        <Route path="/categories" element={<PageTransition><CategoriesPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/sell" element={<PageTransition><SellPage /></PageTransition>} />
        <Route path="/favorites" element={<PageTransition><FavoritesPage /></PageTransition>} />
        {/* Auth Routes */}
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
        <Route path="/reset-password/:token" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
        
        {/* Profile Route */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition><ProfilePage /></PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Protected Customer Routes */}
        <Route path="/checkout" element={<ProtectedRoute><PageTransition><CheckoutPage /></PageTransition></ProtectedRoute>} />
        <Route path="/order-tracking" element={<ProtectedRoute><PageTransition><OrderTrackingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/order-tracking/:orderNumber" element={<ProtectedRoute><PageTransition><OrderTrackingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><CustomerDashboard /></PageTransition></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute requireAdmin={true}><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
        
        {/* 404 - Keep this last */}
        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>
    </Suspense>
  );
};

// Make sure this default export exists
export default AppRoutes;