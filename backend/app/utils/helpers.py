# backend/app/utils/helpers.py
import re
import string
import random
from datetime import datetime
from flask import current_app

def slugify(text):
    """
    Convert text to a URL-friendly slug
    
    Args:
        text (str): Text to slugify
    
    Returns:
        str: URL-friendly slug
    """
    if not text:
        return ''
    
    # Convert to lowercase
    text = text.lower()
    
    # Replace spaces with hyphens
    text = re.sub(r'\s+', '-', text)
    
    # Remove special characters
    text = re.sub(r'[^\w\-]', '', text)
    
    # Remove multiple hyphens
    text = re.sub(r'-+', '-', text)
    
    # Remove leading/trailing hyphens
    text = text.strip('-')
    
    return text

def generate_unique_slug(model, field, text, max_length=200):
    """
    Generate a unique slug for a model
    
    Args:
        model: SQLAlchemy model class
        field: Field name to check for uniqueness
        text: Text to slugify
        max_length: Maximum slug length
    
    Returns:
        str: Unique slug
    """
    base_slug = slugify(text)
    slug = base_slug[:max_length]
    
    # Check if slug exists
    query = {field: slug}
    existing = model.query.filter_by(**query).first()
    
    if not existing:
        return slug
    
    # Generate unique slug with counter
    counter = 1
    while True:
        new_slug = f"{base_slug[:max_length - len(str(counter)) - 1]}-{counter}"
        query = {field: new_slug}
        existing = model.query.filter_by(**query).first()
        if not existing:
            return new_slug
        counter += 1

def format_price(price, currency='KES'):
    """
    Format price with currency
    
    Args:
        price (float): Price value
        currency (str): Currency code
    
    Returns:
        str: Formatted price
    """
    if price is None:
        return f"{currency} 0"
    
    if currency == 'KES':
        return f"{currency} {price:,.0f}"
    else:
        return f"{currency} {price:,.2f}"

def format_date(date, format='%Y-%m-%d %H:%M:%S'):
    """
    Format datetime object
    
    Args:
        date: datetime object
        format: Date format string
    
    Returns:
        str: Formatted date string
    """
    if not date:
        return ''
    return date.strftime(format)

def generate_order_number():
    """
    Generate unique order number
    
    Returns:
        str: Unique order number
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = ''.join(random.choices(string.digits, k=4))
    return f"FEM-{timestamp}-{random_part}"

def generate_verification_token():
    """
    Generate random verification token
    
    Returns:
        str: Random token
    """
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

def validate_email(email):
    """
    Validate email format
    
    Args:
        email (str): Email to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone):
    """
    Validate Kenyan phone number
    
    Args:
        phone (str): Phone number to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    pattern = r'^(07|01|2547|2541)\d{8}$'
    return bool(re.match(pattern, str(phone)))

def validate_password(password, min_length=6):
    """
    Validate password strength
    
    Args:
        password (str): Password to validate
        min_length (int): Minimum password length
    
    Returns:
        tuple: (is_valid, message)
    """
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters"
    
    # Optional: Add more password requirements
    # if not re.search(r'[A-Z]', password):
    #     return False, "Password must contain at least one uppercase letter"
    # if not re.search(r'[0-9]', password):
    #     return False, "Password must contain at least one number"
    
    return True, "Password is valid"

def sanitize_input(data):
    """
    Sanitize input data to prevent XSS
    
    Args:
        data: Input data (string, dict, or list)
    
    Returns:
        Sanitized data
    """
    if isinstance(data, str):
        # Remove HTML tags and escape special characters
        import html
        return html.escape(data.strip())
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return data

def truncate_string(text, max_length=100, suffix='...'):
    """
    Truncate string to maximum length
    
    Args:
        text (str): Text to truncate
        max_length (int): Maximum length
        suffix (str): Suffix to add when truncated
    
    Returns:
        str: Truncated string
    """
    if not text or len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

def extract_mentions(text):
    """
    Extract @mentions from text
    
    Args:
        text (str): Text to extract mentions from
    
    Returns:
        list: List of mentioned usernames
    """
    if not text:
        return []
    pattern = r'@(\w+)'
    return re.findall(pattern, text)

def extract_hashtags(text):
    """
    Extract #hashtags from text
    
    Args:
        text (str): Text to extract hashtags from
    
    Returns:
        list: List of hashtags
    """
    if not text:
        return []
    pattern = r'#(\w+)'
    return re.findall(pattern, text)

def calculate_discount(price, discount_percent):
    """
    Calculate discounted price
    
    Args:
        price (float): Original price
        discount_percent (float): Discount percentage
    
    Returns:
        float: Discounted price
    """
    if not price or not discount_percent:
        return price
    return price * (1 - discount_percent / 100)

def calculate_tax(price, tax_percent=16):
    """
    Calculate tax amount
    
    Args:
        price (float): Price before tax
        tax_percent (float): Tax percentage
    
    Returns:
        float: Tax amount
    """
    if not price:
        return 0
    return price * (tax_percent / 100)

def calculate_shipping(price, free_shipping_threshold=50000, shipping_cost=299):
    """
    Calculate shipping cost
    
    Args:
        price (float): Order subtotal
        free_shipping_threshold (float): Minimum for free shipping
        shipping_cost (float): Standard shipping cost
    
    Returns:
        float: Shipping cost
    """
    if not price:
        return shipping_cost
    return 0 if price >= free_shipping_threshold else shipping_cost

def get_client_ip(request):
    """
    Get client IP address from request
    
    Args:
        request: Flask request object
    
    Returns:
        str: Client IP address
    """
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0]
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def is_ajax_request(request):
    """
    Check if request is AJAX request
    
    Args:
        request: Flask request object
    
    Returns:
        bool: True if AJAX request
    """
    return request.headers.get('X-Requested-With') == 'XMLHttpRequest'

def get_user_agent(request):
    """
    Get user agent string from request
    
    Args:
        request: Flask request object
    
    Returns:
        str: User agent string
    """
    return request.headers.get('User-Agent', '')

def is_mobile_device(request):
    """
    Check if request is from mobile device
    
    Args:
        request: Flask request object
    
    Returns:
        bool: True if mobile device
    """
    user_agent = get_user_agent(request).lower()
    mobile_keywords = ['mobile', 'android', 'iphone', 'ipad', 'windows phone']
    return any(keyword in user_agent for keyword in mobile_keywords)

def generate_meta_description(text, max_length=160):
    """
    Generate meta description from text
    
    Args:
        text (str): Source text
        max_length (int): Maximum description length
    
    Returns:
        str: Meta description
    """
    if not text:
        return ''
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Remove extra whitespace
    text = ' '.join(text.split())
    return truncate_string(text, max_length, '...')

def generate_meta_keywords(text, max_keywords=10):
    """
    Generate meta keywords from text
    
    Args:
        text (str): Source text
        max_keywords (int): Maximum number of keywords
    
    Returns:
        str: Comma-separated keywords
    """
    if not text:
        return ''
    
    # Common words to exclude
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
    
    # Extract words
    words = re.findall(r'\b\w+\b', text.lower())
    
    # Filter stop words and get unique words
    keywords = [word for word in set(words) if word not in stop_words and len(word) > 2]
    
    # Return limited keywords as comma-separated string
    return ', '.join(keywords[:max_keywords])