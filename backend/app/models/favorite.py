# backend/app/models/favorite.py
from datetime import datetime
from ..extensions import db

class Favorite(db.Model):
    __tablename__ = 'favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a user can only favorite a product once
    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='unique_user_product_favorite'),)
    
    def to_dict(self):
        """Convert favorite to dictionary"""
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Favorite User {self.user_id} Product {self.product_id}>'