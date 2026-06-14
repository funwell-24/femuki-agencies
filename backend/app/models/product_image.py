# backend/app/models/product_image.py
from datetime import datetime
from ..extensions import db

class ProductImage(db.Model):
    __tablename__ = 'product_images'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    public_id = db.Column(db.String(255))
    
    # Image metadata
    alt_text = db.Column(db.String(200))
    is_primary = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    file_size = db.Column(db.Integer)
    mime_type = db.Column(db.String(50))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert product image to dictionary"""
        return {
            'id': self.id,
            'image_url': self.image_url,
            'alt_text': self.alt_text,
            'is_primary': self.is_primary,
            'display_order': self.display_order
        }
    
    def __repr__(self):
        return f'<ProductImage {self.id} for Product {self.product_id}>'