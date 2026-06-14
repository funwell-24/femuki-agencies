# backend/test_app.py
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Simple CORS - allow everything for testing
CORS(app, origins="*", supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

jwt = JWTManager(app)

# Global OPTIONS handler
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Femuki Agencies API is running'}), 200

# Auth endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    access_token = create_access_token(identity=str(1))
    return jsonify({
        'success': True,
        'message': 'Registration successful',
        'data': {
            'token': access_token,
            'user': {
                'id': 1,
                'full_name': data.get('full_name', 'User'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'role': 'customer'
            }
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    access_token = create_access_token(identity=str(1))
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'token': access_token,
            'user': {
                'id': 1,
                'full_name': 'Admin User',
                'email': data.get('email', 'admin@femuki.com'),
                'phone': '0797717981',
                'role': 'admin',
                'address': 'Nairobi',
                'city': 'Nairobi',
                'county': 'Nairobi'
            }
        }
    }), 200

@app.route('/api/auth/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'data': {
                'id': int(user_id),
                'full_name': 'Admin User',
                'email': 'admin@femuki.com',
                'phone': '0797717981',
                'role': 'admin',
                'address': 'Nairobi',
                'city': 'Nairobi',
                'county': 'Nairobi'
            }
        }), 200
    else:
        data = request.get_json()
        return jsonify({
            'success': True,
            'message': 'Profile updated',
            'data': {
                'id': int(user_id),
                'full_name': data.get('full_name', 'Admin User'),
                'email': 'admin@femuki.com',
                'phone': data.get('phone', '0797717981'),
                'role': 'admin',
                'address': data.get('address', ''),
                'city': data.get('city', ''),
                'county': data.get('county', '')
            }
        }), 200

# Dashboard endpoint
@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    return jsonify({
        'success': True,
        'data': {
            'products': {'total': 247, 'available': 189, 'sold': 58},
            'orders': {'total': 892, 'pending': 23, 'delivered': 745, 'processing': 45, 'shipped': 79},
            'revenue': {'total': 2456800, 'monthly': 342000},
            'users': {'total': 1256, 'active': 1120, 'blocked': 36},
            'submissions': {'pending': 23, 'reviewing': 12, 'approved': 45, 'purchased': 30},
            'views': {'total': 45780}
        }
    }), 200

# Admin orders endpoint
@app.route('/api/admin/orders', methods=['GET'])
@jwt_required()
def admin_orders():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    sample_orders = [
        {'id': 1, 'order_number': 'FEM-20241201-001', 'user_id': 1, 'total_amount': 28500, 'status': 'delivered', 'payment_method': 'mpesa', 'created_at': '2024-12-01T10:30:00', 'items_count': 2},
        {'id': 2, 'order_number': 'FEM-20241128-002', 'user_id': 2, 'total_amount': 15500, 'status': 'shipped', 'payment_method': 'cash_on_delivery', 'created_at': '2024-11-28T14:15:00', 'items_count': 1},
        {'id': 3, 'order_number': 'FEM-20241125-003', 'user_id': 3, 'total_amount': 42000, 'status': 'processing', 'payment_method': 'bank_transfer', 'created_at': '2024-11-25T09:45:00', 'items_count': 1},
    ]
    
    return jsonify({
        'success': True,
        'data': {
            'orders': sample_orders,
            'pagination': {'total': 25, 'page': page, 'pages': 3, 'limit': limit}
        }
    }), 200

# Products endpoint
@app.route('/api/products', methods=['GET'])
def products():
    sort_by = request.args.get('sort_by', 'newest')
    limit = request.args.get('limit', 10, type=int)
    
    sample_products = [
        {'id': 1, 'name': 'Samsung 43" Smart TV', 'price': 28000, 'product_condition': 'second-hand', 'status': 'available', 'category': {'name': 'TVs'}, 'views': 234, 'images': ['/tv.jpg']},
        {'id': 2, 'name': 'Comfort Memory Foam Mattress', 'price': 15500, 'product_condition': 'new', 'status': 'available', 'category': {'name': 'Mattresses'}, 'views': 567, 'images': ['/mattress.jpg']},
        {'id': 3, 'name': 'Leather Sofa Set', 'price': 45000, 'product_condition': 'second-hand', 'status': 'available', 'category': {'name': 'Sofas'}, 'views': 890, 'images': ['/sofa.jpg']},
    ]
    
    if sort_by == 'popular':
        sample_products.sort(key=lambda x: x.get('views', 0), reverse=True)
    
    return jsonify({
        'success': True,
        'data': {'products': sample_products[:limit]}
    }), 200

# Cart endpoints
@app.route('/api/cart', methods=['GET'])
@jwt_required(optional=True)
def get_cart():
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

@app.route('/api/cart/saved', methods=['GET'])
@jwt_required(optional=True)
def get_saved():
    return jsonify({
        'success': True,
        'data': []
    }), 200

# Notifications endpoint
@app.route('/api/notifications/', methods=['GET'])
@jwt_required(optional=True)
def notifications():
    return jsonify({
        'success': True,
        'data': []
    }), 200

# Categories endpoint
@app.route('/api/categories', methods=['GET'])
def categories():
    return jsonify({
        'success': True,
        'data': [
            {'id': 1, 'name': 'Beds', 'slug': 'beds', 'product_count': 45},
            {'id': 2, 'name': 'Mattresses', 'slug': 'mattresses', 'product_count': 38},
            {'id': 3, 'name': 'Sofas', 'slug': 'sofas', 'product_count': 52},
            {'id': 4, 'name': 'TVs', 'slug': 'tvs', 'product_count': 29},
            {'id': 5, 'name': 'Fridges', 'slug': 'fridges', 'product_count': 24},
        ]
    }), 200

# Favorites endpoint
@app.route('/api/favorites', methods=['GET'])
@jwt_required(optional=True)
def favorites():
    return jsonify({
        'success': True,
        'data': {'favorites': []}
    }), 200

# Admin users endpoint
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_users():
    return jsonify({
        'success': True,
        'data': {
            'users': [
                {'id': 1, 'full_name': 'Admin User', 'email': 'admin@femuki.com', 'phone': '0797717981', 'role': 'admin', 'is_active': True, 'is_blocked': False, 'created_at': '2024-01-01'},
                {'id': 2, 'full_name': 'John Doe', 'email': 'john@example.com', 'phone': '0712345678', 'role': 'customer', 'is_active': True, 'is_blocked': False, 'created_at': '2024-01-15'},
            ],
            'pagination': {'total': 2, 'page': 1, 'pages': 1}
        }
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)