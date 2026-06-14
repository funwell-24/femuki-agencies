# backend/app/routes/submissions.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..extensions import db
from ..models import SellerSubmission, SubmissionImage, User, Category
from ..services.cloudinary_service import upload_image, delete_image
from ..services.email_service import send_submission_status_email
from ..services.sms_service import send_sms

submissions_bp = Blueprint('submissions', __name__)

def is_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.is_admin()

@submissions_bp.route('/', methods=['POST'])
@jwt_required()
def create_submission():
    """Create a seller submission"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    data = request.form
    files = request.files.getlist('images')
    
    # Validate required fields
    required_fields = ['product_name', 'category_id', 'description', 'seller_name', 'seller_phone']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # Validate images
    if len(files) == 0:
        return jsonify({'success': False, 'message': 'At least one product image is required'}), 400
    
    if len(files) > 10:
        return jsonify({'success': False, 'message': 'Maximum 10 images allowed'}), 400
    
    # Create submission
    submission = SellerSubmission(
        user_id=user_id,
        product_name=data['product_name'],
        category_id=int(data['category_id']),
        condition=data.get('condition', 'second-hand'),
        description=data['description'],
        asking_price=float(data['asking_price']) if data.get('asking_price') else None,
        location=data.get('location'),
        seller_name=data['seller_name'],
        seller_phone=data['seller_phone'],
        seller_email=data.get('seller_email')
    )
    
    db.session.add(submission)
    db.session.flush()
    
    # Upload images
    for idx, file in enumerate(files):
        if file and file.filename:
            result = upload_image(file, folder='submissions')
            if result:
                image = SubmissionImage(
                    submission_id=submission.id,
                    image_url=result['url'],
                    public_id=result['public_id'],
                    display_order=idx
                )
                db.session.add(image)
    
    db.session.commit()
    
    # Send confirmation SMS
    try:
        send_sms(submission.seller_phone, 
                 f"Hi {submission.seller_name}, your product '{submission.product_name}' has been submitted for review. We'll get back to you within 48 hours.")
    except Exception as e:
        print(f"Failed to send SMS: {e}")
    
    return jsonify({
        'success': True,
        'message': 'Product submitted for review',
        'data': submission.to_dict()
    }), 201

@submissions_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_submissions():
    """Get current user's submissions"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 50)
    
    pagination = SellerSubmission.query.filter_by(user_id=user_id)\
        .order_by(SellerSubmission.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'submissions': [sub.to_dict() for sub in pagination.items],
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'total': pagination.total,
                'per_page': pagination.per_page
            }
        }
    }), 200

