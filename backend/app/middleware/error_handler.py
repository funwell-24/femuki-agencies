# backend/app/middleware/error_handler.py
from functools import wraps
from flask import request, jsonify, current_app
import traceback
import logging
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

class ErrorHandler:
    """Centralized error handling middleware"""
    
    @staticmethod
    def handle_exceptions(f):
        """Decorator to handle exceptions in routes"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                return f(*args, **kwargs)
            except Exception as e:
                return ErrorHandler.handle_error(e)
        
        return decorated_function
    
    @staticmethod
    def handle_error(error):
        """Handle different types of errors"""
        # Log the error
        ErrorHandler.log_error(error)
        
        # Database errors
        from sqlalchemy.exc import SQLAlchemyError, IntegrityError
        if isinstance(error, IntegrityError):
            return jsonify({
                'success': False,
                'message': 'Database integrity error. Duplicate entry or invalid reference.',
                'error_type': 'integrity_error'
            }), 409
        
        if isinstance(error, SQLAlchemyError):
            return jsonify({
                'success': False,
                'message': 'Database error occurred. Please try again.',
                'error_type': 'database_error'
            }), 500
        
        # Validation errors
        from marshmallow import ValidationError
        if isinstance(error, ValidationError):
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': error.messages,
                'error_type': 'validation_error'
            }), 422
        
        # JWT errors
        from flask_jwt_extended.exceptions import JWTExtendedException
        if isinstance(error, JWTExtendedException):
            return jsonify({
                'success': False,
                'message': 'Invalid or expired token',
                'error_type': 'jwt_error'
            }), 401
        
        # ValueError (common)
        if isinstance(error, ValueError):
            return jsonify({
                'success': False,
                'message': str(error),
                'error_type': 'value_error'
            }), 400
        
        # Default error
        return jsonify({
            'success': False,
            'message': 'An unexpected error occurred. Our team has been notified.',
            'error_type': 'internal_error'
        }), 500
    
    @staticmethod
    def log_error(error):
        """Log error with details"""
        # Get traceback
        tb = traceback.format_exc()
        
        # Log to file
        logger.error(f"Error: {str(error)}")
        logger.error(f"Traceback: {tb}")
        
        # Log request details
        logger.error(f"Request: {request.method} {request.path}")
        logger.error(f"IP: {request.remote_addr}")
        
        if request.is_json and request.json:
            # Sanitize sensitive data
            sensitive_fields = ['password', 'token', 'api_key', 'authorization']
            safe_data = {k: v for k, v in request.json.items() if k.lower() not in sensitive_fields}
            logger.error(f"Request Data: {safe_data}")
        
        # In production, send to error tracking service (Sentry, etc.)
        if not current_app.debug:
            ErrorHandler.send_to_error_tracking(error, tb)
    
    @staticmethod
    def send_to_error_tracking(error, traceback):
        """Send error to external tracking service (Sentry, etc.)"""
        try:
            # Example: Sentry integration
            # from sentry_sdk import capture_exception
            # capture_exception(error)
            pass
        except Exception:
            pass

class ValidationErrorHandler:
    """Handle validation errors from request data"""
    
    @staticmethod
    def validate_required_fields(data, required_fields):
        """Validate that required fields are present"""
        missing = [field for field in required_fields if not data.get(field)]
        
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        
        return True
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
        
        return True
    
    @staticmethod
    def validate_phone(phone):
        """Validate Kenyan phone number"""
        import re
        pattern = r'^(07|01|2547|2541)\d{8}$'
        
        if not re.match(pattern, str(phone)):
            raise ValueError("Invalid phone number. Use format: 07XXXXXXXX or 2547XXXXXXXX")
        
        return True
    
    @staticmethod
    def validate_password(password, min_length=6):
        """Validate password strength"""
        if len(password) < min_length:
            raise ValueError(f"Password must be at least {min_length} characters")
        
        # Optional: Add more password requirements
        # if not re.search(r'[A-Z]', password):
        #     raise ValueError("Password must contain at least one uppercase letter")
        # if not re.search(r'[0-9]', password):
        #     raise ValueError("Password must contain at least one number")
        
        return True
    
    @staticmethod
    def validate_price(price):
        """Validate price value"""
        try:
            price = float(price)
            if price < 0:
                raise ValueError("Price cannot be negative")
            if price > 10000000:  # 10 million max
                raise ValueError("Price exceeds maximum allowed")
            return True
        except (TypeError, ValueError):
            raise ValueError("Invalid price format")

class RateLimitErrorHandler:
    """Handle rate limit exceeded errors"""
    
    @staticmethod
    def handle_rate_limit(error):
        """Return formatted rate limit response"""
        return jsonify({
            'success': False,
            'message': 'Too many requests. Please slow down.',
            'error_type': 'rate_limit_exceeded',
            'retry_after': getattr(error, 'retry_after', 60)
        }), 429

class RequestValidationMiddleware:
    """Middleware for request validation"""
    
    @staticmethod
    def validate_content_type(f):
        """Ensure request has correct content type"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'PATCH']:
                if not request.is_json and not request.files:
                    return jsonify({
                        'success': False,
                        'message': 'Content-Type must be application/json or multipart/form-data'
                    }), 415
            
            return f(*args, **kwargs)
        
        return decorated_function
    
    @staticmethod
    def sanitize_input(f):
        """Sanitize input data to prevent XSS"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.is_json and request.json:
                request.json = RequestValidationMiddleware._sanitize_dict(request.json)
            
            if request.args:
                request.args = RequestValidationMiddleware._sanitize_dict(request.args)
            
            return f(*args, **kwargs)
        
        return decorated_function
    
    @staticmethod
    def _sanitize_dict(data):
        """Recursively sanitize dictionary values"""
        if isinstance(data, dict):
            return {k: RequestValidationMiddleware._sanitize_value(v) for k, v in data.items()}
        return data
    
    @staticmethod
    def _sanitize_value(value):
        """Sanitize a single value"""
        if isinstance(value, str):
            # Remove HTML tags and escape special characters
            import html
            return html.escape(value.strip())
        return value

# Initialize error handler instance
error_handler = ErrorHandler()
validation_handler = ValidationErrorHandler()
rate_limit_error_handler = RateLimitErrorHandler()
request_validation = RequestValidationMiddleware()

# Convenience decorators
def handle_errors(f):
    """Decorator to automatically handle errors in routes"""
    return error_handler.handle_exceptions(f)

def validate_json(schema=None):
    """Decorator to validate JSON against schema"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'message': 'Request must be JSON'
                }), 400
            
            if schema:
                try:
                    validated_data = schema.load(request.json)
                    request.validated_data = validated_data
                except Exception as e:
                    return jsonify({
                        'success': False,
                        'message': 'Validation error',
                        'errors': str(e)
                    }), 422
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator