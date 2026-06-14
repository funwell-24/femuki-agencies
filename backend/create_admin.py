# backend/create_admin.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Check if admin already exists
    admin = User.query.filter_by(role='admin').first()
    
    if admin:
        print(f"Admin already exists: {admin.email}")
        overwrite = input("Do you want to create another admin? (y/n): ")
        if overwrite.lower() != 'y':
            print("Exiting...")
            sys.exit(0)
    
    # Create admin user
    full_name = input("Enter admin full name [Admin User]: ") or "Admin User"
    email = input("Enter admin email [admin@femuki.com]: ") or "admin@femuki.com"
    phone = input("Enter admin phone [0797717981]: ") or "0797717981"
    password = input("Enter admin password [Admin@123]: ") or "Admin@123"
    
    admin_user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        role='admin',
        is_active=True,
        email_verified=True
    )
    admin_user.password = password
    
    db.session.add(admin_user)
    db.session.commit()
    
    print(f"\n✅ Admin user created successfully!")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"   Role: admin")