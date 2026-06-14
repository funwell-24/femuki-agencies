# backend/app/services/cloudinary_service.py
import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app
import os
from io import BytesIO
from PIL import Image

def init_cloudinary():
    """Initialize Cloudinary with app config"""
    cloudinary.config(
        cloud_name=current_app.config['CLOUDINARY_CLOUD_NAME'],
        api_key=current_app.config['CLOUDINARY_API_KEY'],
        api_secret=current_app.config['CLOUDINARY_API_SECRET'],
        secure=True
    )

def upload_image(file, folder='products', transformations=None):
    """
    Upload an image to Cloudinary
    
    Args:
        file: File object or file path
        folder: Folder name in Cloudinary
        transformations: Optional transformations dict
    
    Returns:
        dict: Contains url and public_id
    """
    try:
        # Ensure Cloudinary is initialized
        if not cloudinary.config().cloud_name:
            init_cloudinary()
        
        upload_options = {
            'folder': f'femuki/{folder}',
            'use_filename': True,
            'unique_filename': True,
            'overwrite': True,
            'resource_type': 'image'
        }
        
        # Add transformations if provided
        if transformations:
            upload_options['transformation'] = transformations
        else:
            # Default transformations for optimization
            upload_options['transformation'] = [
                {'quality': 'auto'},
                {'fetch_format': 'auto'},
                {'width': 1200, 'crop': 'limit'}
            ]
        
        # Upload file
        if hasattr(file, 'read'):
            # File object from request
            result = cloudinary.uploader.upload(file, **upload_options)
        else:
            # File path string
            result = cloudinary.uploader.upload(file, **upload_options)
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format'),
            'size': result.get('bytes')
        }
    
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None

def upload_multiple_images(files, folder='products'):
    """Upload multiple images to Cloudinary"""
    uploaded = []
    
    for file in files:
        if file and file.filename:
            result = upload_image(file, folder)
            if result:
                uploaded.append(result)
    
    return uploaded

def delete_image(public_id):
    """Delete an image from Cloudinary"""
    try:
        if not cloudinary.config().cloud_name:
            init_cloudinary()
        
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        return False

def delete_multiple_images(public_ids):
    """Delete multiple images from Cloudinary"""
    results = []
    for public_id in public_ids:
        results.append(delete_image(public_id))
    return results

def get_image_url(public_id, transformations=None):
    """Generate image URL with transformations"""
    if not transformations:
        transformations = {'quality': 'auto', 'fetch_format': 'auto'}
    
    return cloudinary.utils.cloudinary_url(public_id, **transformations)[0]

def optimize_image(file, max_width=1200, quality=80):
    """Optimize image before upload"""
    try:
        img = Image.open(file)
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize if too large
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save to BytesIO
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        return output
    
    except Exception as e:
        print(f"Image optimization error: {e}")
        return file

def get_placeholder_image(width=400, height=400, text='No Image'):
    """Generate a placeholder image URL"""
    return f'https://via.placeholder.com/{width}x{height}?text={text}'