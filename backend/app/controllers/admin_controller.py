# backend/app/controllers/admin_controller.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta

from ..extensions import db
from ..models import User, Product, Order, SellerSubmission, Testimonial, Category
from ..services.email_service import send_admin_notification

class AdminController:
    """Admin Dashboard Controller"""
    
    @staticmethod
    def is_admin():
        """Check if current user is admin"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return user and user.is_admin()
    
    @staticmethod
    @jwt_required()
    def get_dashboard_stats():
        """Get admin dashboard statistics"""
        if not AdminController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Product stats
        total_products = Product.query.count()
        available_products = Product.query.filter_by(status='available').count()
        sold_products = Product.query.filter_by(status='sold').count()
        featured_products = Product.query.filter_by(featured=True).count()
        low_stock_products = Product.query.filter(Product.quantity <= 5, Product.quantity > 0).count()
        out_of_stock = Product.query.filter_by(quantity=0).count()
        
        # Order stats
        total_orders = Order.query.count()
        pending_orders = Order.query.filter_by(status='pending').count()
        processing_orders = Order.query.filter_by(status='processing').count()
        shipped_orders = Order.query.filter_by(status='shipped').count()
        delivered_orders = Order.query.filter_by(status='delivered').count()
        cancelled_orders = Order.query.filter_by(status='cancelled').count()
        
        # Revenue stats
        total_revenue = db.session.query(func.sum(Order.total_amount))\
            .filter(Order.status == 'delivered').scalar() or 0
        
        # Monthly revenue (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        monthly_revenue = db.session.query(func.sum(Order.total_amount))\
            .filter(
                Order.status == 'delivered',
                Order.created_at >= thirty_days_ago
            ).scalar() or 0
        
        # Weekly revenue
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        weekly_revenue = db.session.query(func.sum(Order.total_amount))\
            .filter(
                Order.status == 'delivered',
                Order.created_at >= seven_days_ago
            ).scalar() or 0
        
        # Daily revenue
        today = datetime.utcnow().date()
        today_revenue = db.session.query(func.sum(Order.total_amount))\
            .filter(
                Order.status == 'delivered',
                func.date(Order.created_at) == today
            ).scalar() or 0
        
        # User stats
        total_users = User.query.filter_by(role='customer').count()
        active_users = User.query.filter_by(is_active=True, is_blocked=False).count()
        blocked_users = User.query.filter_by(is_blocked=True).count()
        verified_users = User.query.filter_by(email_verified=True).count()
        
        new_users_today = User.query.filter(
            User.role == 'customer',
            func.date(User.created_at) == today
        ).count()
        
        new_users_week = User.query.filter(
            User.role == 'customer',
            User.created_at >= seven_days_ago
        ).count()
        
        new_users_month = User.query.filter(
            User.role == 'customer',
            User.created_at >= thirty_days_ago
        ).count()
        
        # Submission stats
        total_submissions = SellerSubmission.query.count()
        pending_submissions = SellerSubmission.query.filter_by(status='pending').count()
        reviewing_submissions = SellerSubmission.query.filter_by(status='reviewing').count()
        approved_submissions = SellerSubmission.query.filter_by(status='approved').count()
        rejected_submissions = SellerSubmission.query.filter_by(status='rejected').count()
        purchased_submissions = SellerSubmission.query.filter_by(status='purchased').count()
        
        # Testimonial stats
        total_testimonials = Testimonial.query.count()
        pending_testimonials = Testimonial.query.filter_by(is_approved=False).count()
        approved_testimonials = Testimonial.query.filter_by(is_approved=True).count()
        avg_rating = db.session.query(func.avg(Testimonial.rating))\
            .filter_by(is_approved=True).scalar() or 0
        
        # Product views
        total_views = db.session.query(func.sum(Product.views)).scalar() or 0
        avg_views_per_product = total_views / total_products if total_products > 0 else 0
        
        # Category stats
        categories = Category.query.all()
        category_stats = []
        for cat in categories:
            category_stats.append({
                'id': cat.id,
                'name': cat.name,
                'product_count': cat.products.filter_by(status='available').count()
            })
        
        return jsonify({
            'success': True,
            'data': {
                'products': {
                    'total': total_products,
                    'available': available_products,
                    'sold': sold_products,
                    'featured': featured_products,
                    'low_stock': low_stock_products,
                    'out_of_stock': out_of_stock
                },
                'orders': {
                    'total': total_orders,
                    'pending': pending_orders,
                    'processing': processing_orders,
                    'shipped': shipped_orders,
                    'delivered': delivered_orders,
                    'cancelled': cancelled_orders
                },
                'revenue': {
                    'total': float(total_revenue),
                    'monthly': float(monthly_revenue),
                    'weekly': float(weekly_revenue),
                    'today': float(today_revenue)
                },
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'blocked': blocked_users,
                    'verified': verified_users,
                    'new_today': new_users_today,
                    'new_week': new_users_week,
                    'new_month': new_users_month
                },
                'submissions': {
                    'total': total_submissions,
                    'pending': pending_submissions,
                    'reviewing': reviewing_submissions,
                    'approved': approved_submissions,
                    'rejected': rejected_submissions,
                    'purchased': purchased_submissions
                },
                'testimonials': {
                    'total': total_testimonials,
                    'pending': pending_testimonials,
                    'approved': approved_testimonials,
                    'avg_rating': float(avg_rating)
                },
                'views': {
                    'total': total_views,
                    'avg_per_product': float(avg_views_per_product)
                },
                'categories': category_stats
            }
        }), 200
    
    @staticmethod
    @jwt_required()
    def get_recent_activity():
        """Get recent admin activity"""
        if not AdminController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Recent orders (last 10)
        recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
        
        # Recent submissions
        recent_submissions = SellerSubmission.query.order_by(SellerSubmission.created_at.desc()).limit(10).all()
        
        # Recent users
        recent_users = User.query.filter_by(role='customer')\
            .order_by(User.created_at.desc()).limit(10).all()
        
        # Recent testimonials
        recent_testimonials = Testimonial.query.order_by(Testimonial.created_at.desc()).limit(10).all()
        
        return jsonify({
            'success': True,
            'data': {
                'recent_orders': [order.to_dict(include_items=False) for order in recent_orders],
                'recent_submissions': [sub.to_dict() for sub in recent_submissions],
                'recent_users': [user.to_dict() for user in recent_users],
                'recent_testimonials': [t.to_dict() for t in recent_testimonials]
            }
        }), 200
    
    @staticmethod
    @jwt_required()
    def get_sales_report():
        """Get sales report (admin only)"""
        if not AdminController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        period = request.args.get('period', 'month')  # day, week, month, year
        
        if period == 'day':
            days = 1
        elif period == 'week':
            days = 7
        elif period == 'year':
            days = 365
        else:  # month
            days = 30
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Daily sales data
        sales_data = []
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=i)).date()
            daily_revenue = db.session.query(func.sum(Order.total_amount))\
                .filter(
                    Order.status == 'delivered',
                    func.date(Order.created_at) == date
                ).scalar() or 0
            
            daily_orders = Order.query.filter(
                func.date(Order.created_at) == date
            ).count()
            
            sales_data.append({
                'date': date.isoformat(),
                'revenue': float(daily_revenue),
                'orders': daily_orders
            })
        
        # Top selling products
        top_products = db.session.query(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.subtotal).label('total_revenue')
        ).join(OrderItem).join(Order)\
         .filter(Order.status == 'delivered')\
         .group_by(Product.id)\
         .order_by(func.sum(OrderItem.quantity).desc())\
         .limit(10).all()
        
        top_products_data = [{
            'id': p.id,
            'name': p.name,
            'total_sold': int(p.total_sold),
            'total_revenue': float(p.total_revenue)
        } for p in top_products]
        
        # Payment method breakdown
        payment_methods = db.session.query(
            Order.payment_method,
            func.count(Order.id).label('count'),
            func.sum(Order.total_amount).label('amount')
        ).filter(Order.status == 'delivered')\
         .group_by(Order.payment_method).all()
        
        payment_breakdown = [{
            'method': pm.payment_method,
            'count': pm.count,
            'amount': float(pm.amount)
        } for pm in payment_methods]
        
        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'days': days,
                'sales_data': sales_data[::-1],  # Reverse to show oldest first
                'top_products': top_products_data,
                'payment_methods': payment_breakdown
            }
        }), 200
    
    @staticmethod
    @jwt_required()
    def get_admin_users():
        """Get all users with details (admin only)"""
        if not AdminController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search')
        role = request.args.get('role')
        status = request.args.get('status')
        
        query = User.query
        
        if search:
            query = query.filter(
                User.full_name.ilike(f'%{search}%') |
                User.email.ilike(f'%{search}%') |
                User.phone.ilike(f'%{search}%')
            )
        
        if role and role != 'all':
            query = query.filter_by(role=role)
        
        if status == 'active':
            query = query.filter_by(is_active=True, is_blocked=False)
        elif status == 'blocked':
            query = query.filter_by(is_blocked=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)
        
        pagination = query.order_by(User.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
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
    
    @staticmethod
    @jwt_required()
    def toggle_user_status(user_id):
        """Block/unblock user (admin only)"""
        if not AdminController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        if user.is_admin():
            return jsonify({'success': False, 'message': 'Cannot modify admin user'}), 400
        
        data = request.get_json()
        action = data.get('action')  # 'block' or 'unblock'
        
        if action == 'block':
            user.is_blocked = True
            message = f"User {user.full_name} has been blocked"
        elif action == 'unblock':
            user.is_blocked = False
            message = f"User {user.full_name} has been unblocked"
        else:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400
        
        db.session.commit()
        
        # Send notification
        try:
            send_admin_notification(user.email, f"Your account has been {action}ed. Contact support for more information.")
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return jsonify({'success': True, 'message': message}), 200