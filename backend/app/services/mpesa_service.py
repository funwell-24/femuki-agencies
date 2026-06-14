# backend/app/services/mpesa_service.py
import requests
import base64
from datetime import datetime
from flask import current_app
import json

class MpesaService:
    """M-Pesa Daraja API Integration"""
    
    def __init__(self):
        self.consumer_key = current_app.config['MPESA_CONSUMER_KEY']
        self.consumer_secret = current_app.config['MPESA_CONSUMER_SECRET']
        self.shortcode = current_app.config['MPESA_SHORTCODE']
        self.passkey = current_app.config['MPESA_PASSKEY']
        self.environment = current_app.config['MPESA_ENVIRONMENT']
        self.callback_url = current_app.config['MPESA_CALLBACK_URL']
        
        # API URLs
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
    
    def get_access_token(self):
        """Get OAuth access token"""
        api_url = f'{self.base_url}/oauth/v1/generate?grant_type=client_credentials'
        
        try:
            response = requests.get(
                api_url,
                auth=requests.auth.HTTPBasicAuth(self.consumer_key, self.consumer_secret)
            )
            
            if response.status_code == 200:
                return response.json().get('access_token')
            else:
                print(f"Failed to get access token: {response.text}")
                return None
                
        except Exception as e:
            print(f"Access token error: {e}")
            return None
    
    def generate_password(self):
        """Generate password for STK Push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode('utf-8')
        return password, timestamp
    
    def format_phone_number(self, phone_number):
        """Format phone number to international format"""
        phone = str(phone_number).replace('+', '').replace('-', '').replace(' ', '')
        
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif phone.startswith('254'):
            phone = phone
        else:
            phone = '254' + phone
        
        return phone
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """
        Initiate STK Push payment
        """
        # Format phone number
        phone = self.format_phone_number(phone_number)
        
        # Get access token
        access_token = self.get_access_token()
        if not access_token:
            return {'success': False, 'message': 'Failed to get access token'}
        
        # Generate password
        password, timestamp = self.generate_password()
        
        # Prepare request
        api_url = f'{self.base_url}/mpesa/stkpush/v1/processrequest'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone,
            'PartyB': self.shortcode,
            'PhoneNumber': phone,
            'CallBackURL': self.callback_url,
            'AccountReference': account_reference[:12],  # Max 12 characters
            'TransactionDesc': transaction_desc[:13]  # Max 13 characters
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            result = response.json()
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'checkout_request_id': result.get('CheckoutRequestID'),
                    'response_code': result.get('ResponseCode'),
                    'response_description': result.get('ResponseDescription'),
                    'customer_message': result.get('CustomerMessage')
                }
            else:
                return {
                    'success': False,
                    'message': result.get('errorMessage', 'STK Push failed'),
                    'response_code': result.get('ResponseCode')
                }
                
        except Exception as e:
            print(f"STK Push error: {e}")
            return {'success': False, 'message': str(e)}
    
    def query_status(self, checkout_request_id):
        """
        Query STK Push transaction status
        """
        # Get access token
        access_token = self.get_access_token()
        if not access_token:
            return {'success': False, 'message': 'Failed to get access token'}
        
        # Generate password
        password, timestamp = self.generate_password()
        
        # Prepare request
        api_url = f'{self.base_url}/mpesa/stkpushquery/v1/query'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            result = response.json()
            
            return {
                'success': True,
                'result_code': result.get('ResultCode'),
                'result_desc': result.get('ResultDesc'),
                'transaction_id': result.get('TransactionId'),
                'amount': result.get('Amount')
            }
            
        except Exception as e:
            print(f"Query status error: {e}")
            return {'success': False, 'message': str(e)}
    
    def register_urls(self):
        """
        Register validation and confirmation URLs for C2B payments
        """
        access_token = self.get_access_token()
        if not access_token:
            return {'success': False, 'message': 'Failed to get access token'}
        
        api_url = f'{self.base_url}/mpesa/c2b/v1/registerurl'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'ShortCode': self.shortcode,
            'ResponseType': 'Completed',
            'ConfirmationURL': f'{self.callback_url}/confirmation',
            'ValidationURL': f'{self.callback_url}/validation'
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            result = response.json()
            
            return {
                'success': response.status_code == 200,
                'data': result
            }
            
        except Exception as e:
            print(f"Register URLs error: {e}")
            return {'success': False, 'message': str(e)}
    
    def simulate_c2b_payment(self, phone_number, amount, reference):
        """
        Simulate C2B payment (sandbox only)
        """
        if self.environment == 'production':
            return {'success': False, 'message': 'Simulation only available in sandbox'}
        
        access_token = self.get_access_token()
        if not access_token:
            return {'success': False, 'message': 'Failed to get access token'}
        
        phone = self.format_phone_number(phone_number)
        
        api_url = f'{self.base_url}/mpesa/c2b/v1/simulate'
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'ShortCode': self.shortcode,
            'CommandID': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'Msisdn': phone,
            'BillRefNumber': reference[:12]
        }
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            result = response.json()
            
            return {
                'success': response.status_code == 200,
                'data': result
            }
            
        except Exception as e:
            print(f"Simulate C2B error: {e}")
            return {'success': False, 'message': str(e)}

# Singleton instance
mpesa_service = MpesaService()