# backend/app/routes/dashboard.py
from flask import Blueprint, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from ..extensions import db
from ..models import User, Product, Order

dashboard_bp = Blueprint('dashboard', __name__)

# Handle OPTIONS
@dashboard_bp.route('/stats', methods=['OPTIONS'])
def stats_options():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "GET, OPTIONS")
    return response

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        user = User.query.get(user_id)
        
        # Simple stats that will always work
        total_products = Product.query.count()
        total_orders = Order.query.count()
        total_users = User.query.filter_by(role='customer').count()
        total_revenue = db.session.query(func.sum(Order.total_amount)).scalar() or 0
        
        return jsonify({
            'success': True,
            'data': {
                'products': {'total': total_products, 'available': 0, 'sold': 0},
                'orders': {'total': total_orders, 'pending': 0, 'delivered': 0},
                'revenue': {'total': float(total_revenue), 'monthly_growth': 0},
                'users': {'total': total_users, 'monthly_growth': 0},
                'submissions': {'pending': 0},
                'views': {'total': 0}
            }
        }), 200
    except Exception as e:
        print(f"Dashboard stats error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500