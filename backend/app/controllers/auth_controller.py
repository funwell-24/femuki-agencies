# backend/app/controllers/auth_controller.py
from flask import request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime
import re

from ..extensions import db
from ..models import User
from ..services.email_service import send_verification_email, send_password_reset_email, send_welcome_email
from ..services.sms_service import send_sms

class AuthController:
    """Authentication and User Management Controller"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email)
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number (Kenyan format)"""
        pattern = r'^(07|01|2547|2541)\d{8}$'
        return re.match(pattern, phone)
    
    @staticmethod
    def register():
        """User registration"""
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['full_name', 'email', 'phone', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Validate email
        if not AuthController.validate_email(data['email']):
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        # Validate phone
        if not AuthController.validate_phone(data['phone']):
            return jsonify({'success': False, 'message': 'Invalid phone number. Use format: 07XXXXXXXX or 2547XXXXXXXX'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        if User.query.filter_by(phone=data['phone']).first():
            return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
        
        # Validate password strength
        if len(data['password']) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        # Create user
        user = User(
            full_name=data['full_name'],
            email=data['email'],
            phone=data['phone'],
            role='customer'
        )
        user.password = data['password']
        
        # Generate verification token
        verification_token = user.generate_verification_token()
        
        db.session.add(user)
        db.session.commit()
        
        # Send verification email
        try:
            send_verification_email(user.email, verification_token, user.full_name)
        except Exception as e:
            print(f"Failed to send verification email: {e}")
        
        # Send welcome SMS
        try:
            send_sms(user.phone, f"Welcome to Femuki Agencies, {user.full_name}! Your account has been created successfully. Shop quality household items at affordable prices.")
        except Exception as e:
            print(f"Failed to send welcome SMS: {e}")
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Please verify your email.',
            'data': {
                'token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict()
            }
        }), 201
    
    @staticmethod
    def login():
        """User login"""
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.verify_password(data['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'success': False, 'message': 'Account is deactivated. Contact support.'}), 401
        
        if user.is_blocked:
            return jsonify({'success': False, 'message': 'Account is blocked. Please contact support for assistance.'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'message': f'Welcome back, {user.full_name}!',
            'data': {
                'token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict()
            }
        }), 200
    
    @staticmethod
    @jwt_required(refresh=True)
    def refresh_token():
        """Refresh access token"""
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'data': {'token': access_token}
        }), 200
    
    @staticmethod
    def verify_email(token):
        """Verify user email"""
        user = User.query.filter_by(verification_token=token).first()
        
        if not user:
            return jsonify({'success': False, 'message': 'Invalid or expired verification token'}), 400
        
        user.email_verified = True
        user.verification_token = None
        db.session.commit()
        
        # Send welcome email after verification
        try:
            send_welcome_email(user.email, user.full_name)
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Email verified successfully! You can now start shopping.'
        }), 200
    
    @staticmethod
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
    
    @staticmethod
    def forgot_password():
        """Send password reset link"""
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Don't reveal that user doesn't exist for security
            return jsonify({'success': True, 'message': 'If your email is registered, you will receive a reset link'}), 200
        
        reset_token = user.generate_reset_token()
        db.session.commit()
        
        try:
            send_password_reset_email(user.email, reset_token, user.full_name)
        except Exception as e:
            print(f"Failed to send reset email: {e}")
            return jsonify({'success': False, 'message': 'Failed to send reset email'}), 500
        
        return jsonify({'success': True, 'message': 'Password reset link sent to your email'}), 200
    
    @staticmethod
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
            return jsonify({'success': False, 'message': 'Invalid or expired reset token'}), 400
        
        user.password = new_password
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Password reset successful. Please login with your new password.'}), 200
    
    @staticmethod
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
    
    @staticmethod
    @jwt_required()
    def get_profile():
        """Get user profile"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({'success': True, 'data': user.to_dict()}), 200
    
    @staticmethod
    @jwt_required()
    def update_profile():
        """Update user profile"""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        
        if data.get('full_name'):
            user.full_name = data['full_name']
        
        if data.get('phone'):
            if AuthController.validate_phone(data['phone']):
                # Check if phone is taken by another user
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
    
    @staticmethod
    @jwt_required()
    def logout():
        """User logout (client should discard token)"""
        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200