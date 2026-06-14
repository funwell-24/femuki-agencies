// src/hooks/useWhatsApp.js
import { useCallback } from 'react';

// WhatsApp numbers for Femuki Agencies
const WHATSAPP_NUMBERS = {
  primary: import.meta.env.VITE_WHATSAPP_NUMBER_1 || '254791254076',
  secondary: import.meta.env.VITE_WHATSAPP_NUMBER_2 || '254797717981',
};

/**
 * Custom hook for WhatsApp integration
 * Provides methods to open WhatsApp chats with pre-filled messages
 */
const useWhatsApp = () => {
  /**
   * Format phone number for WhatsApp
   * Removes any non-numeric characters and ensures proper format
   */
  const formatPhoneNumber = (phone) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove leading 0 or +254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      cleaned = cleaned;
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  };

  /**
   * Open WhatsApp chat with pre-filled message
   */
  const openWhatsApp = useCallback((phoneNumber, message) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  }, []);

  /**
   * Send message to primary Femuki contact
   */
  const contactFemuki = useCallback((message = '') => {
    const defaultMessage = message || "Hello, I'm interested in your products on Femuki Agencies Marketplace.";
    openWhatsApp(WHATSAPP_NUMBERS.primary, defaultMessage);
  }, [openWhatsApp]);

  /**
   * Send message about a specific product
   */
  const inquireAboutProduct = useCallback((productName, productPrice, productId = null) => {
    const message = `Hello, I am interested in ${productName}${
      productPrice ? ` priced at KSH ${productPrice.toLocaleString()}` : ''
    } listed on your website.${productId ? `\nProduct ID: ${productId}` : ''}\n\nPlease provide more information.`;
    openWhatsApp(WHATSAPP_NUMBERS.primary, message);
  }, [openWhatsApp]);

  /**
   * Send message to sell an item
   */
  const sellItem = useCallback((itemName = '', itemDescription = '') => {
    let message = "Hello, I would like to sell an item to Femuki Agencies.";
    if (itemName) {
      message += `\n\nItem: ${itemName}`;
    }
    if (itemDescription) {
      message += `\nDescription: ${itemDescription}`;
    }
    openWhatsApp(WHATSAPP_NUMBERS.primary, message);
  }, [openWhatsApp]);

  /**
   * Send order inquiry
   */
  const orderInquiry = useCallback((orderNumber = '') => {
    let message = "Hello, I have a question about my order.";
    if (orderNumber) {
      message += `\nOrder Number: ${orderNumber}`;
    }
    openWhatsApp(WHATSAPP_NUMBERS.primary, message);
  }, [openWhatsApp]);

  /**
   * Send general inquiry
   */
  const generalInquiry = useCallback((question = '') => {
    let message = "Hello, I have a question about your services.";
    if (question) {
      message += `\n\n${question}`;
    }
    openWhatsApp(WHATSAPP_NUMBERS.primary, message);
  }, [openWhatsApp]);

  /**
   * Send message to secondary contact (backup)
   */
  const contactSecondary = useCallback((message = '') => {
    const defaultMessage = message || "Hello, I'm trying to reach Femuki Agencies.";
    openWhatsApp(WHATSAPP_NUMBERS.secondary, defaultMessage);
  }, [openWhatsApp]);

  /**
   * Generate WhatsApp link for sharing
   */
  const getWhatsAppLink = useCallback((phoneNumber, message) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }, []);

  return {
    // Methods
    openWhatsApp,
    contactFemuki,
    inquireAboutProduct,
    sellItem,
    orderInquiry,
    generalInquiry,
    contactSecondary,
    getWhatsAppLink,
    
    // Constants
    primaryNumber: WHATSAPP_NUMBERS.primary,
    secondaryNumber: WHATSAPP_NUMBERS.secondary,
    formatPhoneNumber,
  };
};

export default useWhatsApp;