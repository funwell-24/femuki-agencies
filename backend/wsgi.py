# backend/wsgi.py
from app import create_app

# Create app instance for production WSGI server (Gunicorn, uWSGI, etc.)
app = create_app('production')

if __name__ == '__main__':
    app.run()