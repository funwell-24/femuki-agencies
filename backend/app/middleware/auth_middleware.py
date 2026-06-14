# backend/app/middleware/auth_middleware.py
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models import User
import re

def jwt_required_optional(f):
    """JWT required decorator that doesn't fail if no token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            return f(*args, **kwargs)
        except Exception:
            return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current user from JWT token"""
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(user_id)
    except Exception:
        return None

def get_current_user_id():
    """Get current user ID from JWT token"""
    try:
        verify_jwt_in_request()
        return get_jwt_identity()
    except Exception:
        return None

class AuthMiddleware:
    """Authentication middleware for protecting routes"""
    
    @staticmethod
    def require_auth(f):
        """Decorator to require authentication"""
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
                
                if not user.is_active:
                    return jsonify({
                        'success': False,
                        'message': 'Account is deactivated'
                    }), 401
                
                if user.is_blocked:
                    return jsonify({
                        'success': False,
                        'message': 'Account is blocked. Please contact support.'
                    }), 401
                
                # Add user to request context
                request.current_user = user
                request.current_user_id = user_id
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'message': 'Authentication required',
                    'error': str(e)
                }), 401
        
        return decorated_function
    
    @staticmethod
    def optional_auth(f):
        """Decorator for optional authentication"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    user = User.query.get(user_id)
                    if user and user.is_active and not user.is_blocked:
                        request.current_user = user
                        request.current_user_id = user_id
            except Exception:
                pass
            
            return f(*args, **kwargs)
        
        return decorated_function

class TokenBlacklist:
    """Simple token blacklist (use Redis in production)"""
    
    _blacklist = set()
    
    @classmethod
    def add_token(cls, jti):
        """Add token to blacklist"""
        cls._blacklist.add(jti)
    
    @classmethod
    def is_blacklisted(cls, jti):
        """Check if token is blacklisted"""
        return jti in cls._blacklist
    
    @classmethod
    def clear_blacklist(cls):
        """Clear blacklist (for testing)"""
        cls._blacklist.clear()

class RateLimitMiddleware:
    """Rate limiting middleware"""
    
    def __init__(self, app=None):
        self.app = app
        self.requests = {}
    
    def init_app(self, app):
        self.app = app
        app.before_request(self.before_request)
    
    def before_request(self):
        """Check rate limit before each request"""
        # Get client IP
        client_ip = request.remote_addr
        
        # Get endpoint
        endpoint = request.endpoint
        
        # Create key
        key = f"{client_ip}:{endpoint}"
        
        # Get rate limit from config
        rate_limit = self.app.config.get('RATELIMIT_DEFAULT', '100/hour')
        
        # Parse rate limit
        limit, period = self._parse_rate_limit(rate_limit)
        
        # Initialize if not exists
        if key not in self.requests:
            self.requests[key] = {'count': 0, 'reset': self._get_reset_time(period)}
        
        # Check if reset needed
        if self.requests[key]['reset'] < self._current_timestamp():
            self.requests[key] = {'count': 0, 'reset': self._get_reset_time(period)}
        
        # Increment count
        self.requests[key]['count'] += 1
        
        # Check limit
        if self.requests[key]['count'] > limit:
            return jsonify({
                'success': False,
                'message': f'Rate limit exceeded. Try again later.',
                'retry_after': self.requests[key]['reset'] - self._current_timestamp()
            }), 429
    
    def _parse_rate_limit(self, rate_limit):
        """Parse rate limit string (e.g., '100/hour')"""
        parts = rate_limit.split('/')
        limit = int(parts[0])
        period = parts[1]
        
        period_seconds = {
            'second': 1,
            'minute': 60,
            'hour': 3600,
            'day': 86400
        }
        
        return limit, period_seconds.get(period, 3600)
    
    def _get_reset_time(self, period):
        """Get reset timestamp"""
        return self._current_timestamp() + period
    
    def _current_timestamp(self):
        """Get current timestamp"""
        import time
        return int(time.time())

class CORSMiddleware:
    """CORS middleware for handling cross-origin requests"""
    
    def __init__(self, app=None):
        self.app = app
    
    def init_app(self, app):
        self.app = app
        app.after_request(self.after_request)
    
    def after_request(self, response):
        """Add CORS headers to response"""
        origin = request.headers.get('Origin')
        
        allowed_origins = self.app.config.get('CORS_ORIGINS', [])
        
        if origin in allowed_origins or '*' in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin or '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        return response

class SecurityHeadersMiddleware:
    """Add security headers to responses"""
    
    def __init__(self, app=None):
        self.app = app
    
    def init_app(self, app):
        self.app = app
        app.after_request(self.after_request)
    
    def after_request(self, response):
        """Add security headers"""
        # Prevent MIME sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # HSTS (enable in production only)
        if not self.app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Content Security Policy (customize as needed)
        # response.headers['Content-Security-Policy'] = "default-src 'self'"
        
        return response

class RequestLoggerMiddleware:
    """Log all requests for debugging"""
    
    def __init__(self, app=None):
        self.app = app
    
    def init_app(self, app):
        self.app = app
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Log incoming request"""
        if self.app.debug:
            print(f"\n{'='*60}")
            print(f"📥 REQUEST: {request.method} {request.path}")
            print(f"📍 IP: {request.remote_addr}")
            print(f"📦 Headers: {dict(request.headers)}")
            if request.args:
                print(f"🔍 Query Params: {dict(request.args)}")
            if request.is_json and request.json:
                # Hide sensitive data
                sanitized_data = self._sanitize_data(request.json)
                print(f"📄 Body: {sanitized_data}")
    
    def after_request(self, response):
        """Log outgoing response"""
        if self.app.debug:
            print(f"📤 RESPONSE: {response.status_code}")
            print(f"{'='*60}\n")
        return response
    
    def _sanitize_data(self, data):
        """Remove sensitive information from logs"""
        if isinstance(data, dict):
            sanitized = data.copy()
            sensitive_fields = ['password', 'current_password', 'new_password', 'token', 'api_key']
            for field in sensitive_fields:
                if field in sanitized:
                    sanitized[field] = '********'
            return sanitized
        return data

