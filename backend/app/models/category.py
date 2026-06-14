# backend/app/models/category.py
from datetime import datetime
from ..extensions import db

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    slug = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    icon = db.Column(db.String(50))
    
    # SEO fields
    meta_title = db.Column(db.String(100))
    meta_description = db.Column(db.String(200))
    
    # Counts
    product_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy='dynamic', cascade='all, delete-orphan')
    
    def update_product_count(self):
        """Update product count for category"""
        self.product_count = self.products.filter_by(status='available').count()
        db.session.commit()
    
    def to_dict(self):
        """Convert category to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'image_url': self.image_url,
            'icon': self.icon,
            'product_count': self.product_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Category {self.name}>'