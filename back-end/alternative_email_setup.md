# Alternative Email Setup - SendGrid

## 1. Tạo SendGrid Account
1. Vào [SendGrid](https://sendgrid.com/)
2. Đăng ký account miễn phí (100 emails/day)
3. Verify email address

## 2. Tạo API Key
1. Vào **Settings** → **API Keys**
2. **Create API Key**
3. Chọn **"Restricted Access"**
4. Chỉ enable **"Mail Send"**
5. **Copy API Key**

## 3. Cập nhật .env
```env
# SendGrid Configuration
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
FRONTEND_URL=http://localhost:5173
```

## 4. Test SendGrid
```bash
python test_email.py
```

## 5. Gmail Troubleshooting

### Nếu muốn dùng Gmail:
1. **Bật 2-Factor Authentication**
2. **Tạo App Password** (16 ký tự)
3. **Cập nhật MAIL_PASSWORD** trong .env
4. **Test lại**

### Lỗi thường gặp:
- **"Connection unexpectedly closed"**: Cần App Password
- **"Authentication failed"**: Wrong credentials
- **"SMTP server not found"**: Check MAIL_HOST và MAIL_PORT
