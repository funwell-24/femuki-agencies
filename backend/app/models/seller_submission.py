# backend/app/models/seller_submission.py
from datetime import datetime
from ..extensions import db

class SellerSubmission(db.Model):
    __tablename__ = 'seller_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Product information
    product_name = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL'))
    condition = db.Column(db.Enum('new', 'second-hand', name='submission_conditions'), default='second-hand')
    description = db.Column(db.Text)
    asking_price = db.Column(db.Numeric(10, 2))
    
    # Location
    location = db.Column(db.String(100))
    
    # Seller information
    seller_name = db.Column(db.String(100), nullable=False)
    seller_phone = db.Column(db.String(20), nullable=False)
    seller_email = db.Column(db.String(100))
    
    # Status and review
    status = db.Column(db.Enum('pending', 'reviewing', 'approved', 'rejected', 'purchased', name='submission_statuses'), default='pending')
    admin_notes = db.Column(db.Text)
    negotiated_price = db.Column(db.Numeric(10, 2))
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    purchased_at = db.Column(db.DateTime)
    
    # Relationships
    images = db.relationship('SubmissionImage', backref='submission', lazy='dynamic', cascade='all, delete-orphan')
    category = db.relationship('Category', backref='submissions')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by], backref='reviewed_submissions')
    
    def approve(self, admin_id, notes=None, negotiated_price=None):
        """Approve submission"""
        self.status = 'approved'
        self.reviewed_by = admin_id
        self.reviewed_at = datetime.utcnow()
        if notes:
            self.admin_notes = notes
        if negotiated_price:
            self.negotiated_price = negotiated_price
        db.session.commit()
    
    def reject(self, admin_id, reason):
        """Reject submission"""
        self.status = 'rejected'
        self.reviewed_by = admin_id
        self.reviewed_at = datetime.utcnow()
        self.admin_notes = reason
        db.session.commit()
    
    def mark_purchased(self):
        """Mark submission as purchased"""
        self.status = 'purchased'
        self.purchased_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert submission to dictionary"""
        return {
            'id': self.id,
            'product_name': self.product_name,
            'category': self.category.to_dict() if self.category else None,
            'condition': self.condition,
            'description': self.description,
            'asking_price': float(self.asking_price) if self.asking_price else None,
            'negotiated_price': float(self.negotiated_price) if self.negotiated_price else None,
            'location': self.location,
            'seller_name': self.seller_name,
            'seller_phone': self.seller_phone,
            'seller_email': self.seller_email,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'images': [img.to_dict() for img in self.images],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }
    
    def __repr__(self):
        return f'<SellerSubmission {self.id}: {self.product_name}>'


class SubmissionImage(db.Model):
    __tablename__ = 'submission_images'
    
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('seller_submissions.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    public_id = db.Column(db.String(255))
    display_order = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert submission image to dictionary"""
        return {
            'id': self.id,
            'image_url': self.image_url,
            'display_order': self.display_order
        }
    
    def __repr__(self):
        return f'<SubmissionImage {self.id}>'