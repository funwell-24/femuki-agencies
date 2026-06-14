# backend/app/models/testimonial.py
from datetime import datetime
from ..extensions import db

class Testimonial(db.Model):
    __tablename__ = 'testimonials'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='SET NULL'))
    
    # Review content
    rating = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100))
    review = db.Column(db.Text, nullable=False)
    
    # Admin moderation
    is_approved = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)
    admin_response = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    
    def approve(self, admin_response=None):
        """Approve testimonial"""
        self.is_approved = True
        self.approved_at = datetime.utcnow()
        if admin_response:
            self.admin_response = admin_response
        db.session.commit()
        
        # Update product rating
        if self.product_id:
            from .product import Product
            product = Product.query.get(self.product_id)
            if product:
                product.update_rating()
    
    def reject(self):
        """Reject testimonial"""
        db.session.delete(self)
        db.session.commit()
    
    def to_dict(self):
        """Convert testimonial to dictionary"""
        return {
            'id': self.id,
            'user_name': self.author.full_name if self.author else 'Anonymous',
            'user_avatar': self.author.avatar_url if self.author else None,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'rating': self.rating,
            'title': self.title,
            'review': self.review,
            'admin_response': self.admin_response,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None
        }
    
    def __repr__(self):
        return f'<Testimonial {self.id} - Rating: {self.rating}>'