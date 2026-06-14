from datetime import datetime
from ..extensions import db

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    product_condition = db.Column(db.Enum('new', 'second-hand', name='product_conditions'), default='second-hand')
    status = db.Column(db.Enum('available', 'sold', 'pending', name='product_statuses'), default='available')
    
    # Inventory
    quantity = db.Column(db.Integer, default=1)
    sold_count = db.Column(db.Integer, default=0)
    
    # Physical details
    dimensions = db.Column(db.String(100))
    weight = db.Column(db.Float)
    
    # Brand info
    brand = db.Column(db.String(100))
    model = db.Column(db.String(100))
    year = db.Column(db.Integer)
    
    # Flags
    featured = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Stats
    views = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=0)
    review_count = db.Column(db.Integer, default=0)
    
    # Foreign keys
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sold_at = db.Column(db.DateTime)
    
    # Relationships
    images = db.relationship('ProductImage', backref='product', lazy='dynamic', cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='product', lazy='dynamic', cascade='all, delete-orphan')
    testimonials = db.relationship('Testimonial', backref='product', lazy='dynamic')
    order_items = db.relationship('OrderItem', backref='product', lazy='dynamic')
    
    def increment_views(self):
        """Increment product view count"""
        self.views += 1
        db.session.commit()
    
    def decrement_quantity(self, quantity=1):
        """Decrease product quantity when sold"""
        if self.quantity >= quantity:
            self.quantity -= quantity
            self.sold_count += quantity
            if self.quantity == 0:
                self.status = 'sold'
                self.sold_at = datetime.utcnow()
            db.session.commit()
            return True
        return False
    
    def update_rating(self):
        """Update average rating from testimonials"""
        from .testimonial import Testimonial
        from sqlalchemy import func
        result = db.session.query(
            func.avg(Testimonial.rating),
            func.count(Testimonial.id)
        ).filter(Testimonial.product_id == self.id, Testimonial.is_approved == True).first()
        
        if result and result[1] > 0:
            self.rating = float(result[0]) if result[0] else 0
            self.review_count = result[1]
        else:
            self.rating = 0
            self.review_count = 0
        db.session.commit()
    
    def get_primary_image(self):
        """Get primary product image"""
        primary = self.images.filter_by(is_primary=True).first()
        if primary:
            return primary.image_url
        first = self.images.first()
        return first.image_url if first else None
    
    def to_dict(self, include_images=True):
        """Convert product to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'price': float(self.price),
            'product_condition': self.product_condition,
            'status': self.status,
            'quantity': self.quantity,
            'sold_count': self.sold_count,
            'dimensions': self.dimensions,
            'weight': self.weight,
            'brand': self.brand,
            'model': self.model,
            'year': self.year,
            'featured': self.featured,
            'is_active': self.is_active,
            'views': self.views,
            'rating': float(self.rating) if self.rating else 0,
            'review_count': self.review_count,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_images:
            # Return array of image URL strings instead of objects
            data['images'] = [img.image_url for img in self.images]
        else:
            data['primary_image'] = self.get_primary_image()
        
        return data
    
    def __repr__(self):
        return f'<Product {self.name}>'