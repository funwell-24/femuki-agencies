# backend/app/routes/admin.py
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..extensions import db
from ..models import User, Product, Order, SellerSubmission, ProductImage

admin_bp = Blueprint('admin', __name__)

def is_admin():
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        user = User.query.get(user_id)
        return user and user.is_admin()
    except:
        return False

# Handle OPTIONS preflight requests
@admin_bp.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        return response

# ==================== PRODUCTS ENDPOINTS ====================

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_admin_products():
    """Get all products for admin"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '')
        
        query = Product.query
        if search:
            query = query.filter(Product.name.ilike(f'%{search}%'))
        
        pagination = query.order_by(Product.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        return jsonify({
            'success': True,
            'data': {
                'products': [product.to_dict() for product in pagination.items],
                'pagination': {
                    'total': pagination.total,
                    'page': pagination.page,
                    'pages': pagination.pages,
                    'limit': pagination.per_page
                }
            }
        }), 200
    except Exception as e:
        print(f"Error getting products: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_admin_product():
    """Create a new product (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        name = request.form.get('name')
        price = request.form.get('price')
        category_id = request.form.get('category_id')
        description = request.form.get('description', '')
        condition = request.form.get('condition', 'second-hand')
        quantity = request.form.get('quantity', 1)
        dimensions = request.form.get('dimensions', '')
        featured = request.form.get('featured', 'false').lower() == 'true'
        
        if not name or not price or not category_id:
            return jsonify({'success': False, 'message': 'Name, price, and category are required'}), 400
        
        import re
        slug = name.lower().replace(' ', '-')
        slug = re.sub(r'[^a-z0-9-]', '', slug)
        
        if Product.query.filter_by(slug=slug).first():
            slug = f"{slug}-{Product.query.count() + 1}"
        
        product = Product(
            name=name,
            slug=slug,
            description=description,
            price=float(price),
            product_condition=condition,
            quantity=int(quantity),
            dimensions=dimensions,
            category_id=int(category_id),
            featured=featured,
            is_active=True,
            views=0,
            rating=0,
            review_count=0,
            sold_count=0,
            created_by=int(get_jwt_identity())
        )
        
        db.session.add(product)
        db.session.flush()
        
        # Handle images
        import os
        from werkzeug.utils import secure_filename
        
        upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads', 'products')
        os.makedirs(upload_folder, exist_ok=True)
        
        images = request.files.getlist('images')
        for idx, file in enumerate(images):
            if file and file.filename:
                ext = file.filename.rsplit('.', 1)[-1].lower()
                filename = secure_filename(f"{product.id}_{idx}_{int(datetime.now().timestamp())}.{ext}")
                filepath = os.path.join(upload_folder, filename)
                file.save(filepath)
                
                image_url = f"/uploads/products/{filename}"
                
                product_image = ProductImage(
                    product_id=product.id,
                    image_url=image_url,
                    is_primary=(idx == 0),
                    display_order=idx
                )
                db.session.add(product_image)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product created successfully',
            'data': product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating product: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_admin_product(product_id):
    """Update a product (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        if request.content_type and 'multipart/form-data' in request.content_type:
            if request.form.get('name'):
                product.name = request.form.get('name')
            if request.form.get('description'):
                product.description = request.form.get('description')
            if request.form.get('price'):
                product.price = float(request.form.get('price'))
            if request.form.get('condition'):
                product.product_condition = request.form.get('condition')
            if request.form.get('quantity'):
                product.quantity = int(request.form.get('quantity'))
            if request.form.get('dimensions'):
                product.dimensions = request.form.get('dimensions')
            if request.form.get('category_id'):
                product.category_id = int(request.form.get('category_id'))
            if request.form.get('featured'):
                featured_val = request.form.get('featured')
                if isinstance(featured_val, str):
                    featured_val = featured_val.lower() == 'true'
                product.featured = featured_val
            
            import os
            from werkzeug.utils import secure_filename
            
            upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads', 'products')
            os.makedirs(upload_folder, exist_ok=True)
            
            images = request.files.getlist('images')
            for idx, file in enumerate(images):
                if file and file.filename:
                    ext = file.filename.rsplit('.', 1)[-1].lower()
                    filename = secure_filename(f"{product.id}_{idx}_{int(datetime.now().timestamp())}.{ext}")
                    filepath = os.path.join(upload_folder, filename)
                    file.save(filepath)
                    
                    image_url = f"/uploads/products/{filename}"
                    
                    product_image = ProductImage(
                        product_id=product.id,
                        image_url=image_url,
                        is_primary=(product.images.count() == 0 and idx == 0),
                        display_order=product.images.count() + idx
                    )
                    db.session.add(product_image)
        else:
            data = request.get_json()
            if data:
                if data.get('name'):
                    product.name = data['name']
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
                if data.get('featured') is not None:
                    featured_val = data['featured']
                    if isinstance(featured_val, str):
                        featured_val = featured_val.lower() == 'true'
                    product.featured = featured_val
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product updated successfully',
            'data': product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating product: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_admin_product(product_id):
    """Delete a product (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        import os
        for image in product.images:
            if image.image_url and image.image_url.startswith('/uploads/'):
                filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), image.image_url.lstrip('/'))
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting product: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/products/<int:product_id>/status', methods=['PATCH'])
@jwt_required()
def update_product_status_route(product_id):
    """Update product status (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['available', 'sold', 'pending']:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
        product.status = new_status
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Product status updated to {new_status}'}), 200
        
    except Exception as e:
        print(f"Error updating status: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== ORDERS ENDPOINTS ====================

@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    """Get all orders for admin"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        pagination = Order.query.order_by(Order.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        orders_data = []
        for order in pagination.items:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user_id': order.user_id,
                'total_amount': float(order.total_amount) if order.total_amount else 0,
                'status': order.status,
                'payment_method': order.payment_method,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'items_count': order.items.count()
            })
        
        return jsonify({
            'success': True,
            'data': {
                'orders': orders_data,
                'pagination': {
                    'total': pagination.total,
                    'page': pagination.page,
                    'pages': pagination.pages,
                    'limit': pagination.per_page
                }
            }
        }), 200
    except Exception as e:
        print(f"Error getting orders: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status_route(order_id):
    """Update order status (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
        order.status = new_status
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Order status updated to {new_status}'}), 200
        
    except Exception as e:
        print(f"Error updating order status: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== USERS ENDPOINTS ====================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_admin_users():
    """Get all users for admin"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '')
        
        query = User.query
        if search:
            query = query.filter(User.full_name.ilike(f'%{search}%') | User.email.ilike(f'%{search}%'))
        
        pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        return jsonify({
            'success': True,
            'data': {
                'users': [user.to_dict() for user in pagination.items],
                'pagination': {
                    'total': pagination.total,
                    'page': pagination.page,
                    'pages': pagination.pages,
                    'limit': pagination.per_page
                }
            }
        }), 200
    except Exception as e:
        print(f"Error getting users: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/block', methods=['POST'])
@jwt_required()
def block_user_route(user_id):
    """Block a user (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        if user.is_admin():
            return jsonify({'success': False, 'message': 'Cannot block admin user'}), 400
        
        user.is_blocked = True
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User blocked successfully'}), 200
        
    except Exception as e:
        print(f"Error blocking user: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/unblock', methods=['POST'])
@jwt_required()
def unblock_user_route(user_id):
    """Unblock a user (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        user.is_blocked = False
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User unblocked successfully'}), 200
        
    except Exception as e:
        print(f"Error unblocking user: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== SUBMISSIONS ENDPOINTS ====================

@admin_bp.route('/submissions', methods=['GET'])
@jwt_required()
def get_admin_submissions():
    """Get all seller submissions for admin"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status', '')
        
        query = SellerSubmission.query
        if status and status != 'all':
            query = query.filter_by(status=status)
        
        pagination = query.order_by(SellerSubmission.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        submissions_data = []
        for sub in pagination.items:
            submissions_data.append({
                'id': sub.id,
                'product_name': sub.product_name,
                'product_condition': sub.condition,
                'asking_price': float(sub.asking_price) if sub.asking_price else None,
                'seller_name': sub.seller_name,
                'seller_phone': sub.seller_phone,
                'status': sub.status,
                'created_at': sub.created_at.isoformat() if sub.created_at else None,
                'category': {'name': sub.category.name} if sub.category else None,
                'images': [{'image_url': img.image_url} for img in sub.images]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'submissions': submissions_data,
                'pagination': {
                    'total': pagination.total,
                    'page': pagination.page,
                    'pages': pagination.pages,
                    'limit': pagination.per_page
                }
            }
        }), 200
    except Exception as e:
        print(f"Error getting submissions: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    
    # Add to admin.py

@admin_bp.route('/submissions/<int:submission_id>/review', methods=['POST'])
@jwt_required()
def admin_review_submission(submission_id):
    """Review a seller submission (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        submission = SellerSubmission.query.get(submission_id)
        if not submission:
            return jsonify({'success': False, 'message': 'Submission not found'}), 404
        
        data = request.get_json()
        action = data.get('action')
        notes = data.get('notes', '')
        negotiated_price = data.get('negotiated_price')
        
        if action == 'approve':
            submission.status = 'approved'
            if negotiated_price:
                submission.negotiated_price = negotiated_price
            submission.admin_notes = notes
            submission.reviewed_by = get_jwt_identity()
            submission.reviewed_at = datetime.utcnow()
            message = f"Your product '{submission.product_name}' has been approved!"
        elif action == 'reject':
            submission.status = 'rejected'
            submission.admin_notes = notes
            submission.reviewed_by = get_jwt_identity()
            submission.reviewed_at = datetime.utcnow()
            message = f"Your product '{submission.product_name}' has been rejected. Reason: {notes}"
        else:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': message}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error reviewing submission: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/submissions/<int:submission_id>/purchase', methods=['POST'])
@jwt_required()
def admin_purchase_submission(submission_id):
    """Mark submission as purchased (admin only)"""
    try:
        if not is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        submission = SellerSubmission.query.get(submission_id)
        if not submission:
            return jsonify({'success': False, 'message': 'Submission not found'}), 404
        
        data = request.get_json()
        purchase_price = data.get('purchase_price')
        
        submission.status = 'purchased'
        if purchase_price:
            submission.negotiated_price = purchase_price
        submission.purchased_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Product marked as purchased'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error marking purchased: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500