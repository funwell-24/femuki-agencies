# backend/app/models/__init__.py
from .user import User
from .category import Category
from .product import Product
from .product_image import ProductImage
from .order import Order
from .order_item import OrderItem
from .cart import Cart
from .cart_item import CartItem
from .seller_submission import SellerSubmission, SubmissionImage
from .testimonial import Testimonial
from .favorite import Favorite

# Import all models so they register with SQLAlchemy
__all__ = [
    'User',
    'Category',
    'Product',
    'ProductImage',
    'Order',
    'OrderItem',
    'Cart',
    'CartItem',
    'SellerSubmission',
    'SubmissionImage',
    'Testimonial',
    'Favorite'
]