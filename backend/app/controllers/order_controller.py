# backend/app/controllers/order_controller.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from ..extensions import db
from ..models import Order, OrderItem, Product, User, Cart
from ..services.email_service import send_order_confirmation, send_order_status_update
from ..services.sms_service import send_sms

class OrderController:
    """Order Management Controller"""
    
    @staticmethod
    def is_admin():
        """Check if current user is admin"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        return user and user.is_admin()
    
    @staticmethod
    @jwt_required()
    def create_order():
        """Create new order from cart"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        
        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if not cart or cart.items.count() == 0:
            return jsonify({'success': False, 'message': 'Your cart is empty'}), 400
        
        # Validate required fields
        required_fields = ['delivery_address', 'delivery_phone', 'payment_method']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Validate payment method
        valid_payment_methods = ['mpesa', 'bank_transfer', 'cash_on_delivery']
        if data['payment_method'] not in valid_payment_methods:
            return jsonify({'success': False, 'message': 'Invalid payment method'}), 400
        
        # Calculate totals
        subtotal = cart.get_subtotal()
        shipping_cost = cart.get_shipping_cost()
        tax_amount = cart.get_tax_amount()
        total_amount = subtotal + shipping_cost + tax_amount
        
        # Create order
        order = Order(
            user_id=user_id,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            total_amount=total_amount,
            payment_method=data['payment_method'],
            delivery_address=data['delivery_address'],
            delivery_phone=data['delivery_phone'],
            delivery_notes=data.get('delivery_notes', '')
        )
        
        db.session.add(order)
        db.session.flush()
        
        # Create order items from cart and update inventory
        for cart_item in cart.items:
            product = cart_item.product
            
            if product.quantity < cart_item.quantity:
                db.session.rollback()
                return jsonify({
                    'success': False,
                    'message': f'Insufficient stock for {product.name}. Only {product.quantity} available.'
                }), 400
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_price=float(product.price),
                product_image=product.get_primary_image(),
                quantity=cart_item.quantity,
                price_at_time=float(product.price)
            )
            
            db.session.add(order_item)
            
            # Decrease product quantity
            product.decrement_quantity(cart_item.quantity)
        
        # Clear cart
        cart.clear()
        
        db.session.commit()
        
        # Send confirmation emails and SMS
        try:
            send_order_confirmation(user.email, order)
            send_sms(user.phone, 
                     f"Femuki Agencies: Order #{order.order_number} placed successfully! Total: KSH {order.total_amount:,.0f}. We'll notify you when it ships.")
        except Exception as e:
            print(f"Failed to send notifications: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'data': order.to_dict()
        }), 201
    
    @staticmethod
    @jwt_required()
    def get_orders():
        """Get user's orders"""
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 50)
        
        pagination = Order.query.filter_by(user_id=user_id)\
            .order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'data': {
                'orders': [order.to_dict() for order in pagination.items],
                'pagination': {
                    'page': pagination.page,
                    'pages': pagination.pages,
                    'total': pagination.total,
                    'per_page': pagination.per_page,
                    'has_next': pagination.has_next
                }
            }
        }), 200
    
    @staticmethod
    @jwt_required()
    def get_order(order_id):
        """Get single order"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        if order.user_id != user_id and not user.is_admin():
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
        return jsonify({'success': True, 'data': order.to_dict()}), 200
    
    @staticmethod
    def track_order(order_number):
        """Track order by number (public)"""
        order = Order.query.filter_by(order_number=order_number).first()
        
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        return jsonify({'success': True, 'data': order.to_dict(include_items=False)}), 200
    
    @staticmethod
    @jwt_required()
    def cancel_order(order_id):
        """Cancel order"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        if order.user_id != user_id and not user.is_admin():
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        if order.status not in ['pending', 'confirmed']:
            return jsonify({'success': False, 'message': f'Order cannot be cancelled. Current status: {order.status}'}), 400
        
        data = request.get_json()
        reason = data.get('reason', 'No reason provided')
        
        order.update_status('cancelled')
        
        # Restore product quantities
        for item in order.items:
            product = Product.query.get(item.product_id)
            if product:
                product.quantity += item.quantity
                if product.status == 'sold' and product.quantity > 0:
                    product.status = 'available'
        
        db.session.commit()
        
        # Send cancellation notification
        try:
            user = User.query.get(order.user_id)
            send_sms(user.phone, 
                     f"Femuki Agencies: Order #{order.order_number} has been cancelled. Reason: {reason}")
        except Exception as e:
            print(f"Failed to send cancellation SMS: {e}")
        
        return jsonify({'success': True, 'message': 'Order cancelled successfully'}), 200
    
    # Admin Methods
    @staticmethod
    @jwt_required()
    def admin_get_orders():
        """Get all orders (admin only)"""
        if not OrderController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = Order.query
        
        if status and status != 'all':
            query = query.filter_by(status=status)
        
        if search:
            query = query.filter(Order.order_number.ilike(f'%{search}%'))
        
        pagination = query.order_by(Order.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'success': True,
            'data': {
                'orders': [order.to_dict() for order in pagination.items],
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
    def update_order_status(order_id):
        """Update order status (admin only)"""
        if not OrderController.is_admin():
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        notes = data.get('notes', '')
        
        valid_statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
        order.update_status(new_status)
        
        if data.get('tracking_number'):
            order.tracking_number = data['tracking_number']
        
        if data.get('courier_name'):
            order.courier_name = data['courier_name']
        
        if data.get('courier_tracking_url'):
            order.courier_tracking_url = data['courier_tracking_url']
        
        db.session.commit()
        
        # Send status update notification
        try:
            user = User.query.get(order.user_id)
            send_order_status_update(user.email, order, new_status, notes)
            send_sms(user.phone, 
                     f"Femuki Agencies: Order #{order.order_number} status updated to {new_status.upper()}. {notes}")
        except Exception as e:
            print(f"Failed to send status update: {e}")
        
        return jsonify({
            'success': True,
            'message': f'Order status updated to {new_status}',
            'data': order.to_dict()
        }), 200