class MaintenanceMiddleware:
    """Maintenance mode middleware"""
    
    def __init__(self, app=None):
        self.app = app
        self.maintenance_mode = False
    
    def init_app(self, app):
        self.app = app
        app.before_request(self.before_request)
    
    def enable_maintenance(self):
        """Enable maintenance mode"""
        self.maintenance_mode = True
    
    def disable_maintenance(self):
        """Disable maintenance mode"""
        self.maintenance_mode = False
    
    def before_request(self):
        """Check if maintenance mode is enabled"""
        if self.maintenance_mode:
            # Allow admin access
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                if user and user.is_admin():
                    return None
            except Exception:
                pass
            
            # Exclude certain endpoints
            excluded_paths = ['/health', '/api/health']
            if request.path in excluded_paths:
                return None
            
            return jsonify({
                'success': False,
                'message': 'Site is under maintenance. Please check back later.',
                'maintenance': True
            }), 503

class IPWhitelistMiddleware:
    """IP whitelist middleware for admin routes"""
    
    def __init__(self, app=None):
        self.app = app
        self.whitelist = set()
    
    def init_app(self, app):
        self.app = app
        self.whitelist = set(app.config.get('IP_WHITELIST', []))
        app.before_request(self.before_request)
    
    def add_ip(self, ip):
        """Add IP to whitelist"""
        self.whitelist.add(ip)
    
    def remove_ip(self, ip):
        """Remove IP from whitelist"""
        self.whitelist.discard(ip)
    
    def before_request(self):
        """Check if IP is whitelisted for admin routes"""
        if request.path.startswith('/api/admin'):
            # Skip if no whitelist configured
            if not self.whitelist:
                return None
            
            client_ip = request.remote_addr
            
            # Allow localhost in development
            if self.app.debug and client_ip in ['127.0.0.1', 'localhost']:
                return None
            
            if client_ip not in self.whitelist:
                return jsonify({
                    'success': False,
                    'message': 'Access denied. IP not whitelisted.'
                }), 403
        
        return None

# Initialize middleware instances
auth_middleware = AuthMiddleware()
rate_limit_middleware = RateLimitMiddleware()
cors_middleware = CORSMiddleware()
security_headers_middleware = SecurityHeadersMiddleware()
request_logger_middleware = RequestLoggerMiddleware()
maintenance_middleware = MaintenanceMiddleware()
ip_whitelist_middleware = IPWhitelistMiddleware()