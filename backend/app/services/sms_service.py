# backend/app/services/sms_service.py - FIXED VERSION
import requests
from flask import current_app
import threading

class SMSService:
    """SMS Service Integration - Lazy initialization"""
    
    def __init__(self):
        self._initialized = False
        self.username = None
        self.api_key = None
        self.sender_id = None
        self.sms = None
        self.use_africastalking = False
        self.use_twilio = False
        self.twilio_account_sid = None
        self.twilio_auth_token = None
        self.twilio_phone_number = None
    
    def _init_app(self):
        """Initialize with app context - call this within app context"""
        if self._initialized:
            return
        
        # Africa's Talking SMS Gateway
        self.username = current_app.config.get('AFRICASTALKING_USERNAME', 'sandbox')
        self.api_key = current_app.config.get('AFRICASTALKING_API_KEY')
        self.sender_id = current_app.config.get('AFRICASTALKING_SENDER_ID', 'FEMUKI')
        
        # Initialize Africa's Talking
        if self.api_key:
            try:
                import africastalking
                africastalking.initialize(self.username, self.api_key)
                self.sms = africastalking.SMS
                self.use_africastalking = True
            except Exception as e:
                print(f"Failed to initialize Africa's Talking: {e}")
        
        # Alternative: Twilio SMS
        self.twilio_account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
        self.twilio_phone_number = current_app.config.get('TWILIO_PHONE_NUMBER')
        
        self.use_twilio = bool(self.twilio_account_sid and not self.use_africastalking)
        self._initialized = True
    
    def format_phone_number(self, phone):
        """Format phone number for SMS (Kenyan format)"""
        cleaned = ''.join(filter(str.isdigit, str(phone)))
        
        if cleaned.startswith('0'):
            cleaned = '254' + cleaned[1:]
        elif not cleaned.startswith('254'):
            cleaned = '254' + cleaned
        
        return cleaned
    
    def send_via_africastalking(self, to_number, message):
        """Send SMS via Africa's Talking"""
        if not self.use_africastalking or not self.sms:
            return False
        
        try:
            formatted_number = self.format_phone_number(to_number)
            
            response = self.sms.send(message, [formatted_number], sender_id=self.sender_id)
            
            if response and response.get('SMSMessageData'):
                recipients = response['SMSMessageData']['Recipients']
                if recipients and len(recipients) > 0:
                    return recipients[0].get('status') == 'Success'
            
            return False
            
        except Exception as e:
            print(f"Africa's Talking SMS error: {e}")
            return False
    
    def send_via_twilio(self, to_number, message):
        """Send SMS via Twilio"""
        if not self.use_twilio:
            return False
        
        try:
            from twilio.rest import Client
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            message = client.messages.create(
                body=message,
                from_=self.twilio_phone_number,
                to=self.format_phone_number(to_number)
            )
            
            return message.status in ['queued', 'sending', 'sent']
            
        except Exception as e:
            print(f"Twilio SMS error: {e}")
            return False
    
    def send_sms(self, to_number, message):
        """Send SMS using available provider"""
        # Initialize if not already done
        if not self._initialized:
            self._init_app()
        
        if self.use_africastalking:
            return self.send_via_africastalking(to_number, message)
        elif self.use_twilio:
            return self.send_via_twilio(to_number, message)
        else:
            # Log but don't fail - SMS is optional
            print(f"SMS not sent (no provider configured): {message[:50]}...")
            return True  # Return True to not break the flow
    
    def send_bulk_sms(self, numbers, message):
        """Send bulk SMS"""
        results = []
        for number in numbers:
            result = self.send_sms(number, message)
            results.append({'number': number, 'success': result})
        return results
    
    def send_verification_sms(self, phone, code, full_name):
        """Send verification code via SMS"""
        message = f"""Femuki Agencies: Your verification code is {code}. This code will expire in 10 minutes. Do not share this code with anyone.

Welcome {full_name}!"""
        
        return self.send_sms(phone, message)
    
    def send_order_confirmation_sms(self, phone, order_number, total_amount, customer_name):
        """Send order confirmation SMS"""
        message = f"""Femuki Agencies: Order #{order_number} confirmed! Total: KSH {total_amount:,.0f}. We'll notify you when your order ships. Track: femuki.com/track/{order_number}

Thank you for shopping with us, {customer_name}!"""
        
        return self.send_sms(phone, message)
    
    def send_order_status_sms(self, phone, order_number, status, notes=''):
        """Send order status update SMS"""
        message = f"""Femuki Agencies: Order #{order_number} status: {status.upper()}. {notes if notes else f'Your order has been {status}.'}

Track your order: femuki.com/track/{order_number}"""
        
        return self.send_sms(phone, message)
    
    def send_delivery_notification(self, phone, order_number, courier_name='', tracking_number=''):
        """Send delivery notification SMS"""
        message = f"""🚚 Femuki Agencies: Your order #{order_number} is out for delivery!"""
        
        if courier_name:
            message += f"\nCourier: {courier_name}"
        if tracking_number:
            message += f"\nTracking: {tracking_number}"
        
        message += "\n\nThank you for shopping with Femuki Agencies!"
        
        return self.send_sms(phone, message)
    
    def send_submission_sms(self, phone, product_name, status, notes=''):
        """Send submission status SMS"""
        if status == 'approved':
            message = f"""Femuki Agencies: Your product '{product_name}' has been APPROVED! Our team will contact you for pickup within 24 hours.

Thank you for choosing Femuki Agencies!"""
        
        elif status == 'rejected':
            message = f"""Femuki Agencies: Update on your product '{product_name}'. Status: REJECTED.
Reason: {notes if notes else 'Does not meet our current requirements'}

Thank you for considering Femuki Agencies."""
        
        else:
            message = f"""Femuki Agencies: Your product '{product_name}' has been received and is under review. We'll get back to you within 48 hours.

Thank you for choosing Femuki Agencies!"""
        
        return self.send_sms(phone, message)
    
    def send_promotional_sms(self, phone, offer_message):
        """Send promotional SMS (use sparingly)"""
        message = f"""Femuki Agencies: {offer_message}

Shop now: femuki.com

Reply STOP to unsubscribe."""
        
        return self.send_sms(phone, message)

# Singleton instance - will be initialized when first used
sms_service = SMSService()

# Convenience function
def send_sms(to_number, message):
    """Send SMS using the singleton service"""
    return sms_service.send_sms(to_number, message)