# backend/app/models/order_item.py
from datetime import datetime
from ..extensions import db

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='SET NULL'))
    
    # Snapshot of product details at time of purchase
    product_name = db.Column(db.String(200), nullable=False)
    product_price = db.Column(db.Numeric(10, 2), nullable=False)
    product_image = db.Column(db.String(255))
    
    # Item details
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price_at_time = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super(OrderItem, self).__init__(**kwargs)
        self.subtotal = self.price_at_time * self.quantity
    
    def to_dict(self):
        """Convert order item to dictionary"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_price': float(self.product_price),
            'product_image': self.product_image,
            'quantity': self.quantity,
            'price_at_time': float(self.price_at_time),
            'subtotal': float(self.subtotal)
        }
    
    def __repr__(self):
        return f'<OrderItem {self.id} for Order {self.order_id}>'