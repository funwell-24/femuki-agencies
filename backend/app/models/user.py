# backend/app/models/user.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from ..extensions import db

bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Role and status
    role = db.Column(db.Enum('customer', 'admin', name='user_roles'), default='customer')
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    is_blocked = db.Column(db.Boolean, default=False)
    
    # Address information
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    county = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    
    # Avatar
    avatar_url = db.Column(db.String(255))
    
    # Verification tokens
    verification_token = db.Column(db.String(255), unique=True)
    reset_token = db.Column(db.String(255), unique=True)
    reset_token_expiry = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships - Import models inside to avoid circular imports
    @property
    def products(self):
        from .product import Product
        return db.session.query(Product).filter(Product.created_by == self.id)
    
    @property
    def orders(self):
        from .order import Order
        return db.session.query(Order).filter(Order.user_id == self.id)
    
    @property
    def cart(self):
        from .cart import Cart
        cart = db.session.query(Cart).filter(Cart.user_id == self.id).first()
        if not cart:
            cart = Cart(user_id=self.id)
            db.session.add(cart)
            db.session.commit()
        return cart
    
    @property
    def favorites(self):
        from .favorite import Favorite
        return db.session.query(Favorite).filter(Favorite.user_id == self.id)
    
    @property
    def testimonials(self):
        from .testimonial import Testimonial
        return db.session.query(Testimonial).filter(Testimonial.user_id == self.id)
    
    @property
    def submissions(self):
        from .seller_submission import SellerSubmission
        return db.session.query(SellerSubmission).filter(SellerSubmission.user_id == self.id)
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
    
    @property
    def password(self):
        raise AttributeError('Password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        """Set password hash"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def verify_password(self, password):
        """Verify password"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def generate_verification_token(self):
        """Generate email verification token"""
        import secrets
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token
    
    def generate_reset_token(self):
        """Generate password reset token"""
        import secrets
        from datetime import timedelta
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expiry = datetime.utcnow() + timedelta(hours=24)
        return self.reset_token
    
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin'
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
        'id': self.id,
        'full_name': self.full_name,
        'email': self.email,
        'phone': self.phone,
        'role': self.role,
        'is_active': self.is_active,
        'email_verified': self.email_verified,
        'address': self.address,
        'city': self.city,
        'county': self.county,
        'avatar_url': self.avatar_url,
        'created_at': self.created_at.isoformat() if self.created_at else None,
        'last_login': self.last_login.isoformat() if self.last_login else None
    }
    
    def __repr__(self):
        return f'<User {self.email}>'