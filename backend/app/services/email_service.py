# backend/app/services/email_service.py
from flask_mail import Message
from flask import current_app, render_template_string
from ..extensions import mail
import threading

def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        mail.send(msg)

def send_email(subject, recipients, body_html, body_text=None):
    """Send email with HTML and plain text versions"""
    msg = Message(
        subject=subject,
        recipients=recipients if isinstance(recipients, list) else [recipients],
        html=body_html,
        body=body_text
    )
    
    # Send asynchronously
    thread = threading.Thread(target=send_async_email, args=(current_app._get_current_object(), msg))
    thread.start()
    return thread

def send_verification_email(email, token, full_name):
    """Send email verification link"""
    verification_url = f"{current_app.config.get('APP_URL', 'http://localhost:5173')}/verify-email/{token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Verify Your Email - Femuki Agencies</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .button {{ display: inline-block; padding: 12px 24px; background: #ff8c00; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Femuki Agencies</h1>
                <p>Quality Household Items</p>
            </div>
            <div class="content">
                <h2>Welcome, {full_name}!</h2>
                <p>Thank you for registering with Femuki Agencies. Please verify your email address to complete your registration.</p>
                <p>Click the button below to verify your email:</p>
                <p style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{verification_url}">{verification_url}</a></p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create an account with us, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
                <p>Nairobi, Kenya</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to Femuki Agencies, {full_name}!
    
    Thank you for registering. Please verify your email address by clicking the link below:
    
    {verification_url}
    
    This link will expire in 24 hours.
    
    If you didn't create an account with us, you can safely ignore this email.
    
    ---
    Femuki Agencies - Quality Household Items
    """
    
    send_email("Verify Your Email - Femuki Agencies", email, html_content, text_content)

def send_password_reset_email(email, token, full_name):
    """Send password reset link"""
    reset_url = f"{current_app.config.get('APP_URL', 'http://localhost:5173')}/reset-password/{token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reset Your Password - Femuki Agencies</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .button {{ display: inline-block; padding: 12px 24px; background: #ff8c00; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .warning {{ background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Femuki Agencies</h1>
                <p>Password Reset Request</p>
            </div>
            <div class="content">
                <h2>Hello, {full_name}!</h2>
                <p>We received a request to reset your password for your Femuki Agencies account.</p>
                <p>Click the button below to create a new password:</p>
                <p style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{reset_url}">{reset_url}</a></p>
                <div class="warning">
                    <strong>⚠️ Security Note:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email or contact support.
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
                <p>Nairobi, Kenya</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Hello {full_name},
    
    We received a request to reset your password for your Femuki Agencies account.
    
    Click the link below to create a new password:
    
    {reset_url}
    
    This link will expire in 24 hours.
    
    If you didn't request a password reset, please ignore this email or contact support.
    
    ---
    Femuki Agencies - Quality Household Items
    """
    
    send_email("Reset Your Password - Femuki Agencies", email, html_content, text_content)

def send_welcome_email(email, full_name):
    """Send welcome email after verification"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Welcome to Femuki Agencies!</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .button {{ display: inline-block; padding: 12px 24px; background: #ff8c00; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .features {{ display: flex; justify-content: space-between; margin: 30px 0; }}
            .feature {{ text-align: center; flex: 1; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Femuki Agencies!</h1>
            </div>
            <div class="content">
                <h2>Hello, {full_name}!</h2>
                <p>Your email has been verified. Welcome to the Femuki Agencies family!</p>
                <p>You're now ready to start shopping for quality household items at affordable prices.</p>
                
                <div class="features">
                    <div class="feature">
                        <h3>🛍️ 500+ Products</h3>
                        <p>Browse our extensive collection</p>
                    </div>
                    <div class="feature">
                        <h3>🚚 Free Delivery</h3>
                        <p>On orders over KSH 50,000</p>
                    </div>
                    <div class="feature">
                        <h3>💬 24/7 Support</h3>
                        <p>We're here to help</p>
                    </div>
                </div>
                
                <p style="text-align: center;">
                    <a href="{current_app.config.get('APP_URL', 'http://localhost:5173')}/products" class="button">Start Shopping</a>
                </p>
                
                <p>Follow us on social media for updates and special offers!</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
                <p>Nairobi, Kenya | WhatsApp: 0791254076</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to Femuki Agencies, {full_name}!
    
    Your email has been verified. You're now ready to start shopping for quality household items at affordable prices.
    
    Visit our website: {current_app.config.get('APP_URL', 'http://localhost:5173')}/products
    
    Need help? Contact us on WhatsApp: 0791254076
    
    ---
    Femuki Agencies - Quality Household Items
    """
    
    send_email("Welcome to Femuki Agencies!", email, html_content, text_content)

