#!/usr/bin/env python3
"""
Setup script to create .env file for email service
"""

import os

def create_env_file():
    """Create .env file with default values"""
    
    env_content = """# Database Configuration
USERNAME_DB=postgres
PASSWORD_DB=password
HOST_DB=localhost
PORT_DB=5432
NAME_DB=resource_management

# JWT Configuration
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=300

# Email Configuration (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
FRONTEND_URL=http://localhost:5173

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:30111/api/auth/github/callback

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:30111/api/auth/google/callback

# Twitter OAuth Configuration
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
TWITTER_REDIRECT_URI=http://localhost:30111/api/auth/twitter/callback

# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_REDIRECT_URI=http://localhost:30111/api/auth/facebook/callback
"""
    
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    if os.path.exists(env_path):
        print("❌ .env file already exists")
        overwrite = input("Do you want to overwrite it? (y/n): ").strip().lower()
        if overwrite != 'y':
            print("Cancelled")
            return False
    
    try:
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("✅ .env file created successfully!")
        print(f"📁 File location: {env_path}")
        print("\n📝 Next steps:")
        print("1. Edit the .env file with your actual values")
        print("2. Set up Gmail App Password:")
        print("   - Go to Google Account → Security → 2-Step Verification")
        print("   - App passwords → Generate password for 'Mail'")
        print("   - Update MAIL_USERNAME and MAIL_PASSWORD in .env")
        print("3. Run: python test_email.py")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

def main():
    """Main setup function"""
    print("Email Service Setup")
    print("=" * 30)
    
    success = create_env_file()
    
    if success:
        print("\n🎉 Setup completed!")
    else:
        print("\n❌ Setup failed")

if __name__ == "__main__":
    main()
