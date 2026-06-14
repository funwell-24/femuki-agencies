# backend/app/middleware/admin_middleware.py
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models import User

class AdminMiddleware:
    """Admin-specific middleware for protecting admin routes"""
    
    @staticmethod
    def require_admin(f):
        """Decorator to require admin access"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                
                if not user:
                    return jsonify({
                        'success': False,
                        'message': 'User not found'
                    }), 401
                
                if not user.is_admin():
                    return jsonify({
                        'success': False,
                        'message': 'Admin access required'
                    }), 403
                
                if not user.is_active:
                    return jsonify({
                        'success': False,
                        'message': 'Account is deactivated'
                    }), 401
                
                if user.is_blocked:
                    return jsonify({
                        'success': False,
                        'message': 'Account is blocked'
                    }), 401
                
                request.current_admin = user
                request.current_admin_id = user_id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': 'Authentication required',
                    'error': str(e)
                }), 401
        
        return decorated_function
    
    @staticmethod
    def require_super_admin(f):
        """Decorator to require super admin access (highest level)"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                
                if not user:
                    return jsonify({
                        'success': False,
                        'message': 'User not found'
                    }), 401
                
                if not user.is_admin() or user.role != 'super_admin':
                    return jsonify({
                        'success': False,
                        'message': 'Super admin access required'
                    }), 403
                
                if not user.is_active:
                    return jsonify({
                        'success': False,
                        'message': 'Account is deactivated'
                    }), 401
                
                request.current_admin = user
                request.current_admin_id = user_id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': 'Authentication required',
                    'error': str(e)
                }), 401
        
        return decorated_function
    
    @staticmethod
    def admin_audit_log(f):
        """Decorator to log admin actions"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Log before request
            admin_user = getattr(request, 'current_admin', None)
            if admin_user:
                print(f"\n📋 ADMIN AUDIT:")
                print(f"   Admin: {admin_user.email} ({admin_user.id})")
                print(f"   Action: {request.method} {request.path}")
                print(f"   IP: {request.remote_addr}")
                print(f"   Timestamp: {__import__('datetime').datetime.utcnow()}")
                
                if request.is_json and request.json:
                    # Don't log sensitive data
                    sensitive_fields = ['password', 'token', 'api_key']
                    safe_data = {k: v for k, v in request.json.items() if k not in sensitive_fields}
                    if safe_data:
                        print(f"   Data: {safe_data}")
            
            # Execute request
            response = f(*args, **kwargs)
            
            # Log response
            if admin_user:
                print(f"   Response Status: {response[1] if isinstance(response, tuple) else 200}")
                print("-" * 40)
            
            return response
        
        return decorated_function

class AdminPermissionMiddleware:
    """Fine-grained admin permission checking"""
    
    PERMISSIONS = {
        'view_products': ['admin', 'super_admin'],
        'edit_products': ['admin', 'super_admin'],
        'delete_products': ['admin', 'super_admin'],
        'view_orders': ['admin', 'super_admin'],
        'edit_orders': ['admin', 'super_admin'],
        'view_users': ['admin', 'super_admin'],
        'edit_users': ['admin', 'super_admin'],
        'block_users': ['admin', 'super_admin'],
        'view_submissions': ['admin', 'super_admin'],
        'review_submissions': ['admin', 'super_admin'],
        'view_testimonials': ['admin', 'super_admin'],
        'moderate_testimonials': ['admin', 'super_admin'],
        'view_analytics': ['admin', 'super_admin'],
        'manage_categories': ['admin', 'super_admin'],
        'manage_settings': ['super_admin'],
        'manage_admins': ['super_admin'],
        'view_logs': ['super_admin']
    }
    
    @classmethod
    def has_permission(cls, user, permission):
        """Check if user has specific permission"""
        if not user or not user.is_admin():
            return False
        
        allowed_roles = cls.PERMISSIONS.get(permission, [])
        return user.role in allowed_roles
    
    @classmethod
    def require_permission(cls, permission):
        """Decorator to require specific permission"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                try:
                    verify_jwt_in_request()
                    user_id = get_jwt_identity()
                    user = User.query.get(user_id)
                    
                    if not user:
                        return jsonify({
                            'success': False,
                            'message': 'User not found'
                        }), 401
                    
                    if not cls.has_permission(user, permission):
                        return jsonify({
                            'success': False,
                            'message': f'Permission denied: {permission} required'
                        }), 403
                    
                    return f(*args, **kwargs)
                    
                except Exception as e:
                    return jsonify({
                        'success': False,
                        'message': 'Authentication required',
                        'error': str(e)
                    }), 401
            
            return decorated_function
        return decorator

class RateLimitAdminMiddleware:
    """Special rate limiting for admin routes"""
    
    def __init__(self):
        self.admin_requests = {}
    
    def check_admin_rate_limit(self, admin_id, endpoint):
        """Check rate limit for admin actions"""
        key = f"admin:{admin_id}:{endpoint}"
        
        # Admin rate limits
        limits = {
            'bulk_action': 10,  # 10 per hour
            'delete': 50,       # 50 per hour
            'default': 200      # 200 per hour
        }
        
        # Determine limit type
        if 'bulk' in endpoint:
            limit = limits['bulk_action']
        elif 'delete' in endpoint:
            limit = limits['delete']
        else:
            limit = limits['default']
        
        # Initialize
        if key not in self.admin_requests:
            self.admin_requests[key] = {'count': 0, 'reset': self._get_reset_time()}
        
        # Check reset
        if self.admin_requests[key]['reset'] < self._current_timestamp():
            self.admin_requests[key] = {'count': 0, 'reset': self._get_reset_time()}
        
        # Increment
        self.admin_requests[key]['count'] += 1
        
        # Check limit
        if self.admin_requests[key]['count'] > limit:
            return False, self.admin_requests[key]['reset'] - self._current_timestamp()
        
        return True, 0
    
    def _get_reset_time(self):
        """Get reset timestamp (1 hour from now)"""
        import time
        return int(time.time()) + 3600
    
    def _current_timestamp(self):
        """Get current timestamp"""
        import time
        return int(time.time())

# Initialize middleware instances
admin_middleware = AdminMiddleware()
admin_permission_middleware = AdminPermissionMiddleware()
rate_limit_admin = RateLimitAdminMiddleware()