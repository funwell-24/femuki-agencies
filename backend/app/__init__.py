# backend/app/__init__.py
from flask import Flask, request, make_response, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from celery import Celery
import os
from datetime import datetime

from .config import config
from .extensions import db, jwt, mail, migrate, limiter, cache, socketio

# Initialize Celery
celery = Celery(__name__)

def create_app(config_name=None):
    """Application factory function"""
    # Debug: Print environment variable
    print(f"🔐 [BACKEND] CORS_ORIGINS env var: {os.environ.get('CORS_ORIGINS')}")
    
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Create uploads directory if it doesn't exist
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    products_upload_dir = os.path.join(uploads_dir, 'products')
    os.makedirs(products_upload_dir, exist_ok=True)
    
    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(uploads_dir, filename)
    
    # Configure CORS - Read directly from environment variable
    cors_origins_str = os.environ.get('CORS_ORIGINS', 'http://localhost:5173')
    cors_origins = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]
    print(f"🔐 [BACKEND] CORS origins from env: {cors_origins}")
    
    CORS(app, 
         origins=cors_origins,
         allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         supports_credentials=True,
         expose_headers=["Content-Type", "Authorization"])
    
    # Ensure CORS headers are set on all responses
    @app.after_request
    def add_cors_headers(response):
        response.headers.add('Access-Control-Allow-Origin', 'https://femuki.netlify.app')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
        return response
    
    # Initialize extensions
    initialize_extensions(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register CLI commands
    register_commands(app)
    
    return app

def initialize_extensions(app):
    """Initialize all Flask extensions"""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    cache.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

def register_blueprints(app):
    """Register all route blueprints"""
    from .routes import (
        auth_bp, users_bp, products_bp, categories_bp,
        orders_bp, cart_bp, submissions_bp, testimonials_bp,
        favorites_bp, dashboard_bp, payments_bp, admin_bp
    )
    
    # API version prefix
    api_prefix = '/api'
    
    app.register_blueprint(auth_bp, url_prefix=f'{api_prefix}/auth')
    app.register_blueprint(users_bp, url_prefix=f'{api_prefix}/users')
    app.register_blueprint(products_bp, url_prefix=f'{api_prefix}/products')
    app.register_blueprint(categories_bp, url_prefix=f'{api_prefix}/categories')
    app.register_blueprint(orders_bp, url_prefix=f'{api_prefix}/orders')
    app.register_blueprint(cart_bp, url_prefix=f'{api_prefix}/cart')
    app.register_blueprint(submissions_bp, url_prefix=f'{api_prefix}/submissions')
    app.register_blueprint(testimonials_bp, url_prefix=f'{api_prefix}/testimonials')
    app.register_blueprint(favorites_bp, url_prefix=f'{api_prefix}/favorites')
    app.register_blueprint(dashboard_bp, url_prefix=f'{api_prefix}/dashboard')
    app.register_blueprint(payments_bp, url_prefix=f'{api_prefix}/payments')
    app.register_blueprint(admin_bp, url_prefix=f'{api_prefix}/admin')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Femuki Agencies API is running'}, 200

def register_error_handlers(app):
    """Register custom error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return {'success': False, 'message': 'Bad request'}, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return {'success': False, 'message': 'Unauthorized access'}, 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return {'success': False, 'message': 'Forbidden access'}, 403
    
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f'Server Error: {error}')
        return {'success': False, 'message': 'Internal server error'}, 500

def register_commands(app):
    """Register custom CLI commands"""
    
    @app.cli.command('init-db')
    def init_db():
        """Initialize the database with tables"""
        from .models import (
            User, Category, Product, ProductImage, Order, OrderItem,
            Cart, CartItem, SellerSubmission, SubmissionImage, Testimonial, Favorite
        )
        db.create_all()
        print('✅ Database tables created successfully!')
    
    @app.cli.command('create-admin')
    def create_admin():
        """Create admin user"""
        from .models import User
        from werkzeug.security import generate_password_hash
        
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(
                full_name='Admin User',
                email='admin@femuki.com',
                phone='0797717981',
                password_hash=generate_password_hash('Admin@123'),
                role='admin',
                is_active=True,
                email_verified=True
            )
            db.session.add(admin)
            db.session.commit()
            print('✅ Admin user created!')
            print('Email: admin@femuki.com')
            print('Password: Admin@123')
        else:
            print('⚠️ Admin user already exists')
