# backend/app/models/cart.py
from datetime import datetime
from ..extensions import db

class Cart(db.Model):
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('CartItem', backref='cart', lazy='dynamic', cascade='all, delete-orphan')
    
    def get_items_count(self):
        """Get total number of items in cart"""
        return sum(item.quantity for item in self.items)
    
    def get_subtotal(self):
        """Calculate cart subtotal"""
        total = 0
        for item in self.items:
            if item.product:
                total += item.product.price * item.quantity
        return total
    
    def get_shipping_cost(self):
        """Calculate shipping cost - free over 50000, else 1000"""
        subtotal = self.get_subtotal()
        return 0 if subtotal > 50000 else 1000
    
    def get_tax_amount(self):
        """Calculate tax (0% for now)"""
        return 0
    
    def get_total(self):
        """Calculate cart total"""
        return self.get_subtotal() + self.get_shipping_cost() + self.get_tax_amount()
    
    def clear(self):
        """Clear all items from cart"""
        self.items.delete()
        db.session.commit()
    
    def to_dict(self):
        """Convert cart to dictionary"""
        return {
            'id': self.id,
            'items_count': self.get_items_count(),
            'subtotal': float(self.get_subtotal()),
            'shipping_cost': float(self.get_shipping_cost()),
            'tax_amount': float(self.get_tax_amount()),
            'total': float(self.get_total()),
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Cart {self.id} for User {self.user_id}>'