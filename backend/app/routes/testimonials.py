# backend/app/routes/testimonials.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import Testimonial, Product, User

testimonials_bp = Blueprint('testimonials', __name__)

def is_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.is_admin()

@testimonials_bp.route('/', methods=['GET'])
def get_testimonials():
    """Get approved testimonials"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 50)
    product_id = request.args.get('product_id', type=int)
    
    query = Testimonial.query.filter_by(is_approved=True)
    
    if product_id:
        query = query.filter_by(product_id=product_id)
    
    pagination = query.order_by(Testimonial.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'testimonials': [t.to_dict() for t in pagination.items],
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'total': pagination.total,
                'per_page': pagination.per_page
            }
        }
    }), 200

@testimonials_bp.route('/', methods=['POST'])
@jwt_required()
def add_testimonial():
    """Add a testimonial/review"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not data.get('product_id'):
        return jsonify({'success': False, 'message': 'Product ID required'}), 400
    
    if not data.get('rating') or data['rating'] < 1 or data['rating'] > 5:
        return jsonify({'success': False, 'message': 'Rating must be between 1 and 5'}), 400
    
    if not data.get('review'):
        return jsonify({'success': False, 'message': 'Review text required'}), 400
    
    # Check if user already reviewed this product
    existing = Testimonial.query.filter_by(
        user_id=user_id,
        product_id=data['product_id']
    ).first()
    
    if existing:
        return jsonify({'success': False, 'message': 'You have already reviewed this product'}), 400
    
    # Check if user purchased this product
    from ..models import Order, OrderItem
    has_purchased = db.session.query(OrderItem)\
        .join(Order)\
        .filter(
            Order.user_id == user_id,
            OrderItem.product_id == data['product_id'],
            Order.status == 'delivered'
        ).first() is not None
    
    testimonial = Testimonial(
        user_id=user_id,
        product_id=data['product_id'],
        rating=data['rating'],
        title=data.get('title'),
        review=data['review'],
        is_approved=has_purchased  # Auto-approve if purchased
    )
    
    db.session.add(testimonial)
    db.session.commit()
    
    # Update product rating
    product = Product.query.get(data['product_id'])
    if product:
        product.update_rating()
    
    return jsonify({
        'success': True,
        'message': 'Review submitted successfully',
        'data': testimonial.to_dict()
    }), 201

@testimonials_bp.route('/<int:testimonial_id>', methods=['PUT'])
@jwt_required()
def update_testimonial(testimonial_id):
    """Update own testimonial"""
    user_id = get_jwt_identity()
    
    testimonial = Testimonial.query.get(testimonial_id)
    
    if not testimonial:
        return jsonify({'success': False, 'message': 'Review not found'}), 404
    
    if testimonial.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if data.get('rating'):
        testimonial.rating = data['rating']
    if data.get('title'):
        testimonial.title = data['title']
    if data.get('review'):
        testimonial.review = data['review']
    
    # Reset approval status
    testimonial.is_approved = False
    testimonial.approved_at = None
    
    db.session.commit()
    
    # Update product rating
    if testimonial.product_id:
        product = Product.query.get(testimonial.product_id)
        if product:
            product.update_rating()
    
    return jsonify({
        'success': True,
        'message': 'Review updated',
        'data': testimonial.to_dict()
    }), 200

@testimonials_bp.route('/<int:testimonial_id>', methods=['DELETE'])
@jwt_required()
def delete_testimonial(testimonial_id):
    """Delete own testimonial"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    testimonial = Testimonial.query.get(testimonial_id)
    
    if not testimonial:
        return jsonify({'success': False, 'message': 'Review not found'}), 404
    
    if testimonial.user_id != user_id and not user.is_admin():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    product_id = testimonial.product_id
    
    db.session.delete(testimonial)
    db.session.commit()
    
    # Update product rating
    if product_id:
        product = Product.query.get(product_id)
        if product:
            product.update_rating()
    
    return jsonify({'success': True, 'message': 'Review deleted'}), 200

@testimonials_bp.route('/user/my-reviews', methods=['GET'])
@jwt_required()
def get_my_reviews():
    """Get current user's reviews"""
    user_id = get_jwt_identity()
    
    reviews = Testimonial.query.filter_by(user_id=user_id)\
        .order_by(Testimonial.created_at.desc())\
        .all()
    
    return jsonify({
        'success': True,
        'data': [review.to_dict() for review in reviews]
    }), 200

# Admin routes
@testimonials_bp.route('/admin/testimonials', methods=['GET'])
@jwt_required()
def admin_get_testimonials():
    """Get all testimonials (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    status = request.args.get('status')  # 'approved', 'pending'
    
    query = Testimonial.query
    
    if status == 'approved':
        query = query.filter_by(is_approved=True)
    elif status == 'pending':
        query = query.filter_by(is_approved=False)
    
    pagination = query.order_by(Testimonial.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'testimonials': [t.to_dict() for t in pagination.items],
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'total': pagination.total,
                'per_page': pagination.per_page
            }
        }
    }), 200

@testimonials_bp.route('/admin/testimonials/<int:testimonial_id>/approve', methods=['POST'])
@jwt_required()
def approve_testimonial(testimonial_id):
    """Approve testimonial (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    testimonial = Testimonial.query.get(testimonial_id)
    
    if not testimonial:
        return jsonify({'success': False, 'message': 'Review not found'}), 404
    
    data = request.get_json()
    testimonial.approve(admin_response=data.get('response'))
    
    return jsonify({
        'success': True,
        'message': 'Review approved',
        'data': testimonial.to_dict()
    }), 200

@testimonials_bp.route('/admin/testimonials/<int:testimonial_id>/reject', methods=['POST'])
@jwt_required()
def reject_testimonial(testimonial_id):
    """Reject testimonial (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    testimonial = Testimonial.query.get(testimonial_id)
    
    if not testimonial:
        return jsonify({'success': False, 'message': 'Review not found'}), 404
    
    testimonial.reject()
    
    return jsonify({'success': True, 'message': 'Review rejected'}), 200