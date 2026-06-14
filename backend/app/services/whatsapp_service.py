# backend/app/services/whatsapp_service.py - FIXED VERSION
import requests
from flask import current_app
import urllib.parse

class WhatsAppService:
    """WhatsApp Business API Integration - Lazy initialization"""
    
    def __init__(self):
        self._initialized = False
        self.access_token = None
        self.phone_number_id = None
        self.api_version = 'v17.0'
        self.twilio_account_sid = None
        self.twilio_auth_token = None
        self.twilio_whatsapp_number = None
        self.use_twilio = False
        self.primary_number = None
        self.secondary_number = None
    
    def _init_app(self):
        """Initialize with app context"""
        if self._initialized:
            return
        
        # Official WhatsApp Business API (Meta)
        self.access_token = current_app.config.get('WHATSAPP_ACCESS_TOKEN')
        self.phone_number_id = current_app.config.get('WHATSAPP_PHONE_NUMBER_ID')
        
        # Alternative: Twilio API for WhatsApp
        self.twilio_account_sid = current_app.config.get('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
        self.twilio_whatsapp_number = current_app.config.get('TWILIO_WHATSAPP_NUMBER')
        
        # Primary contact numbers for Femuki Agencies
        self.primary_number = current_app.config.get('WHATSAPP_NUMBER_1', '254791254076')
        self.secondary_number = current_app.config.get('WHATSAPP_NUMBER_2', '254797717981')
        
        self.use_twilio = bool(self.twilio_account_sid)
        self._initialized = True
    
    def format_phone_number(self, phone):
        """Format phone number for WhatsApp"""
        cleaned = ''.join(filter(str.isdigit, str(phone)))
        
        if cleaned.startswith('0'):
            cleaned = '254' + cleaned[1:]
        elif cleaned.startswith('254'):
            cleaned = cleaned
        else:
            cleaned = '254' + cleaned
        
        return cleaned
    
    def generate_whatsapp_link(self, phone_number, message=''):
        """Generate WhatsApp click-to-chat link"""
        if not self._initialized:
            self._init_app()
        formatted_phone = self.format_phone_number(phone_number)
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{formatted_phone}?text={encoded_message}"
    
    def send_via_twilio(self, to_number, message):
        """Send WhatsApp message via Twilio"""
        if not self.use_twilio:
            return False
        
        try:
            from twilio.rest import Client
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            to_whatsapp = f'whatsapp:{self.format_phone_number(to_number)}'
            from_whatsapp = f'whatsapp:{self.twilio_whatsapp_number}'
            
            client.messages.create(
                body=message,
                from_=from_whatsapp,
                to=to_whatsapp
            )
            return True
            
        except Exception as e:
            print(f"Twilio WhatsApp error: {e}")
            return False
    
    def send_via_meta(self, to_number, message):
        """Send WhatsApp message via Meta Business API"""
        if not self.access_token or not self.phone_number_id:
            return False
        
        url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'messaging_product': 'whatsapp',
            'to': self.format_phone_number(to_number),
            'type': 'text',
            'text': {'body': message}
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            return response.status_code == 200
            
        except Exception as e:
            print(f"Meta WhatsApp error: {e}")
            return False
    
    def send_message(self, to_number, message):
        """Send WhatsApp message using available API"""
        if not self._initialized:
            self._init_app()
            
        if self.use_twilio:
            return self.send_via_twilio(to_number, message)
        else:
            return self.send_via_meta(to_number, message)
    
    # Rest of the methods remain the same...
    def send_product_inquiry(self, product_name, product_price, customer_phone, customer_name='Customer'):
        """Send product inquiry notification to seller"""
        price_text = f" (Price: KSH {product_price:,.0f})" if product_price else ""
        
        message = f"""🛍️ *New Product Inquiry - Femuki Agencies*

*Product:* {product_name}{price_text}
*Customer:* {customer_name}
*Contact:* {customer_phone}

Please respond to this inquiry as soon as possible.

---
Femuki Agencies - Quality Household Items
📞 0797717981
💬 WhatsApp: 0791254076"""
        
        return self.send_message(self.primary_number, message)

# Singleton instance
whatsapp_service = WhatsAppService()