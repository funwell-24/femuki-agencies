# backend/app/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import re
import traceback

from ..extensions import db, limiter
from ..models import User
from ..services.email_service import send_verification_email, send_password_reset_email
from ..services.sms_service import send_sms

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)

def validate_phone(phone):
    """Validate phone number (Kenyan format)"""
    pattern = r'^(07|01|2547|2541)\d{8}$'
    return re.match(pattern, phone)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit('5 per minute')
def register():
    """User registration"""
    try:
        data = request.get_json()
        print(f"📝 Registration request received: {data.get('email')}")
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'phone', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Validate email
        if not validate_email(data['email']):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        # Validate phone
        if not validate_phone(data['phone']):
            return jsonify({'success': False, 'message': 'Invalid phone number'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        if User.query.filter_by(phone=data['phone']).first():
            return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
        
        # Create user
        user = User(
            full_name=data['full_name'],
            email=data['email'],
            phone=data['phone'],
            role='customer',
            is_active=True,
            email_verified=False
        )
        user.password = data['password']
        
        # Generate verification token
        verification_token = user.generate_verification_token()
        
        db.session.add(user)
        db.session.commit()
        print(f"✅ User created successfully with ID: {user.id}")
        
        # Send verification email (don't let it block registration)
        try:
            send_verification_email(user.email, verification_token, user.full_name)
        except Exception as e:
            print(f"⚠️ Failed to send verification email: {e}")
        
        # Send welcome SMS (don't let it block registration)
        try:
            send_sms(user.phone, f"Welcome to Femuki Agencies, {user.full_name}! Your account has been created successfully.")
        except Exception as e:
            print(f"⚠️ Failed to send welcome SMS: {e}")
        
        # Create tokens - Convert ID to string
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Return consistent user data
        user_data = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'is_active': user.is_active,
            'email_verified': user.email_verified
        }
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Please verify your email.',
            'data': {
                'token': access_token,
                'refresh_token': refresh_token,
                'user': user_data
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
@limiter.limit('10 per minute')
def login():
    """User login"""
    try:
        data = request.get_json()
        print(f"🔐 Login request for: {data.get('email')}")
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            print(f"❌ User not found: {data['email']}")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not user.verify_password(data['password']):
            print(f"❌ Invalid password for: {data['email']}")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'success': False, 'message': 'Account is deactivated'}), 401
        
        if user.is_blocked:
            return jsonify({'success': False, 'message': 'Account is blocked. Contact support.'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        print(f"✅ User logged in: {user.email} (ID: {user.id})")
        
        # Create tokens - Convert ID to string
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Return user data without any circular references
        user_data = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'is_active': user.is_active,
            'email_verified': user.email_verified,
            'address': user.address,
            'city': user.city,
            'county': user.county,
            'avatar_url': user.avatar_url,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        }
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'token': access_token,
                'refresh_token': refresh_token,
                'user': user_data
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))
    
    return jsonify({
        'success': True,
        'data': {'token': access_token}
    }), 200

@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify user email"""
    user = User.query.filter_by(verification_token=token).first()
    
    if not user:
        return jsonify({'success': False, 'message': 'Invalid verification token'}), 400
    
    user.email_verified = True
    user.verification_token = None
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Email verified successfully'
    }), 200

@auth_bp.route('/resend-verification', methods=['POST'])
@limiter.limit('3 per hour')
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if user.email_verified:
        return jsonify({'success': False, 'message': 'Email already verified'}), 400
    
    verification_token = user.generate_verification_token()
    db.session.commit()
    
    try:
        send_verification_email(user.email, verification_token, user.full_name)
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return jsonify({'success': False, 'message': 'Failed to send verification email'}), 500
    
    return jsonify({'success': True, 'message': 'Verification email sent'}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit('5 per hour')
def forgot_password():
    """Send password reset link"""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'success': True, 'message': 'If email exists, reset link sent'}), 200
    
    reset_token = user.generate_reset_token()
    db.session.commit()
    
    try:
        send_password_reset_email(user.email, reset_token, user.full_name)
    except Exception as e:
        print(f"Failed to send reset email: {e}")
        return jsonify({'success': False, 'message': 'Failed to send reset email'}), 500
    
    return jsonify({'success': True, 'message': 'Password reset link sent'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({'success': False, 'message': 'Token and password required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or user.reset_token_expiry < datetime.utcnow():
        return jsonify({'success': False, 'message': 'Invalid or expired token'}), 400
    
    user.password = new_password
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Password reset successful'}), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password (authenticated)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'Current and new password required'}), 400
    
    if not user.verify_password(current_password):
        return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
    
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    if current_password == new_password:
        return jsonify({'success': False, 'message': 'New password must be different from current password'}), 400
    
    user.password = new_password
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Password changed successfully'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        print(f"🔐 Profile requested for user_id: {user_id}")
        
        # Convert string ID to integer if needed
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        user = User.query.get(user_id)
        print(f"🔐 User found: {user.email if user else 'None'}")
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({'success': True, 'data': user.to_dict()}), 200
    except Exception as e:
        print(f"❌ Profile error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = get_jwt_identity()
    
    # Convert string ID to integer if needed
    if isinstance(user_id, str):
        user_id = int(user_id)
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    data = request.get_json()
    
    if data.get('full_name'):
        user.full_name = data['full_name']
    
    if data.get('phone'):
        if validate_phone(data['phone']):
            existing = User.query.filter_by(phone=data['phone']).first()
            if existing and existing.id != user_id:
                return jsonify({'success': False, 'message': 'Phone number already in use'}), 400
            user.phone = data['phone']
        else:
            return jsonify({'success': False, 'message': 'Invalid phone number format'}), 400
    
    if data.get('address'):
        user.address = data['address']
    
    if data.get('city'):
        user.city = data['city']
    
    if data.get('county'):
        user.county = data['county']
    
    if data.get('zip_code'):
        user.zip_code = data['zip_code']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'data': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout (client should discard token)"""
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200