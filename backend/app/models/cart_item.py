# backend/app/models/cart_item.py
from datetime import datetime
from ..extensions import db

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - Add this line
    product = db.relationship('Product', backref='cart_items', lazy='joined')
    
    def get_subtotal(self):
        """Calculate item subtotal"""
        if self.product:
            return self.product.price * self.quantity
        return 0
    
    def to_dict(self):
        """Convert cart item to dictionary"""
        product_data = self.product.to_dict(include_images=False) if self.product else None
        
        return {
            'id': self.id,
            'quantity': self.quantity,
            'subtotal': float(self.get_subtotal()),
            'product': product_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<CartItem {self.id} for Cart {self.cart_id}>'