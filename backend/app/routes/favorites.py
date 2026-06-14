# backend/app/routes/favorites.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import Favorite, Product, User

favorites_bp = Blueprint('favorites', __name__)

# Handle OPTIONS preflight requests
@favorites_bp.route('', methods=['OPTIONS'])
@favorites_bp.route('/', methods=['OPTIONS'])
def handle_options():
    return '', 200

@favorites_bp.route('/', methods=['GET'])
@jwt_required()
def get_favorites():
    """Get user's favorite products"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        favorites = Favorite.query.filter_by(user_id=user_id)\
            .order_by(Favorite.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': {
                'favorites': [fav.to_dict() for fav in favorites]
            }
        }), 200
    except Exception as e:
        print(f"Error getting favorites: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@favorites_bp.route('/<int:product_id>', methods=['POST'])
@jwt_required()
def add_favorite(product_id):
    """Add product to favorites"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        # Check if product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        # Check if already favorited
        existing = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            return jsonify({'success': False, 'message': 'Product already in favorites'}), 400
        
        favorite = Favorite(user_id=user_id, product_id=product_id)
        db.session.add(favorite)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product added to favorites',
            'data': favorite.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding favorite: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@favorites_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(product_id):
    """Remove product from favorites"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        favorite = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
        
        if not favorite:
            return jsonify({'success': False, 'message': 'Product not in favorites'}), 404
        
        db.session.delete(favorite)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Product removed from favorites'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error removing favorite: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@favorites_bp.route('/check/<int:product_id>', methods=['GET'])
@jwt_required()
def check_favorite(product_id):
    """Check if product is favorited"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        favorite = Favorite.query.filter_by(user_id=user_id, product_id=product_id).first()
        
        return jsonify({
            'success': True,
            'data': {'is_favorited': favorite is not None}
        }), 200
    except Exception as e:
        print(f"Error checking favorite: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@favorites_bp.route('/count', methods=['GET'])
@jwt_required()
def get_favorites_count():
    """Get count of user's favorites"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        count = Favorite.query.filter_by(user_id=user_id).count()
        
        return jsonify({'success': True, 'data': {'count': count}}), 200
    except Exception as e:
        print(f"Error getting favorites count: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500