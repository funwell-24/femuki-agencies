# backend/app/routes/users.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    pagination = User.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'users': [user.to_dict() for user in pagination.items],
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'total': pagination.total,
                'per_page': pagination.per_page
            }
        }
    }), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get single user"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user_id != user_id and not current_user.is_admin():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    return jsonify({'success': True, 'data': user.to_dict()}), 200

@users_bp.route('/<int:user_id>/block', methods=['POST'])
@jwt_required()
def block_user(user_id):
    """Block a user (admin only)"""
    current_user = User.query.get(get_jwt_identity())
    
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if user.is_admin():
        return jsonify({'success': False, 'message': 'Cannot block admin user'}), 400
    
    user.is_blocked = True
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User blocked successfully'}), 200

@users_bp.route('/<int:user_id>/unblock', methods=['POST'])
@jwt_required()
def unblock_user(user_id):
    """Unblock a user (admin only)"""
    current_user = User.query.get(get_jwt_identity())
    
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    user.is_blocked = False
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User unblocked successfully'}), 200

@users_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user statistics (admin only)"""
    current_user = User.query.get(get_jwt_identity())
    
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    blocked_users = User.query.filter_by(is_blocked=True).count()
    verified_users = User.query.filter_by(email_verified=True).count()
    
    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'active_users': active_users,
            'blocked_users': blocked_users,
            'verified_users': verified_users
        }
    }), 200