# backend/app/extensions.py
from flask_sqlalchemy import SQLAlchemy

from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from flask_socketio import SocketIO
from celery import Celery

# Initialize extensions (without app)
db = SQLAlchemy()

jwt = JWTManager()
mail = Mail()
migrate = Migrate()
cache = Cache()
socketio = SocketIO()

# Rate limiter with custom key function
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)

# JWT callbacks - Fixed version with string handling
@jwt.user_identity_loader
def user_identity_lookup(user):
    """Load user identity from user object - returns string ID"""
    print(f"🔐 [BACKEND] user_identity_lookup called with: {user} (type: {type(user)})")
    if isinstance(user, int):
        result = str(user)
        print(f"🔐 [BACKEND] Returning string: {result}")
        return result
    if hasattr(user, 'id'):
        result = str(user.id)
        print(f"🔐 [BACKEND] Returning user.id as string: {result}")
        return result
    result = str(user)
    print(f"🔐 [BACKEND] Returning as string: {result}")
    return result

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """Look up user from JWT payload"""
    from .models import User
    identity = jwt_data["sub"]
    print(f"🔐 [BACKEND] user_lookup_callback - identity from token: {identity} (type: {type(identity)})")
    
    try:
        # Convert string to int for database lookup
        user_id = int(identity)
        user = User.query.filter_by(id=user_id).one_or_none()
        print(f"🔐 [BACKEND] User found: {user.email if user else 'None'}")
        return user
    except (ValueError, TypeError) as e:
        print(f"🔐 [BACKEND] Error converting identity to int: {e}")
        return None

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    """Handle expired token"""
    print(f"🔐 [BACKEND] Token expired")
    return {'success': False, 'message': 'Token has expired'}, 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid token"""
    print(f"🔐 [BACKEND] INVALID TOKEN: {error}")
    return {'success': False, 'message': f'Invalid token'}, 401

@jwt.unauthorized_loader
def unauthorized_callback(error):
    """Handle missing token"""
    print(f"🔐 [BACKEND] UNAUTHORIZED - Missing token: {error}")
    return {'success': False, 'message': 'Authorization token is missing'}, 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_data):
    """Handle revoked token"""
    print("🔐 [BACKEND] Token revoked")
    return {'success': False, 'message': 'Token has been revoked'}, 401

# Celery instance
celery = Celery(__name__)

# Helper functions
def init_extensions(app):
    """Initialize all extensions with app"""
    db.init_app(app)
    ma.init_app(app)  # This will work now because ma was initialized with db
    jwt.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    cache.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Initialize Celery with app context
    celery.conf.update(app.config['CELERY_CONFIG'])
    
    # Import tasks to register them
    from .services import email_service, sms_service, whatsapp_service
