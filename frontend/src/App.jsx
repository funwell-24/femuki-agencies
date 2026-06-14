// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import WhatsAppFloat from './components/layout/WhatsAppFloat';
import MobileMenu from './components/layout/MobileMenu';

// Global styles
import './styles/globals.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-gray-50">
              {/* Toast Notifications */}
              <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '12px 16px',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              {/* Navigation */}
              <Navbar />
              
              {/* Mobile Menu */}
              <MobileMenu />
              
              {/* Main Content */}
              <main className="flex-grow">
                <AnimatePresence mode="wait">
                  <AppRoutes />
                </AnimatePresence>
              </main>
              
              {/* Footer */}
              <Footer />
              
              {/* WhatsApp Floating Button */}
              <WhatsAppFloat />
            </div>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;