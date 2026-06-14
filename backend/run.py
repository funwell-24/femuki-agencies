# backend/run.py
import os
from app import create_app
from app.extensions import socketio

# Create app instance
app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Run with SocketIO for real-time features
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=app.config['DEBUG'],
        allow_unsafe_werkzeug=True  # Only for development
    )