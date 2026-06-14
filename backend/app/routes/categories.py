# backend/app/routes/categories.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db, cache
from ..models import Category, Product, User
from ..utils.helpers import slugify

categories_bp = Blueprint('categories', __name__)

def is_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.is_admin()

@categories_bp.route('/', methods=['GET'])
@cache.cached(timeout=3600)
def get_categories():
    """Get all categories"""
    categories = Category.query.order_by(Category.name).all()
    
    return jsonify({
        'success': True,
        'data': [category.to_dict() for category in categories]
    }), 200

@categories_bp.route('/<slug>', methods=['GET'])
@cache.cached(timeout=3600)
def get_category(slug):
    """Get single category by slug"""
    category = Category.query.filter_by(slug=slug).first()
    
    if not category:
        return jsonify({'success': False, 'message': 'Category not found'}), 404
    
    return jsonify({'success': True, 'data': category.to_dict()}), 200

@categories_bp.route('/<slug>/products', methods=['GET'])
def get_category_products(slug):
    """Get products in a category"""
    category = Category.query.filter_by(slug=slug).first()
    
    if not category:
        return jsonify({'success': False, 'message': 'Category not found'}), 404
    
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 20, type=int), 100)
    
    products = Product.query.filter_by(
        category_id=category.id,
        status='available',
        is_active=True
    ).paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'category': category.to_dict(),
            'products': [product.to_dict() for product in products.items],
            'pagination': {
                'page': products.page,
                'pages': products.pages,
                'total': products.total,
                'per_page': products.per_page
            }
        }
    }), 200

# Admin routes
@categories_bp.route('/admin/categories', methods=['POST'])
@jwt_required()
def add_category():
    """Add new category (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'success': False, 'message': 'Category name is required'}), 400
    
    slug = slugify(data['name'])
    
    if Category.query.filter_by(slug=slug).first():
        return jsonify({'success': False, 'message': 'Category already exists'}), 400
    
    category = Category(
        name=data['name'],
        slug=slug,
        description=data.get('description'),
        image_url=data.get('image_url'),
        icon=data.get('icon')
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Category added successfully',
        'data': category.to_dict()
    }), 201

@categories_bp.route('/admin/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update category (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'success': False, 'message': 'Category not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        category.name = data['name']
        category.slug = slugify(data['name'])
    
    if data.get('description'):
        category.description = data['description']
    
    if data.get('image_url'):
        category.image_url = data['image_url']
    
    if data.get('icon'):
        category.icon = data['icon']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Category updated successfully',
        'data': category.to_dict()
    }), 200

@categories_bp.route('/admin/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete category (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    category = Category.query.get(category_id)
    
    if not category:
        return jsonify({'success': False, 'message': 'Category not found'}), 404
    
    # Check if category has products
    if category.products.count() > 0:
        return jsonify({'success': False, 'message': 'Cannot delete category with products'}), 400
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Category deleted successfully'}), 200