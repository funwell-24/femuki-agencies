# backend/app/routes/cart.py
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import Cart, CartItem, Product, User

cart_bp = Blueprint('cart', __name__)

# Handle preflight OPTIONS requests for all cart routes
@cart_bp.route('', methods=['OPTIONS'])
@cart_bp.route('/', methods=['OPTIONS'])
@cart_bp.route('/items', methods=['OPTIONS'])
@cart_bp.route('/items/<int:item_id>', methods=['OPTIONS'])
@cart_bp.route('/clear', methods=['OPTIONS'])
@cart_bp.route('/items/<int:item_id>/save', methods=['OPTIONS'])
def handle_options(item_id=None):
    """Handle CORS preflight requests"""
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "Content-Type, Authorization, X-Requested-With, Accept")
    response.headers.add('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, OPTIONS, PATCH")
    response.headers.add('Access-Control-Allow-Credentials', "true")
    return response

@cart_bp.route('/', methods=['GET'])
@jwt_required(optional=True)
def get_cart():
    """Get user's cart"""
    user_id = get_jwt_identity()
    
    if not user_id:
        return jsonify({
            'success': True,
            'data': {
                'items': [],
                'items_count': 0,
                'subtotal': 0,
                'shipping_cost': 0,
                'tax_amount': 0,
                'total': 0
            }
        }), 200
    
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    
    # Ensure each cart item has product details
    cart_data = cart.to_dict()
    for item in cart_data.get('items', []):
        if item.get('product'):
            item['price'] = item['product'].get('price', 0)
            item['name'] = item['product'].get('name', '')
            item['slug'] = item['product'].get('slug', '')
            item['condition'] = item['product'].get('product_condition', 'second-hand')
            item['stock'] = item['product'].get('quantity', 0)
            item['image'] = item['product'].get('primary_image', '/placeholder.jpg')
    
    return jsonify({
        'success': True,
        'data': cart_data
    }), 200
# backend/app/routes/cart.py - Update the add_to_cart function

@cart_bp.route('/items', methods=['POST'])
@jwt_required()
def add_to_cart():
    """Add item to cart"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        data = request.get_json()
        print(f"📦 Add to cart request: user_id={user_id}, data={data}")
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not product_id:
            print("❌ No product_id provided")
            return jsonify({'success': False, 'message': 'Product ID required'}), 400
        
        # Check if product exists
        product = Product.query.get(product_id)
        print(f"📦 Product found: {product.name if product else 'None'}")
        
        if not product:
            print(f"❌ Product {product_id} not found")
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        if product.status != 'available':
            print(f"❌ Product {product_id} not available (status: {product.status})")
            return jsonify({'success': False, 'message': 'Product not available'}), 400
        
        if product.quantity < quantity:
            print(f"❌ Insufficient stock: requested {quantity}, available {product.quantity}")
            return jsonify({'success': False, 'message': f'Only {product.quantity} items available'}), 400
        
        # Get or create cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            print(f"📦 Creating new cart for user {user_id}")
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.flush()
        
        # Check if item already in cart
        cart_item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
        
        if cart_item:
            new_quantity = cart_item.quantity + quantity
            print(f"📦 Updating existing cart item: current={cart_item.quantity}, new={new_quantity}")
            if product.quantity < new_quantity:
                return jsonify({'success': False, 'message': f'Only {product.quantity} items available'}), 400
            cart_item.quantity = new_quantity
        else:
            print(f"📦 Creating new cart item for product {product_id}")
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(cart_item)
        
        db.session.commit()
        print("✅ Item added to cart successfully")
        
        return jsonify({
            'success': True,
            'message': 'Item added to cart',
            'data': cart.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding to cart: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@cart_bp.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """Update cart item quantity"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    cart_item = CartItem.query.get(item_id)
    
    if not cart_item:
        return jsonify({'success': False, 'message': 'Cart item not found'}), 404
    
    # Verify ownership
    cart = cart_item.cart
    if cart.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    new_quantity = data.get('quantity', 1)
    
    if new_quantity <= 0:
        return remove_from_cart(item_id)
    
    product = cart_item.product
    if product.quantity < new_quantity:
        return jsonify({'success': False, 'message': f'Only {product.quantity} items available'}), 400
    
    cart_item.quantity = new_quantity
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': cart.to_dict()
    }), 200

@cart_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Remove item from cart"""
    user_id = get_jwt_identity()
    
    cart_item = CartItem.query.get(item_id)
    
    if not cart_item:
        return jsonify({'success': False, 'message': 'Cart item not found'}), 404
    
    cart = cart_item.cart
    if cart.user_id != user_id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    db.session.delete(cart_item)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Item removed from cart',
        'data': cart.to_dict()
    }), 200

@cart_bp.route('/saved', methods=['GET'])
@jwt_required(optional=True)
def get_saved_items():
    """Get saved items (placeholder)"""
    # This is a placeholder - implement actual saved items logic if needed
    return jsonify({
        'success': True,
        'data': []
    }), 200

@cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear entire cart"""
    user_id = get_jwt_identity()
    
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if cart:
        cart.clear()
    
    return jsonify({
        'success': True,
        'message': 'Cart cleared'
    }), 200

@cart_bp.route('/items/<int:item_id>/save', methods=['POST'])
@jwt_required()
def save_for_later(item_id):
    """Move item to saved for later"""
    # This would move to a saved items table
    # For now, just remove from cart
    return remove_from_cart(item_id)