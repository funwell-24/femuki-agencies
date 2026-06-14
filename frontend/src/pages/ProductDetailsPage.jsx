// src/pages/ProductDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHeart, 
  FiShoppingCart, 
  FiMessageCircle, 
  FiPhone, 
  FiShare2,
  FiCheckCircle,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiMinus,
  FiPlus
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthContext();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Fetch product from API
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${slug}`);
      if (response.data.success) {
        setProduct(response.data.data);
        // Check if product is in favorites
        if (isAuthenticated) {
          checkFavorite(response.data.data.id);
        }
        // Fetch related products
        fetchRelatedProducts(response.data.data.id, response.data.data.category_id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (productId, categoryId) => {
    try {
      const response = await api.get(`/products/${productId}/related`);
      if (response.data.success) {
        setRelatedProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const checkFavorite = async (productId) => {
    try {
      const response = await api.get(`/favorites/check/${productId}`);
      if (response.data.success) {
        setIsSaved(response.data.data.is_favorited);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save favorites');
      return;
    }
    
    try {
      if (isSaved) {
        await api.delete(`/favorites/${product.id}`);
        setIsSaved(false);
        toast.success('Removed from favorites');
      } else {
        await api.post(`/favorites/${product.id}`);
        setIsSaved(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug, isAuthenticated]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleWhatsApp = () => {
    const message = `Hello, I am interested in ${product.name} listed on Femuki Agencies website. Price: ${formatPrice(product.price)}. Quantity: ${quantity}`;
    window.open(`https://wa.me/254791254076?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:0797717981`;
  };

  const handleAddToCart = () => {
    // Add to cart logic
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  const handleShare = () => {
    navigator.share?.({
      title: product.name,
      text: `Check out this ${product.name} at Femuki Agencies`,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products" className="btn-primary inline-block">Browse Products</Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ['/placeholder.jpg'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary-500">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-500">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category?.slug}`} className="hover:text-primary-500">{product.category?.name || 'Products'}</Link>
          <span>/</span>
          <span className="text-gray-800">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <img
                src={images[selectedImage]?.image_url || images[selectedImage] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-96 object-contain p-4"
              />
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === idx ? 'border-primary-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img.image_url || img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Status */}
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
                <button
                  onClick={toggleFavorite}
                  className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <FiHeart className={`text-xl ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  product.product_condition === 'new' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {product.product_condition === 'new' ? 'New' : 'Second-Hand'}
                </span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  product.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.status === 'available' ? 'In Stock' : 'Sold Out'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <p className="text-3xl font-bold text-primary-600">{formatPrice(product.price)}</p>
              {product.quantity > 0 && (
                <p className="text-sm text-green-600 mt-1">In stock: {product.quantity} items</p>
              )}
            </div>

            {/* Quantity Selector */}
            {product.status === 'available' && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    <FiMinus size={16} />
                  </button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.status !== 'available'}
                className="flex items-center justify-center space-x-2 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                <FiShoppingCart size={18} />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                <FiMessageCircle size={18} />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCall}
                className="flex items-center justify-center space-x-2 border border-primary-500 text-primary-500 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                <FiPhone size={16} />
                <span>Call Seller</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <FiShare2 size={16} />
                <span>Share</span>
              </button>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Seller Information</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Femuki Agencies</p>
                <p className="text-gray-500">Response time: Within 1 hour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b">
              <div className="flex">
                <button className="px-6 py-3 text-primary-500 border-b-2 border-primary-500 font-medium">
                  Description
                </button>
                <button className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium">
                  Features
                </button>
                <button className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium">
                  Shipping
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
              
              {product.dimensions && (
                <div className="mt-4">
                  <p className="font-medium text-gray-800">Dimensions:</p>
                  <p className="text-gray-600">{product.dimensions}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <Link key={related.id} to={`/product/${related.slug}`} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <img src={related.images?.[0]?.image_url || '/placeholder.jpg'} alt={related.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{related.name}</h3>
                    <p className="text-primary-600 font-bold mt-1">{formatPrice(related.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <FiTruck className="text-primary-500 text-2xl" />
            <div>
              <p className="font-semibold">Free Delivery</p>
              <p className="text-sm text-gray-500">On orders over KSH 50,000</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <FiShield className="text-primary-500 text-2xl" />
            <div>
              <p className="font-semibold">Secure Payment</p>
              <p className="text-sm text-gray-500">100% secure transactions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
            <FiRefreshCw className="text-primary-500 text-2xl" />
            <div>
              <p className="font-semibold">Easy Returns</p>
              <p className="text-sm text-gray-500">7-day return policy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;