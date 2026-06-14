# backend/app/routes/__init__.py
from .auth import auth_bp
from .users import users_bp
from .products import products_bp
from .categories import categories_bp
from .orders import orders_bp
from .cart import cart_bp
from .submissions import submissions_bp
from .testimonials import testimonials_bp
from .favorites import favorites_bp
from .dashboard import dashboard_bp
from .payments import payments_bp
from .admin import admin_bp

__all__ = [
    'auth_bp',
    'users_bp',
    'products_bp',
    'categories_bp',
    'orders_bp',
    'cart_bp',
    'submissions_bp',
    'testimonials_bp',
    'favorites_bp',
    'dashboard_bp',
    'payments_bp',
    'admin_bp'
]