def send_order_confirmation(email, order):
    """Send order confirmation email"""
    items_html = ""
    items_text = ""
    
    for item in order.items:
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.product_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KSH {item.price_at_time:,.0f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">KSH {item.subtotal:,.0f}</td>
        </tr>
        """
        items_text += f"{item.product_name} x{item.quantity} - KSH {item.subtotal:,.0f}\n"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Confirmation - Femuki Agencies</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .order-details {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            .total {{ font-size: 18px; font-weight: bold; color: #ff8c00; }}
            .button {{ display: inline-block; padding: 12px 24px; background: #ff8c00; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmation</h1>
                <p>Thank you for shopping with Femuki Agencies!</p>
            </div>
            <div class="content">
                <h2>Order #{order.order_number}</h2>
                <p>Dear Customer,</p>
                <p>Thank you for your order! We've received your order and will process it shortly.</p>
                
                <div class="order-details">
                    <h3>Order Summary</h3>
                    <table>
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="padding: 10px; text-align: left;">Product</th>
                                <th style="padding: 10px; text-align: center;">Qty</th>
                                <th style="padding: 10px; text-align: right;">Price</th>
                                <th style="padding: 10px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                                <td style="padding: 10px; text-align: right;">KSH {order.subtotal:,.0f}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                                <td style="padding: 10px; text-align: right;">KSH {order.shipping_cost:,.0f}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tax (16%):</strong></td>
                                <td style="padding: 10px; text-align: right;">KSH {order.tax_amount:,.0f}</td>
                            </tr>
                            <tr style="border-top: 2px solid #333;">
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                                <td style="padding: 10px; text-align: right;" class="total">KSH {order.total_amount:,.0f}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="order-details">
                    <h3>Delivery Information</h3>
                    <p><strong>Address:</strong> {order.delivery_address}</p>
                    <p><strong>Phone:</strong> {order.delivery_phone}</p>
                    <p><strong>Payment Method:</strong> {order.payment_method.replace('_', ' ').title()}</p>
                </div>
                
                <p>You can track your order status:</p>
                <p style="text-align: center;">
                    <a href="{current_app.config.get('APP_URL', 'http://localhost:5173')}/order-tracking/{order.order_number}" class="button">Track Order</a>
                </p>
                
                <p>If you have any questions, please contact us on WhatsApp: 0791254076</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
                <p>Nairobi, Kenya</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Order Confirmation - Femuki Agencies
    
    Thank you for your order!
    
    Order #{order.order_number}
    
    {items_text}
    
    Subtotal: KSH {order.subtotal:,.0f}
    Shipping: KSH {order.shipping_cost:,.0f}
    Tax (16%): KSH {order.tax_amount:,.0f}
    Total: KSH {order.total_amount:,.0f}
    
    Delivery Address: {order.delivery_address}
    Phone: {order.delivery_phone}
    Payment Method: {order.payment_method.replace('_', ' ').title()}
    
    Track your order: {current_app.config.get('APP_URL', 'http://localhost:5173')}/order-tracking/{order.order_number}
    
    Questions? Contact us on WhatsApp: 0791254076
    
    ---
    Femuki Agencies - Quality Household Items
    """
    
    send_email(f"Order Confirmation #{order.order_number} - Femuki Agencies", email, html_content, text_content)

def send_order_status_update(email, order, new_status, notes=""):
    """Send order status update email"""
    status_messages = {
        'confirmed': "Your order has been confirmed and is being prepared.",
        'processing': "Your order is now being processed.",
        'shipped': f"Great news! Your order has been shipped. Tracking number: {order.tracking_number if order.tracking_number else 'will be sent soon'}",
        'delivered': "Your order has been delivered! We hope you enjoy your purchase.",
        'cancelled': f"Your order has been cancelled. Reason: {notes}"
    }
    
    message = status_messages.get(new_status, f"Your order status has been updated to {new_status}.")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Status Update - Femuki Agencies</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .status {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }}
            .status-badge {{ display: inline-block; padding: 8px 16px; background: #ff8c00; color: white; border-radius: 20px; font-weight: bold; }}
            .button {{ display: inline-block; padding: 12px 24px; background: #ff8c00; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Status Update</h1>
            </div>
            <div class="content">
                <h2>Order #{order.order_number}</h2>
                <div class="status">
                    <span class="status-badge">{new_status.upper()}</span>
                    <p style="margin-top: 15px;">{message}</p>
                    {f'<p><strong>Tracking Number:</strong> {order.tracking_number}</p>' if order.tracking_number else ''}
                    {f'<p><strong>Courier:</strong> {order.courier_name}</p>' if order.courier_name else ''}
                    {f'<p><strong>Notes:</strong> {notes}</p>' if notes else ''}
                </div>
                <p style="text-align: center;">
                    <a href="{current_app.config.get('APP_URL', 'http://localhost:5173')}/order-tracking/{order.order_number}" class="button">Track Your Order</a>
                </p>
                <p>Need assistance? Contact us on WhatsApp: 0791254076</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Order Status Update - Femuki Agencies
    
    Order #{order.order_number}
    Status: {new_status.upper()}
    
    {message}
    
    Track your order: {current_app.config.get('APP_URL', 'http://localhost:5173')}/order-tracking/{order.order_number}
    
    Questions? Contact us on WhatsApp: 0791254076
    
    ---
    Femuki Agencies - Quality Household Items
    """
    
    send_email(f"Order #{order.order_number} Status Update - Femuki Agencies", email, html_content, text_content)

def send_submission_status_email(email, submission, action, notes=""):
    """Send seller submission status email"""
    if action == 'approve':
        subject = f"Your Product Submission Has Been Approved - Femuki Agencies"
        message = f"Congratulations! Your product '{submission.product_name}' has been approved."
        if submission.negotiated_price:
            message += f" Our offer price: KSH {submission.negotiated_price:,.0f}."
        message += " Our team will contact you for pickup within 24 hours."
    elif action == 'reject':
        subject = f"Update on Your Product Submission - Femuki Agencies"
        message = f"Thank you for your submission. Unfortunately, we cannot purchase your product '{submission.product_name}' at this time."
        if notes:
            message += f"\n\nReason: {notes}"
    else:
        subject = f"Update on Your Product Submission - Femuki Agencies"
        message = f"Thank you for your submission. We're reviewing your product '{submission.product_name}' and will get back to you soon."
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{subject}</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .message {{ background: white; padding: 20px; margin: 20px 0; border-radius: 10px; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Femuki Agencies</h1>
            </div>
            <div class="content">
                <h2>Hello, {submission.seller_name}</h2>
                <div class="message">
                    <p>{message}</p>
                </div>
                <p>Thank you for choosing Femuki Agencies.</p>
                <p>Questions? Contact us on WhatsApp: 0791254076</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    {subject}
    
    Hello {submission.seller_name},
    
    {message}
    
    Questions? Contact us on WhatsApp: 0791254076
    
    ---
    Femuki Agencies - Quality Household Items
    """
    
    send_email(subject, email, html_content, text_content)

def send_admin_notification(email, message):
    """Send admin notification email"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Notification from Femuki Agencies</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #ff8c00; padding: 20px; text-align: center; color: white; }}
            .content {{ padding: 30px; background: #f9f9f9; }}
            .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Femuki Agencies</h1>
            </div>
            <div class="content">
                <p>{message}</p>
                <p>Contact us on WhatsApp: 0791254076</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Femuki Agencies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    send_email("Notification from Femuki Agencies", email, html_content, message)