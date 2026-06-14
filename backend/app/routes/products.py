# backend/app/routes/products.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

from ..extensions import db, cache
from ..models import Product, Category, ProductImage, User
from ..services.cloudinary_service import upload_image, delete_image
from ..utils.helpers import slugify

products_bp = Blueprint('products', __name__)

def is_admin():
    """Check if current user is admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.is_admin()

@products_bp.route('/', methods=['GET'])
@cache.cached(timeout=60, query_string=True)
def get_products():
    """Get all products with filters"""
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 20, type=int), 100)
    
    # Build query
    query = Product.query.filter_by(status='available', is_active=True)
    
    # Category filter
    category = request.args.get('category')
    if category:
        category_obj = Category.query.filter_by(slug=category).first()
        if category_obj:
            query = query.filter_by(category_id=category_obj.id)
    
    # Condition filter
    condition = request.args.get('condition')
    if condition in ['new', 'second-hand']:
        query = query.filter_by(product_condition=condition)
    
    # Price range filter
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    if min_price:
        query = query.filter(Product.price >= min_price)
    if max_price:
        query = query.filter(Product.price <= max_price)
    
    # Search filter
    search = request.args.get('search')
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f'%{search}%'),
                Product.description.ilike(f'%{search}%')
            )
        )
    
    # Sorting
    sort_by = request.args.get('sort_by', 'newest')
    sort_mapping = {
        'newest': Product.created_at.desc(),
        'oldest': Product.created_at.asc(),
        'price_asc': Product.price.asc(),
        'price_desc': Product.price.desc(),
        'name_asc': Product.name.asc(),
        'name_desc': Product.name.desc(),
        'popular': Product.views.desc()
    }
    
    if sort_by in sort_mapping:
        query = query.order_by(sort_mapping[sort_by])
    
    # Pagination
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'products': [product.to_dict() for product in pagination.items],
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'total': pagination.total,
                'per_page': pagination.per_page
            }
        }
    }), 200

@products_bp.route('/featured', methods=['GET'])
@cache.cached(timeout=300)
def get_featured_products():
    """Get featured products"""
    limit = request.args.get('limit', 8, type=int)
    
    products = Product.query.filter_by(featured=True, status='available', is_active=True)\
        .order_by(Product.created_at.desc())\
        .limit(limit)\
        .all()
    
    return jsonify({
        'success': True,
        'data': [product.to_dict() for product in products]
    }), 200

@products_bp.route('/search', methods=['GET'])
def search_products():
    """Search products"""
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 20, type=int), 50)
    
    if not query or len(query) < 2:
        return jsonify({'success': False, 'message': 'Search term must be at least 2 characters'}), 400
    
    products = Product.query.filter(
        and_(
            Product.status == 'available',
            or_(
                Product.name.ilike(f'%{query}%'),
                Product.description.ilike(f'%{query}%')
            )
        )
    ).paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'success': True,
        'data': {
            'products': [product.to_dict() for product in products.items],
            'pagination': {
                'page': products.page,
                'pages': products.pages,
                'total': products.total,
                'per_page': products.per_page
            }
        }
    }), 200

@products_bp.route('/<identifier>', methods=['GET'])
def get_product(identifier):
    """Get single product by ID or slug"""
    # Try to find by ID (numeric) or slug
    if identifier.isdigit():
        product = Product.query.get(int(identifier))
    else:
        product = Product.query.filter_by(slug=identifier).first()
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    # Increment view count
    product.increment_views()
    
    return jsonify({'success': True, 'data': product.to_dict()}), 200

@products_bp.route('/<int:product_id>/related', methods=['GET'])
def get_related_products(product_id):
    """Get related products by category"""
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    limit = request.args.get('limit', 4, type=int)
    
    related = Product.query.filter(
        Product.category_id == product.category_id,
        Product.id != product_id,
        Product.status == 'available'
    ).limit(limit).all()
    
    return jsonify({
        'success': True,
        'data': [p.to_dict() for p in related]
    }), 200

@products_bp.route('/<int:product_id>/view', methods=['POST'])
def increment_view(product_id):
    """Increment product view count"""
    product = Product.query.get(product_id)
    
    if product:
        product.increment_views()
    
    return jsonify({'success': True}), 200

# Admin routes
@products_bp.route('/admin/products', methods=['POST'])
@jwt_required()
def add_product():
    """Add new product (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.form
    files = request.files.getlist('images')
    
    # Validate required fields
    required_fields = ['name', 'category_id', 'price']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # Create slug
    slug = slugify(data['name'])
    if Product.query.filter_by(slug=slug).first():
        slug = f"{slug}-{Product.query.count() + 1}"
    
    # Create product
    product = Product(
        name=data['name'],
        slug=slug,
        description=data.get('description', ''),
        price=float(data['price']),
        product_condition=data.get('condition', 'second-hand'),
        quantity=int(data.get('quantity', 1)),
        dimensions=data.get('dimensions'),
        category_id=int(data['category_id']),
        featured=data.get('featured', 'false').lower() == 'true',
        created_by=get_jwt_identity()
    )
    
    db.session.add(product)
    db.session.flush()
    
    # Upload images
    for idx, file in enumerate(files):
        if file and file.filename:
            result = upload_image(file, folder='products')
            if result:
                image = ProductImage(
                    product_id=product.id,
                    image_url=result['url'],
                    public_id=result['public_id'],
                    is_primary=(idx == 0),
                    display_order=idx
                )
                db.session.add(image)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Product added successfully',
        'data': product.to_dict()
    }), 201

@products_bp.route('/admin/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update product (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    data = request.form
    
    if data.get('name'):
        product.name = data['name']
        product.slug = slugify(data['name'])
    
    if data.get('description'):
        product.description = data['description']
    
    if data.get('price'):
        product.price = float(data['price'])
    
    if data.get('condition'):
        product.product_condition = data['condition']
    
    if data.get('quantity'):
        product.quantity = int(data['quantity'])
    
    if data.get('dimensions'):
        product.dimensions = data['dimensions']
    
    if data.get('category_id'):
        product.category_id = int(data['category_id'])
    
    if data.get('featured'):
        product.featured = data['featured'].lower() == 'true'
    
    # Handle new images
    files = request.files.getlist('images')
    for idx, file in enumerate(files):
        if file and file.filename:
            result = upload_image(file, folder='products')
            if result:
                image = ProductImage(
                    product_id=product.id,
                    image_url=result['url'],
                    public_id=result['public_id'],
                    is_primary=(idx == 0 and product.images.count() == 0),
                    display_order=product.images.count()
                )
                db.session.add(image)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Product updated successfully',
        'data': product.to_dict()
    }), 200

@products_bp.route('/admin/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete product (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    # Delete images from Cloudinary
    for image in product.images:
        if image.public_id:
            delete_image(image.public_id)
    
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Product deleted successfully'}), 200

@products_bp.route('/admin/products/<int:product_id>/status', methods=['PATCH'])
@jwt_required()
def update_product_status(product_id):
    """Update product status (admin only)"""
    if not is_admin():
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    product = Product.query.get(product_id)
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['available', 'sold', 'pending']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
    
    product.status = status
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Product marked as {status}',
        'data': product.to_dict()
    }), 200