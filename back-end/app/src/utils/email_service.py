import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config
import jwt
from datetime import datetime, timedelta
import time
import ssl

class EmailService:
    def __init__(self):
        self.smtp_host = config('MAIL_HOST', default='smtp.gmail.com')
        self.smtp_port = config('MAIL_PORT', default=587, cast=int)
        self.smtp_username = config('MAIL_USERNAME', default=config('EMAIL_USER', default='noop@localhost'))
        self.smtp_password = config('MAIL_PASSWORD', default=config('EMAIL_PASSWORD', default='noop'))
        self.frontend_url = config('FRONTEND_URL', default='http://localhost:5173')
        self.secret_key = config('SECRET_KEY', default='your-secret-key')

    def create_reset_token(self, email: str) -> str:
        """Tạo JWT token cho reset password với thời gian hết hạn 15 phút"""
        payload = {
            'email': email,
            'exp': datetime.utcnow() + timedelta(minutes=15),  # Token hết hạn sau 15 phút
            'type': 'password_reset'
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')

    def verify_reset_token(self, token: str) -> str:
        """Xác thực token và trả về email"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            if payload.get('type') != 'password_reset':
                raise ValueError("Invalid token type")
            return payload['email']
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

    def send_reset_password_email(self, email: str, reset_token: str, max_retries: int = 3) -> bool:
        """Gửi email reset password với retry logic"""
        for attempt in range(max_retries):
            try:
                print(f"EmailService config - Host: {self.smtp_host}, Port: {self.smtp_port}")
                print(f"SMTP Username: {self.smtp_username}")
                print(f"SMTP Password: {'*' * len(self.smtp_password) if self.smtp_password else 'None'}")
                print(f"Frontend URL: {self.frontend_url}")
                print(f"Attempt {attempt + 1}/{max_retries}")
                
                # Tạo message
                msg = MIMEMultipart()
                msg['From'] = self.smtp_username
                msg['To'] = email
                msg['Subject'] = "Reset Password - Resource Management"

                # Tạo link reset
                reset_link = f"{self.frontend_url}/reset-password?token={reset_token}"
                print(f"Reset link: {reset_link}")

                # Nội dung email với template đẹp hơn
                html_content = self._create_reset_password_template(reset_link)
                msg.attach(MIMEText(html_content, 'html'))

                # Gửi email với timeout
                print("Connecting to SMTP server...")
                server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30)
                
                # Set proper hostname for Gmail to avoid HELO issues
                server.local_hostname = 'localhost'
                
                # Enable debug mode for troubleshooting
                server.set_debuglevel(0)  # Disable debug mode
                
                print("Starting TLS...")
                context = ssl.create_default_context()
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                server.starttls(context=context)
                
                print("Logging in to SMTP...")
                server.login(self.smtp_username, self.smtp_password)
                
                print("Sending message...")
                server.send_message(msg)
                
                print("Closing connection...")
                server.quit()
                print("Email sent successfully!")
                return True
                
            except smtplib.SMTPAuthenticationError as e:
                print(f"SMTP Authentication Error: {e}")
                print("Please check your email credentials and App Password")
                return False
                
            except smtplib.SMTPRecipientsRefused as e:
                print(f"SMTP Recipients Refused: {e}")
                print("Please check the recipient email address")
                return False
                
            except smtplib.SMTPServerDisconnected as e:
                print(f"SMTP Server Disconnected: {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying in 5 seconds...")
                    time.sleep(5)
                    continue
                else:
                    print("Max retries reached")
                    return False
                    
            except smtplib.SMTPException as e:
                print(f"SMTP Exception: {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying in 5 seconds...")
                    time.sleep(5)
                    continue
                else:
                    return False
                    
            except Exception as e:
                print(f"Unexpected error: {e}")
                import traceback
                traceback.print_exc()
                if attempt < max_retries - 1:
                    print(f"Retrying in 5 seconds...")
                    time.sleep(5)
                    continue
                else:
                    return False
        
        return False

    def _create_reset_password_template(self, reset_link: str) -> str:
        """Tạo HTML template đẹp cho email reset password"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    You have requested to reset your password for your Resource Management account.
                </p>
                
                <p style="font-size: 16px; margin-bottom: 30px;">
                    Click the button below to reset your password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              display: inline-block; 
                              font-weight: bold; 
                              font-size: 16px;
                              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                        Reset Password
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin: 30px 0;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
                </p>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>⚠️ Important:</strong> This link will expire in 15 minutes for security reasons.
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #666; margin: 30px 0;">
                    If you didn't request this password reset, please ignore this email. 
                    Your password will remain unchanged.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #666; margin: 0;">
                    Best regards,<br>
                    <strong>Resource Management Team</strong>
                </p>
            </div>
        </body>
        </html>
        """