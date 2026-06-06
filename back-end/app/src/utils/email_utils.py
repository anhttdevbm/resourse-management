import smtplib
from email.message import EmailMessage
from app.core.settings import settings

async def send_email(to: str, subject: str, body: str):
    print(f"Sending email to {to}...") 
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_USER
    msg["To"] = to
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        print("Email sent.")
