# backend/app/models/order.py
from datetime import datetime
import secrets
from ..extensions import db

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Amounts
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0)
    tax_amount = db.Column(db.Numeric(10, 2), default=0)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Status
    status = db.Column(db.Enum('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', name='order_statuses'), default='pending')
    payment_status = db.Column(db.Enum('pending', 'paid', 'failed', 'refunded', name='payment_statuses'), default='pending')
    payment_method = db.Column(db.Enum('mpesa', 'bank_transfer', 'cash_on_delivery', name='payment_methods'), nullable=False)
    
    # Payment details
    mpesa_transaction_id = db.Column(db.String(100))
    mpesa_checkout_request_id = db.Column(db.String(100))
    transaction_reference = db.Column(db.String(100))
    
    # Delivery information
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_phone = db.Column(db.String(20), nullable=False)
    delivery_notes = db.Column(db.Text)
    tracking_number = db.Column(db.String(100))
    
    # Courier info
    courier_name = db.Column(db.String(100))
    courier_tracking_url = db.Column(db.String(255))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    shipped_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(Order, self).__init__(**kwargs)
        if not self.order_number:
            self.order_number = self.generate_order_number()
    
    def generate_order_number(self):
        """Generate unique order number"""
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        random_part = secrets.token_hex(4).upper()
        return f'FEM-{timestamp}-{random_part}'
    
    def update_status(self, new_status):
        """Update order status with timestamps"""
        self.status = new_status
        
        if new_status == 'paid':
            self.paid_at = datetime.utcnow()
            self.payment_status = 'paid'
        elif new_status == 'shipped':
            self.shipped_at = datetime.utcnow()
        elif new_status == 'delivered':
            self.delivered_at = datetime.utcnow()
        elif new_status == 'cancelled':
            self.cancelled_at = datetime.utcnow()
        
        db.session.commit()
    
    def update_payment_status(self, status, transaction_id=None):
        """Update payment status"""
        self.payment_status = status
        if transaction_id:
            self.mpesa_transaction_id = transaction_id
        if status == 'paid':
            self.paid_at = datetime.utcnow()
        db.session.commit()
    
    def calculate_totals(self):
        """Calculate order totals from items"""
        items = self.items.all()
        self.subtotal = sum(item.price_at_time * item.quantity for item in items)
        self.total_amount = self.subtotal + self.shipping_cost + self.tax_amount - self.discount_amount
        db.session.commit()
    
    def get_items_count(self):
        """Get total number of items in order"""
        return sum(item.quantity for item in self.items)
    
    def to_dict(self, include_items=True):
        """Convert order to dictionary"""
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'subtotal': float(self.subtotal),
            'shipping_cost': float(self.shipping_cost),
            'tax_amount': float(self.tax_amount),
            'discount_amount': float(self.discount_amount),
            'total_amount': float(self.total_amount),
            'status': self.status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'delivery_address': self.delivery_address,
            'delivery_phone': self.delivery_phone,
            'delivery_notes': self.delivery_notes,
            'tracking_number': self.tracking_number,
            'courier_name': self.courier_name,
            'courier_tracking_url': self.courier_tracking_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'items_count': self.get_items_count()
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        
        return data
    
    def __repr__(self):
        return f'<Order {self.order_number}>'