@submissions_bp.route('/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission(submission_id):
    """Get single submission"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    submission = SellerSubmission.query.get(submission_id)
    
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    if submission.user_id != user_id and not user.is_admin():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    return jsonify({'success': True, 'data': submission.to_dict()}), 200

@submissions_bp.route('/<int:submission_id>', methods=['PUT'])
@jwt_required()
def update_submission(submission_id):
    """Update submission (only if pending)"""
    user_id = get_jwt_identity()
    
    submission = SellerSubmission.query.get(submission_id)
    
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    if submission.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    if submission.status != 'pending':
        return jsonify({'success': False, 'message': 'Cannot update submission after review'}), 400
    
    data = request.get_json()
    
    if data.get('product_name'):
        submission.product_name = data['product_name']
    if data.get('description'):
        submission.description = data['description']
    if data.get('asking_price'):
        submission.asking_price = float(data['asking_price'])
    if data.get('location'):
        submission.location = data['location']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Submission updated',
        'data': submission.to_dict()
    }), 200

@submissions_bp.route('/<int:submission_id>', methods=['DELETE'])
@jwt_required()
def delete_submission(submission_id):
    """Delete submission (only if pending)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    submission = SellerSubmission.query.get(submission_id)
    
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    if submission.user_id != user_id and not user.is_admin():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    if submission.status != 'pending' and not user.is_admin():
        return jsonify({'success': False, 'message': 'Cannot delete submission after review'}), 400
    
    # Delete images from Cloudinary
    for image in submission.images:
        if image.public_id:
            delete_image(image.public_id)
    
    db.session.delete(submission)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Submission deleted'}), 200

# Admin routes
@submissions_bp.route('/admin/submissions', methods=['GET'])
@jwt_required()
def admin_get_submissions():
    """Get all submissions (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    status = request.args.get('status')
    search = request.args.get('search')
    
    query = SellerSubmission.query
    
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    if search:
        query = query.filter(
            SellerSubmission.product_name.ilike(f'%{search}%')
        )
    
    pagination = query.order_by(SellerSubmission.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'submissions': [sub.to_dict() for sub in pagination.items],
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'total': pagination.total,
                'per_page': pagination.per_page
            }
        }
    }), 200

@submissions_bp.route('/admin/submissions/<int:submission_id>/review', methods=['POST'])
@jwt_required()
def review_submission(submission_id):
    """Review submission (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    submission = SellerSubmission.query.get(submission_id)
    
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    data = request.get_json()
    action = data.get('action')  # 'approve', 'reject', 'negotiate'
    notes = data.get('notes', '')
    
    if action == 'approve':
        submission.approve(
            admin_id=get_jwt_identity(),
            notes=notes,
            negotiated_price=data.get('negotiated_price')
        )
        message = f"Your product '{submission.product_name}' has been approved! "
        if data.get('negotiated_price'):
            message += f"Offer price: KSH {float(data['negotiated_price']):,.0f}. "
        message += "Our team will contact you for pickup."
        
    elif action == 'reject':
        submission.reject(
            admin_id=get_jwt_identity(),
            reason=notes
        )
        message = f"Your product '{submission.product_name}' has been rejected. Reason: {notes}"
        
    elif action == 'negotiate':
        submission.status = 'reviewing'
        submission.admin_notes = notes
        submission.negotiated_price = float(data.get('negotiated_price', 0))
        submission.reviewed_by = get_jwt_identity()
        submission.reviewed_at = datetime.utcnow()
        db.session.commit()
        message = f"Negotiation offer for '{submission.product_name}': KSH {float(data['negotiated_price']):,.0f}. {notes}"
        
    else:
        return jsonify({'success': False, 'message': 'Invalid action'}), 400
    
    # Send notification
    try:
        if submission.seller_email:
            send_submission_status_email(submission.seller_email, submission, action, notes)
        send_sms(submission.seller_phone, message)
    except Exception as e:
        print(f"Failed to send notification: {e}")
    
    return jsonify({
        'success': True,
        'message': f'Submission {action}d successfully',
        'data': submission.to_dict()
    }), 200

@submissions_bp.route('/admin/submissions/<int:submission_id>/purchase', methods=['POST'])
@jwt_required()
def mark_purchased(submission_id):
    """Mark submission as purchased (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    submission = SellerSubmission.query.get(submission_id)
    
    if not submission:
        return jsonify({'success': False, 'message': 'Submission not found'}), 404
    
    data = request.get_json()
    
    submission.mark_purchased()
    submission.negotiated_price = float(data.get('purchase_price', submission.asking_price))
    
    db.session.commit()
    
    # Send notification
    try:
        message = f"Congratulations! Your product '{submission.product_name}' has been purchased by Femuki Agencies for KSH {submission.negotiated_price:,.0f}. We'll arrange pickup."
        send_sms(submission.seller_phone, message)
    except Exception as e:
        print(f"Failed to send SMS: {e}")
    
    return jsonify({
        'success': True,
        'message': 'Product marked as purchased',
        'data': submission.to_dict()
    }), 200

@submissions_bp.route('/admin/submissions/stats', methods=['GET'])
@jwt_required()
def get_submission_stats():
    """Get submission statistics (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    total = SellerSubmission.query.count()
    pending = SellerSubmission.query.filter_by(status='pending').count()
    reviewing = SellerSubmission.query.filter_by(status='reviewing').count()
    approved = SellerSubmission.query.filter_by(status='approved').count()
    rejected = SellerSubmission.query.filter_by(status='rejected').count()
    purchased = SellerSubmission.query.filter_by(status='purchased').count()
    
    return jsonify({
        'success': True,
        'data': {
            'total': total,
            'pending': pending,
            'reviewing': reviewing,
            'approved': approved,
            'rejected': rejected,
            'purchased': purchased
        }
    }), 200