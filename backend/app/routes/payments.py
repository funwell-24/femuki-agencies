# backend/app/routes/payments.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import json
import base64
from datetime import datetime

from ..extensions import db
from ..models import Order

payments_bp = Blueprint('payments', __name__)

def get_mpesa_access_token():
    """Get M-Pesa API access token"""
    consumer_key = current_app.config['MPESA_CONSUMER_KEY']
    consumer_secret = current_app.config['MPESA_CONSUMER_SECRET']
    
    api_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    
    response = requests.get(
        api_url,
        auth=requests.auth.HTTPBasicAuth(consumer_key, consumer_secret)
    )
    
    if response.status_code == 200:
        return response.json().get('access_token')
    return None

def generate_password(shortcode, passkey):
    """Generate M-Pesa password"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password_str = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode('utf-8')
    return password, timestamp

@payments_bp.route('/mpesa/stkpush', methods=['POST'])
@jwt_required()
def mpesa_stkpush():
    """Initiate M-Pesa STK Push payment"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    order_id = data.get('order_id')
    phone_number = data.get('phone_number')
    amount = data.get('amount')
    
    if not order_id or not phone_number or not amount:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    order = Order.query.get(order_id)
    
    if not order or order.user_id != user_id:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    
    # Format phone number (remove leading 0 or +254)
    phone = phone_number.replace('+', '').replace('-', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif not phone.startswith('254'):
        phone = '254' + phone
    
    # Get M-Pesa access token
    access_token = get_mpesa_access_token()
    
    if not access_token:
        return jsonify({'success': False, 'message': 'Payment service unavailable'}), 503
    
    # Prepare STK Push request
    shortcode = current_app.config['MPESA_SHORTCODE']
    passkey = current_app.config['MPESA_PASSKEY']
    callback_url = current_app.config['MPESA_CALLBACK_URL']
    
    password, timestamp = generate_password(shortcode, passkey)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'BusinessShortCode': shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': int(amount),
        'PartyA': phone,
        'PartyB': shortcode,
        'PhoneNumber': phone,
        'CallBackURL': callback_url,
        'AccountReference': order.order_number,
        'TransactionDesc': f'Payment for order {order.order_number}'
    }
    
    api_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        result = response.json()
        
        if response.status_code == 200:
            # Store checkout request ID
            order.mpesa_checkout_request_id = result.get('CheckoutRequestID')
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'STK Push sent. Please check your phone to complete payment.',
                'data': {
                    'checkout_request_id': result.get('CheckoutRequestID'),
                    'response_code': result.get('ResponseCode'),
                    'response_description': result.get('ResponseDescription')
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result.get('errorMessage', 'Payment initiation failed')
            }), 400
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@payments_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """M-Pesa STK Push callback URL"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data received'}), 400
    
    # Process callback data
    body = data.get('Body', {})
    stk_callback = body.get('stkCallback', {})
    
    result_code = stk_callback.get('ResultCode')
    checkout_request_id = stk_callback.get('CheckoutRequestID')
    result_desc = stk_callback.get('ResultDesc')
    
    # Find order by checkout request ID
    order = Order.query.filter_by(mpesa_checkout_request_id=checkout_request_id).first()
    
    if order:
        if result_code == 0:  # Success
            # Get transaction details
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            transaction_id = None
            amount = None
            
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    transaction_id = item.get('Value')
                elif item.get('Name') == 'Amount':
                    amount = item.get('Value')
            
            # Update order payment status
            order.update_payment_status('paid', transaction_id)
            order.update_status('confirmed')
            
            # Send confirmation
            print(f"Payment received for order {order.order_number}: KSH {amount}")
            
        else:  # Failed
            order.update_payment_status('failed')
            print(f"Payment failed for order {order.order_number}: {result_desc}")
    
    return jsonify({'success': True}), 200

@payments_bp.route('/mpesa/status/<checkout_request_id>', methods=['GET'])
@jwt_required()
def check_payment_status(checkout_request_id):
    """Check M-Pesa payment status"""
    access_token = get_mpesa_access_token()
    
    if not access_token:
        return jsonify({'success': False, 'message': 'Payment service unavailable'}), 503
    
    shortcode = current_app.config['MPESA_SHORTCODE']
    passkey = current_app.config['MPESA_PASSKEY']
    password, timestamp = generate_password(shortcode, passkey)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'BusinessShortCode': shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'CheckoutRequestID': checkout_request_id
    }
    
    api_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        result = response.json()
        
        return jsonify({
            'success': True,
            'data': {
                'result_code': result.get('ResultCode'),
                'result_desc': result.get('ResultDesc')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """Get available payment methods"""
    methods = [
        {
            'id': 'mpesa',
            'name': 'M-Pesa',
            'icon': 'smartphone',
            'description': 'Pay using M-Pesa STK Push'
        },
        {
            'id': 'cash_on_delivery',
            'name': 'Cash on Delivery',
            'icon': 'truck',
            'description': 'Pay when you receive your items'
        },
        {
            'id': 'bank_transfer',
            'name': 'Bank Transfer',
            'icon': 'building',
            'description': 'Direct bank transfer to our account'
        }
    ]
    
    return jsonify({'success': True, 'data': methods}), 200

@payments_bp.route('/bank-details', methods=['GET'])
def get_bank_details():
    """Get bank account details for transfers"""
    bank_details = {
        'bank_name': 'Equity Bank Kenya',
        'account_name': 'Femuki Agencies',
        'account_number': '1234567890',
        'branch': 'Nairobi CBD',
        'swift_code': 'EQBLKENA'
    }
    
    return jsonify({'success': True, 'data': bank_details}), 200