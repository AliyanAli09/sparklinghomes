# Email Setup for BooknMove

This document explains how to configure email functionality for the BooknMove application using Gmail SMTP.

## Required Environment Variables

Add these variables to your `.env` file:

```bash
# Email Configuration (Gmail SMTP)
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your-gmail@gmail.com

# Frontend URL (for CORS and API responses) 
FRONTEND_URL=http://localhost:8080

# Frontend URL for email links (may be different in production)
FRONTEND_URL_MAIL=http://localhost:8080
```

## Gmail SMTP Configuration

The application is configured to use Gmail SMTP with the following settings:

- **Host**: smtp.gmail.com
- **Port**: 587
- **Security**: STARTTLS (secure: false, TLS enabled)
- **Authentication**: Username/App Password

### Setting Up Gmail Email

1. Ensure you have a Gmail account
2. Enable 2-Factor Authentication on your Gmail account
3. Generate an App Password for the application:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
4. Add the credentials to your `.env` file:
   - `GMAIL_USER`: Your full Gmail address (e.g., support@gmail.com)
   - `GMAIL_PASS`: Your Gmail app password (NOT your regular password)
   - `EMAIL_FROM`: The "From" address for all emails (same as GMAIL_USER)

### Alternative Email Services (Optional)

If you need to use a different email service, you can modify the transporter configuration in `utils/email.js`:

#### Titan SMTP (Alternative)
```javascript
return nodemailer.createTransporter({
  host: 'smtp.titan.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});
```

#### SendGrid (Production Alternative)
```javascript
return nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

## Email Templates

The application includes professional email templates for:

### User Management Emails
- **Welcome Email (Customer)**: Sent when a new customer registers
- **Welcome Email (Mover)**: Sent when a new mover registers
- **Password Reset**: Sent when user requests password reset
- **Password Reset Confirmation**: Sent when password is successfully reset

### Booking & Payment Emails
- **Booking Confirmation**: Sent when a customer creates a booking
- **Payment Confirmation**: Sent when payment is successfully processed
- **Job Alert (Mover)**: Sent to notify movers about new job opportunities
- **Quote Received (Customer)**: Sent when a customer receives a new quote

All templates feature:
- Professional design with BooknMove branding
- Responsive layout for mobile and desktop
- Clear call-to-action buttons
- Consistent color scheme and typography
- Contact information and support details

## Testing Email Functionality

1. Set up your email credentials in `.env`
2. Start the backend server
3. Test the forgot password flow:
   - Go to `/forgot-password`
   - Enter an email address
   - Check your email for the reset link

## Troubleshooting

### Common Issues

1. **"Email sending failed" error**:
   - Check your Gmail credentials
   - Verify 2FA is enabled on your Gmail account
   - Ensure you're using an app password instead of your regular password
   - Check if "Less secure app access" is properly configured (though app passwords are recommended)

2. **Emails not received**:
   - Check spam folder
   - Verify email address is correct
   - Check email service logs

3. **Authentication failed**:
   - Double-check username/password
   - Ensure you're using an app password, not your regular password
   - Verify 2FA is enabled on your Gmail account

### Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive information
- Consider using email service APIs (SendGrid, AWS SES) for production
- Implement rate limiting for password reset requests

## Production Considerations

For production environments:

1. Use a dedicated email service (SendGrid, Mailgun, AWS SES)
2. Set up proper SPF, DKIM, and DMARC records
3. Monitor email delivery rates
4. Implement email templates with your branding
5. Set up email analytics and tracking
6. Consider using email queues for better performance
