import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();
// Create transporter using Gmail SMTP
const createTransporter = () => {
  // Debug environment variables
  console.log('Email Environment Variables:');
  console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Missing');
  console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set' : 'Missing');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM ? 'Set' : 'Missing');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Email credentials missing. Please check GMAIL_USER and GMAIL_PASS in .env file');
  }

  // Gmail SMTP configuration
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS // Use App Password for Gmail
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Enable debug output
    logger: true // Log to console
  };

  console.log('Attempting Gmail SMTP connection with:', {
    host: config.host,
    port: config.port,
    user: process.env.GMAIL_USER,
    // Don't log the actual password
    pass: process.env.GMAIL_PASS ? '***' + process.env.GMAIL_PASS.slice(-3) : 'NOT SET'
  });

  return nodemailer.createTransport(config);
};

// Email templates
export const emailTemplates = {
  // Welcome email for new users
  welcome: (userData) => ({
    subject: 'Welcome to Sparkling Homes Cleaning Service!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Sparkling Homes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Welcome to Sparkling Homes!</h1>
            <p>Your journey to a cleaner home starts here</p>
          </div>
          <div class="content">
            <h2>Hi ${userData.firstName}!</h2>
            <p>Welcome to Sparkling Homes Cleaning Service! We're excited to have you on board.</p>

            <p>With Sparkling Homes, you can:</p>
            <ul>
              <li>Find reliable cleaners in your area</li>
              <li>Get competitive quotes</li>
              <li>Book cleanings on your schedule</li>
              <li>Read reviews from real customers</li>
            </ul>

            <p>Ready to get started?</p>
            <a href="${process.env.FRONTEND_URL_MAIL}/dashboard" class="button">Go to Dashboard</a>

            <p>If you have any questions, feel free to reach out to our support team.</p>

            <p>Best regards,<br>The Sparkling Homes Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sparkling Homes Cleaning Service. All rights reserved.</p>
            <p>This email was sent to ${userData.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Welcome email for new cleaners
  welcomeCleaner: (moverData) => ({
    subject: 'Welcome to Sparkling Homes - Start Growing Your Cleaning Business!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Sparkling Homes - Professional Cleaner</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .welcome-badge { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 25px; border-radius: 25px; display: inline-block; margin: 20px 0; font-weight: 600; }
          .status-card { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; }
          .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
          .benefit-item { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; }
          .benefit-icon { font-size: 24px; margin-bottom: 10px; }
          .benefit-title { font-weight: 600; color: #059669; margin-bottom: 5px; }
          .benefit-desc { font-size: 14px; color: #374151; }
          .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; font-size: 16px; transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .secondary-button { display: inline-block; background: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: 500; font-size: 14px; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .next-steps { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .contact-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Sparkling Homes!</h1>
            <p>Your gateway to more cleaning jobs and higher earnings</p>
          </div>
          <div class="content">
            <div class="welcome-badge">
Professional Cleaner Account Created
            </div>
            
            <h2>Hi ${moverData.firstName}!</h2>
            <p>Congratulations! You've successfully joined Sparkling Homes, the premier platform connecting professional cleaners with customers who need reliable cleaning services.</p>
            
            <div class="status-card">
              <h3 style="margin-top: 0; color: #d97706;">Account Status: Under Review</h3>
              <p style="margin-bottom: 0;">
                <strong>What's happening:</strong> Our team is reviewing your registration and will verify your business information within 24-48 hours. You'll receive an email notification once approved.
              </p>
            </div>
            
            <h3 style="color: #059669;">What Sparkling Homes Offers You:</h3>
            <div class="benefits-grid">
              <div class="benefit-item">
                <div class="benefit-icon">JOB</div>
                <div class="benefit-title">Instant Job Alerts</div>
                <div class="benefit-desc">Get notified of new jobs in your service area within minutes</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">PAY</div>
                <div class="benefit-title">Fair Pricing</div>
                <div class="benefit-desc">Customers pay platform rates - no price haggling needed</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">APP</div>
                <div class="benefit-title">Easy Management</div>
                <div class="benefit-desc">Manage jobs, schedule, and payments all in one place</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">REP</div>
                <div class="benefit-title">Build Reputation</div>
                <div class="benefit-desc">Earn reviews and ratings to attract more customers</div>
              </div>
            </div>
            
            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1d4ed8;">Next Steps to Start Earning:</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Complete Your Profile:</strong> Add business details, service areas, and availability</li>
                <li><strong>Upload Required Documents:</strong> License, insurance, and certifications</li>
                <li><strong>Set Your Availability:</strong> Choose days and times you want to work</li>
                <li><strong>Wait for Approval:</strong> We'll review and approve your account (24-48 hours)</li>
                <li><strong>Start Receiving Jobs:</strong> Get notified of jobs matching your criteria</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL_MAIL}/mover/dashboard" class="button">Complete Your Profile Now</a>
              <br>
              <a href="${process.env.FRONTEND_URL_MAIL}/mover/dashboard" class="secondary-button">View Dashboard</a>
              <a href="${process.env.FRONTEND_URL_MAIL}/mover/profile" class="secondary-button">Manage Profile</a>
            </div>
            
            <div class="contact-info">
              <h3 style="margin-top: 0; color: #059669;">Need Help Getting Started?</h3>
              <p>Our support team is here to help you succeed on Sparkling Homes!</p>
              <p><strong>Email:</strong> support@sparklinghomes.com</p>
              <p><strong>Pro Tip:</strong> Complete your profile fully to receive more job opportunities!</p>
            </div>
            
            <p style="margin-top: 30px;">We're excited to help you grow your cleaning business and connect you with customers who need your professional services.</p>
            
            <p><strong>Welcome to the Sparkling Homes family!</strong></p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${moverData.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password reset email
  passwordReset: (data) => ({
    subject: 'Reset Your Sparkling Homes Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
            <p>Secure your Sparkling Homes account</p>
          </div>
          <div class="content">
            <h2>Hi ${data.firstName}!</h2>
            <p>We received a request to reset your password for your Sparkling Homes account.</p>
            
            <p>Click the button below to reset your password:</p>
            <a href="${process.env.FRONTEND_URL_MAIL}/reset-password/${data.resetToken}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>Security Notice:</strong><br>
              This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">
              ${process.env.FRONTEND_URL_MAIL}/reset-password/${data.resetToken}
            </p>
            
            <p>Best regards,<br>The Sparkling Homes Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password reset confirmation
  passwordResetConfirmation: (userData) => ({
    subject: 'Your Sparkling Homes Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .success { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; margin: 20px 0; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Complete</h1>
            <p>Your account is secure</p>
          </div>
          <div class="content">
            <h2>Hi ${userData.firstName}!</h2>
            <p>Your Sparkling Homes password has been successfully reset.</p>
            
            <div class="success">
              <strong>Success!</strong><br>
              Your password has been updated and your account is secure.
            </div>
            
            <p>You can now sign in to your account with your new password:</p>
            <a href="${process.env.FRONTEND_URL_MAIL}/login" class="button">Sign In Now</a>
            
            <p>If you didn't reset your password, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The Sparkling Homes Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${userData.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking confirmation email (Customer)
  bookingConfirmation: (bookingData) => ({
    subject: 'Booking Confirmed - Your Cleaning is Scheduled!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .booking-details { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .status-badge { display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; transition: background-color 0.3s; }
          .button:hover { background: #2563eb; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .contact-info { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .contact-info h3 { margin: 0 0 10px; color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
            <p>Your cleaning has been scheduled successfully</p>
          </div>
          <div class="content">
            <h2>Hi ${bookingData.customerInfo?.firstName || bookingData.customer?.firstName}!</h2>
            <p>Great news! Your moving booking has been confirmed. We're connecting you with qualified cleaners in your area.</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #1d4ed8;">Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${bookingData._id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${new Date(bookingData.moveDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${bookingData.moveTime || 'To be scheduled'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Home Size:</span>
                <span class="detail-value">${bookingData.homeSize.replace('-', ' ').toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service Type:</span>
                <span class="detail-value">${bookingData.moveType ? bookingData.moveType.charAt(0).toUpperCase() + bookingData.moveType.slice(1).replace('-', ' ') : 'Standard Cleaning'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${bookingData.pickupAddress.city}, ${bookingData.pickupAddress.state}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${bookingData.dropoffAddress.city}, ${bookingData.dropoffAddress.state}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><span class="status-badge">Confirmed</span></span>
              </div>
            </div>

            <div class="contact-info">
              <h3>What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Qualified cleaners will review your request</li>
                <li>You'll receive quotes within 24 hours</li>
                <li>Compare quotes and choose your cleaningr</li>
                <li>Confirm details directly with your chosen mover</li>
              </ul>
            </div>
            
            <p>Track your booking status and manage your cleaning:</p>
            <a href="${process.env.FRONTEND_URL_MAIL}/bookings/${bookingData._id}" class="button">View Booking Details</a>
            
            <p>Questions? Our support team is here to help!</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${bookingData.customerInfo?.email || bookingData.customer?.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Payment confirmation email (Customer)
  paymentConfirmation: (paymentData) => ({
    subject: 'Payment Confirmed - Your Booking is Secured!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .payment-details { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .amount { font-size: 24px; font-weight: 700; color: #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .security-note { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed!</h1>
            <p>Your booking deposit has been processed</p>
          </div>
          <div class="content">
            <h2>Hi ${paymentData.customerName}!</h2>
            <p>Thank you! Your payment has been successfully processed and your booking is now secured.</p>
            
            <div class="payment-details">
              <h3 style="margin-top: 0; color: #059669;">Payment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Payment ID:</span>
                <span class="detail-value">${paymentData.paymentIntentId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value amount">$${(paymentData.amount / 100).toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Type:</span>
                <span class="detail-value">Booking Deposit</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="color: #10b981; font-weight: 600;">PAID</span>
              </div>
            </div>

            <div class="security-note">
              <h3 style="margin-top: 0; color: #1d4ed8;">What This Means</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Your booking slot is now secured</li>
                <li>Cleaners are being notified about your job</li>
                <li>You'll receive quotes within 24 hours</li>
                <li>The remaining balance is paid directly to your chosen mover</li>
              </ul>
            </div>
            
            <p>View your booking and track progress:</p>
            <a href="${process.env.FRONTEND_URL_MAIL}/bookings/${paymentData.bookingId}" class="button">View Booking</a>
            
            <p>Keep this email as your payment receipt.</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${paymentData.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Job alert email (Cleaner)
  jobAlert: (jobData) => ({
    subject: 'New Moving Job Available in Your Area!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Alert</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .job-details { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .urgent-badge { display: inline-block; background: #ef4444; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; animation: pulse 2s infinite; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .items-list { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Alert!</h1>
            <p>A customer needs your cleaning services</p>
          </div>
          <div class="content">
            <h2>Hi ${jobData.moverName}!</h2>
            <p>A new cleaning job matching your service area is available. Act fast to secure this opportunity!</p>
            
            <div class="job-details">
              <h3 style="margin-top: 0; color: #d97706;">Job Details</h3>
              <div class="detail-row">
                <span class="detail-label">Job ID:</span>
                <span class="detail-value">#${jobData._id}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${new Date(jobData.cleaningDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${jobData.cleaningTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Home Size:</span>
                <span class="detail-value">${jobData.homeSize.replace('-', ' ').toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Distance:</span>
                <span class="detail-value">${jobData.cleaningType.charAt(0).toUpperCase() + jobData.cleaningType.slice(1)} Move</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${jobData.pickupAddress.city}, ${jobData.pickupAddress.state} ${jobData.pickupAddress.zipCode}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${jobData.dropoffAddress.city}, ${jobData.dropoffAddress.state} ${jobData.dropoffAddress.zipCode}</span>
              </div>
              ${jobData.isUrgent ? '<div class="detail-row"><span class="detail-label">Priority:</span><span class="detail-value"><span class="urgent-badge">URGENT</span></span></div>' : ''}
            </div>

            ${jobData.items && jobData.items.length > 0 ? `
            <div class="items-list">
              <h4 style="margin-top: 0;">Items to Move:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${jobData.items.slice(0, 5).map(item => `<li>${item.name} (${item.quantity}x)${item.heavy ? ' - Heavy Item' : ''}${item.fragile ? ' - Fragile' : ''}</li>`).join('')}
                ${jobData.items.length > 5 ? `<li><em>...and ${jobData.items.length - 5} more items</em></li>` : ''}
              </ul>
            </div>
            ` : ''}
            
            <p><strong>Time Sensitive:</strong> Other cleaners in your area have also been notified. Respond quickly to secure this job!</p>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/mover/jobs/${jobData._id}" class="button">View Job & Submit Quote</a>
            
            <p>Good luck securing this job!</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${jobData.moverEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Quote received email (Customer)
  quoteReceived: (quoteData) => ({
    subject: 'New Quote Received for Your Move!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Received</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .quote-details { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .price { font-size: 24px; font-weight: 700; color: #8b5cf6; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .mover-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Quote Received!</h1>
            <p>A cleaner has submitted a quote for your cleaning</p>
          </div>
          <div class="content">
            <h2>Hi ${quoteData.customerName}!</h2>
            <p>Great news! You've received a new quote for your upcoming move. Review the details below and compare with other quotes.</p>
            
            <div class="mover-info">
              <h3 style="margin-top: 0; color: #7c3aed;">Cleaner Information</h3>
              <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${quoteData.moverName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Rating:</span>
                <span class="detail-value">${quoteData.moverRating || 'New Rating'} ${quoteData.moverRating ? 'out of 5' : ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Experience:</span>
                <span class="detail-value">${quoteData.yearsInBusiness || 'Professional'} Years</span>
              </div>
            </div>

            <div class="quote-details">
              <h3 style="margin-top: 0; color: #7c3aed;">Quote Details</h3>
              <div class="detail-row">
                <span class="detail-label">Hourly Rate:</span>
                <span class="detail-value">$${quoteData.hourlyRate}/hour</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estimated Hours:</span>
                <span class="detail-value">${quoteData.estimatedHours} hours</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Labor Cost:</span>
                <span class="detail-value">$${quoteData.laborCost}</span>
              </div>
              ${quoteData.additionalFees?.length ? `
              <div class="detail-row">
                <span class="detail-label">Additional Fees:</span>
                <span class="detail-value">$${quoteData.additionalFees.reduce((sum, fee) => sum + fee.amount, 0)}</span>
              </div>
              ` : ''}
              <div class="detail-row" style="border-bottom: 2px solid #8b5cf6; font-weight: 700;">
                <span class="detail-label">Total Quote:</span>
                <span class="detail-value price">$${quoteData.total}</span>
              </div>
            </div>
            
            <p><strong>Don't wait too long!</strong> Good cleaners book up quickly, especially during peak moving season.</p>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/bookings/${quoteData.bookingId}" class="button">View & Compare Quotes</a>
            
            <p>Compare this quote with others and choose the best fit for your cleaning!</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${quoteData.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Job claimed email (Customer)
  jobClaimed: (jobData) => ({
    subject: 'Congratulations! Meet your cleaningr!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cleaner Assigned</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .mover-details { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .contact-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .message-box { background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Congratulations!</h1>
            <p>Your cleaning has been claimed by a professional mover</p>
          </div>
          <div class="content">
            <h2>Hi ${jobData.customerName}!</h2>
            <p>Excellent news! A professional cleaner has claimed your job and is ready to help with your cleaning.</p>
            
          
            
            <div class="mover-details">
              <h3 style="margin-top: 0; color: #059669;">Your Assigned Cleaner</h3>
              <div class="detail-row">
                <span class="detail-label">Company Name:</span>
                <span class="detail-value"><strong>${jobData.moverName}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Email:</span>
                <span class="detail-value">${jobData.moverEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Phone:</span>
                <span class="detail-value">${jobData.moverPhone || 'Available on platform'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Job Payment:</span>
                <span class="detail-value"><strong>${jobData.jobAmount ? `$${jobData.jobAmount}` : 'To be determined'}</strong></span>
              </div>
              ${jobData.estimatedTime ? `
              <div class="detail-row">
                <span class="detail-label">Estimated Completion:</span>
                <span class="detail-value">${jobData.estimatedTime}</span>
              </div>
              ` : ''}
            </div>

            ${jobData.moverMessage ? `
            <div class="message-box">
              <h4 style="margin-top: 0; color: #374151;">Message from Your Cleaner:</h4>
              <p style="margin-bottom: 0;">"${jobData.moverMessage}"</p>
            </div>
            ` : ''}
            
            <div class="contact-info">
              <h3 style="margin-top: 0; color: #1d4ed8;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Your cleaner will contact you within 24 hours</strong> to confirm details and schedule</li>
                <li>Discuss any special requirements or questions about your cleaning</li>
                <li>Confirm the final schedule and any additional services needed</li>
                <li>Your cleaner will arrive on the scheduled date ready to work</li>
              </ul>
            </div>
            
            <p><strong>Payment Security:</strong> Your deposit is secure with Sparkling Homes. The remaining payment will be made directly to your cleaner upon completion of the job.</p>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/bookings/${jobData.bookingId}" class="button">View Booking Details</a>
            
            <p>We're excited to help make your cleaning smooth and stress-free!</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${jobData.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking completion email (Customer)
  bookingCompleted: (completionData) => ({
    subject: 'Move Completed Successfully - Thank You for Choosing Sparkling Homes!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Move Completed</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .completion-details { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
          .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .thank-you-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .mover-info { background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Move Completed Successfully!</h1>
            <p>Thank you for choosing Sparkling Homes for your cleaning</p>
          </div>
          <div class="content">
            <h2>Hi ${completionData.customerName}!</h2>
            <p>We're delighted to inform you that your cleaning has been completed successfully. Thank you for trusting Sparkling Homes with your moving needs.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <span class="success-badge">Move Completed</span>
            </div>
            
            <div class="completion-details">
              <h3 style="margin-top: 0; color: #059669;">Move Summary</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${completionData.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${completionData.cleaningDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${completionData.fromLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${completionData.toLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Completion Date:</span>
                <span class="detail-value">${completionData.completionDate}</span>
              </div>
            </div>

            <div class="mover-info">
              <h3 style="margin-top: 0; color: #374151;">Your Moving Team</h3>
              <p><strong>Company:</strong> ${completionData.moverName}</p>
              <p><strong>Contact:</strong> ${completionData.moverEmail}</p>
              ${completionData.moverPhone ? `<p><strong>Phone:</strong> ${completionData.moverPhone}</p>` : '<p><strong>Phone:</strong> Available on platform</p>'}
            </div>
            
            <div class="thank-you-box">
              <h3 style="margin-top: 0; color: #1d4ed8;">Thank You for Choosing Sparkling Homes</h3>
              <p>We hope your moving experience was smooth and stress-free. Your cleaner has confirmed that all items have been safely delivered and the cleaning is complete.</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>All belongings have been safely transported</li>
                <li>Move completed to your satisfaction</li>
                <li>Final payment settled with your cleaningr</li>
                <li>Your booking is now closed</li>
              </ul>
            </div>
            
            <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h3 style="margin-top: 0; color: #0c4a6e;">Book & Cleaning – Quick Feedback</h3>
              <p style="margin-bottom: 15px;">We'd love to hear about your moving experience. Your feedback helps us maintain the highest standards of service.</p>
              
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0 5px; font-weight: 600; color: #374151;">1. How would you describe your overall experience with Book & Move?</p>
                <p style="margin: 0; color: #6b7280;">⭐⭐⭐⭐⭐</p>
              </div>
              
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0 5px; font-weight: 600; color: #374151;">2. How professional and friendly were your cleaners?</p>
                <p style="margin: 0; color: #6b7280;">⭐⭐⭐⭐⭐</p>
              </div>
              
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0 5px; font-weight: 600; color: #374151;">3. How careful were the cleaners with your belongings?</p>
                <p style="margin: 0; color: #6b7280;">⭐⭐⭐⭐⭐</p>
              </div>
              
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0 5px; font-weight: 600; color: #374151;">4. How easy was it to book and complete your cleaning with us?</p>
                <p style="margin: 0; color: #6b7280;">⭐⭐⭐⭐⭐</p>
              </div>
              
              <div style="margin: 15px 0;">
                <p style="margin: 10px 0 5px; font-weight: 600; color: #374151;">5. Would you recommend Book & Cleaning to others?</p>
                <p style="margin: 0; color: #6b7280;">✅ Yes / ❌ No</p>
              </div>
            </div>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/bookings/${completionData.bookingId}" class="button">View Booking Details</a>
            
            <p>Thank you once again for choosing Sparkling Homes. We look forward to serving you in the future!</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${completionData.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking completion email (Cleaner)
  bookingCompletedCleaner: (completionData) => ({
    subject: 'Congratulations! Cleaning Completed Successfully',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Move Completed</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .completion-details { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .success-badge { display: inline-block; background: #8b5cf6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .congratulations-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .next-steps { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Congratulations on Your Completed Move!</h1>
            <p>Another successful job through Sparkling Homes</p>
          </div>
          <div class="content">
            <h2>Hi ${completionData.moverName}!</h2>
            <p>Congratulations on successfully completing another cleaning through Sparkling Homes! Your professional service continues to make our platform a trusted choice for customers.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <span class="success-badge">Job Completed</span>
            </div>
            
            <div class="completion-details">
              <h3 style="margin-top: 0; color: #7c3aed;">Job Summary</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${completionData.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${completionData.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${completionData.cleaningDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${completionData.fromLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${completionData.toLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Completion Date:</span>
                <span class="detail-value">${completionData.completionDate}</span>
              </div>
              ${completionData.paymentAmount ? `
              <div class="detail-row">
                <span class="detail-label">Payment Received:</span>
                <span class="detail-value">$${completionData.paymentAmount}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="congratulations-box">
              <h3 style="margin-top: 0; color: #d97706;">Excellent Work!</h3>
              <p>Thank you for providing exceptional cleaning services. Your professionalism and attention to detail help maintain Sparkling Homes's reputation for quality service.</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Move completed successfully and on time</li>
                <li>Customer satisfaction maintained</li>
                <li>Professional service standards upheld</li>
                <li>Another positive experience delivered</li>
              </ul>
            </div>
            
            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1d4ed8;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>This job is now marked as completed in your dashboard</li>
                <li>You'll continue receiving new job alerts in your service area</li>
                <li>Customer may leave a review of your service</li>
                <li>Payment has been processed according to your agreement</li>
              </ul>
            </div>
            
            <p><strong>Keep Up the Great Work:</strong> Your commitment to excellence helps make every customer's moving day a success.</p>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/mover/dashboard" class="button">View Dashboard</a>
            
            <p>Thank you for being a valued partner with Sparkling Homes. We look forward to connecting you with more customers!</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${completionData.moverEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Booking cancellation email (Customer)
  bookingCancellation: (cancellationData) => ({
    subject: 'Booking Cancelled - Payment Not Completed',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancelled</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #1f2937; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .next-steps { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
            <p>Payment was not completed in time</p>
          </div>
          <div class="content">
            <h2>Hi ${cancellationData.customerName}!</h2>
            <p>We're sorry to inform you that your moving booking has been automatically cancelled because payment was not completed within the required time limit.</p>
            
            <div class="warning-box">
              <h3 style="margin-top: 0; color: #dc2626;">Booking Details (Cancelled)</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${cancellationData.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${new Date(cancellationData.cleaningDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${cancellationData.pickupAddress.city}, ${cancellationData.pickupAddress.state}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${cancellationData.dropoffAddress.city}, ${cancellationData.dropoffAddress.state}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value">${cancellationData.reason}</span>
              </div>
            </div>

            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1d4ed8;">What Happens Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Your booking has been completely removed from our system</li>
                <li>No charges have been made to your payment method</li>
                <li>You can create a new booking anytime you're ready</li>
                <li>Make sure to complete payment within 10 minutes of booking</li>
              </ul>
            </div>
            
            <p><strong>Important:</strong> To secure your cleaning, you must complete the deposit payment within 10 minutes of creating your booking. This ensures your moving slot is reserved and cleaners are notified.</p>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/create-booking" class="button">Create New Booking</a>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${cancellationData.customerName}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Long-Distance Booking Confirmation Email
  longDistanceBookingConfirmation: (data) => ({
    subject: 'Long-Distance Cleaning Request Received - Sparkling Homes',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Long-Distance Cleaning Request Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .highlight { background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .booking-details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #6b7280; }
          .next-steps { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Long-Distance Cleaning Request Received</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing Sparkling Homes for your long-distance move!</p>
          </div>
          
          <div class="content">
            <p>Dear ${data.customerName},</p>
            
            <p>We've received your long-distance cleaning request and our specialized team is already working on finding the perfect moving solution for you.</p>
            
            <div class="highlight">
              <h3 style="margin-top: 0; color: #1e40af;">Your Request is Being Processed</h3>
              <p style="margin-bottom: 0;">Our long-distance moving specialists will review your request and contact you within 24 hours with a personalized quote and detailed moving plan.</p>
            </div>

            <div class="booking-details">
              <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${data.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${new Date(data.cleaningDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${data.pickupAddress.city}, ${data.pickupAddress.state} ${data.pickupAddress.zipCode}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${data.dropoffAddress.city}, ${data.dropoffAddress.state} ${data.dropoffAddress.zipCode}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Home Size:</span>
                <span class="detail-value">${data.homeSize}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Services:</span>
                <span class="detail-value">${data.servicesRequested.join(', ')}</span>
              </div>
            </div>

            <div class="next-steps">
              <h3 style="margin-top: 0; color: #1e40af;">What Happens Next?</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Within 24 hours:</strong> Our team will contact you with a detailed quote</li>
                <li><strong>Personalized service:</strong> We'll work with specialized long-distance cleaners</li>
                <li><strong>No upfront payment:</strong> Payment is only required after you approve the quote</li>
                <li><strong>Full support:</strong> Our team will coordinate every aspect of your cleaning</li>
              </ul>
            </div>
            
            <p><strong>Important:</strong> Long-distance moves require special coordination and planning. Our team will ensure you get the best service and pricing for your specific needs.</p>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/bookings/${data.bookingId}" class="button">View Booking Details</a>
            
            <p>If you have any questions or need to make changes to your request, please contact our support team immediately.</p>
            
            <p>Best regards,<br><strong>The Sparkling Homes Long-Distance Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This email was sent to ${data.customerName}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Long-Distance Booking Notification Email (for support team)
  longDistanceBookingNotification: (data) => ({
    subject: `New Long-Distance Cleaning Request - ${data.bookingId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Long-Distance Cleaning Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .urgent { background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .booking-details { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #6b7280; }
          .items-list { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">New Long-Distance Cleaning Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Action Required - Customer Contact Within 24 Hours</p>
          </div>
          
          <div class="content">
            <div class="urgent">
              <h3 style="margin-top: 0; color: #dc2626;">URGENT: Long-Distance Cleaning Request</h3>
              <p style="margin-bottom: 0;"><strong>Customer expects contact within 24 hours.</strong> Please review the details below and coordinate with our long-distance moving partners.</p>
            </div>

            <div class="booking-details">
              <h3 style="margin-top: 0; color: #374151;">Customer Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${data.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${data.customerEmail}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${data.customerPhone || 'Not provided'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">#${data.bookingId}</span>
              </div>
            </div>

            <div class="booking-details">
              <h3 style="margin-top: 0; color: #374151;">Move Details</h3>
              <div class="detail-row">
                <span class="detail-label">Move Date:</span>
                <span class="detail-value">${new Date(data.cleaningDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${data.pickupAddress.street}, ${data.pickupAddress.city}, ${data.pickupAddress.state} ${data.pickupAddress.zipCode}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${data.dropoffAddress.street}, ${data.dropoffAddress.city}, ${data.dropoffAddress.state} ${data.dropoffAddress.zipCode}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Home Size:</span>
                <span class="detail-value">${data.homeSize}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Services:</span>
                <span class="detail-value">${data.servicesRequested.join(', ')}</span>
              </div>
            </div>

            ${data.items && data.items.length > 0 ? `
            <div class="items-list">
              <h4 style="margin-top: 0; color: #1e40af;">Items to Move</h4>
              ${data.items.map(item => `
                <div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong>${item.name}</strong> (${item.quantity}) - ${item.weight} lbs
                  ${item.fragile ? ' - <span style="color: #dc2626;">FRAGILE</span>' : ''}
                  ${item.heavy ? ' - <span style="color: #f59e0b;">HEAVY</span>' : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Next Steps</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Contact the customer within 24 hours</li>
                <li>Coordinate with long-distance moving partners</li>
                <li>Provide detailed quote and timeline</li>
                <li>Follow up until booking is confirmed</li>
              </ol>
            </div>
            
            <a href="${process.env.FRONTEND_URL_MAIL}/admin/bookings" class="button">View in Admin Panel</a>
            
            <p><strong>Note:</strong> This is a long-distance cleaning request that requires specialized handling and coordination with our long-distance moving partners.</p>
          </div>
          <div class="footer">
            <p><strong>marcusbrandon294@gmail.com</strong></p>
            <p>© ${new Date().getFullYear()} Sparkling Homes. All rights reserved.</p>
            <p>This notification was sent to the support team</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
export const sendEmail = async (to, template, data = {}) => {
  try {
    const transporter = createTransporter();
    const emailContent = template(data);
    
    const mailOptions = {
      from: `"Sparkling Homes" <${process.env.EMAIL_FROM || 'marcusbrandon294@gmail.com'}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'Sparkling Homes Notification System',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM}?subject=unsubscribe>`
      }
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Convenience functions for specific email types
export const sendWelcomeEmail = async (userData) => {
  return await sendEmail(userData.email, emailTemplates.welcome, userData);
};

export const sendWelcomeCleanerEmail = async (moverData) => {
  return await sendEmail(moverData.email, emailTemplates.welcomeCleaner, moverData);
};

export const sendPasswordResetEmail = async (userData, resetToken) => {
  return await sendEmail(userData.email, emailTemplates.passwordReset, { ...userData, resetToken });
};

export const sendPasswordResetConfirmationEmail = async (userData) => {
  return await sendEmail(userData.email, emailTemplates.passwordResetConfirmation, userData);
};

// New convenience functions for booking-related emails
export const sendBookingConfirmationEmail = async (bookingData) => {
  const email = bookingData.customerInfo?.email || bookingData.customer?.email;
  return await sendEmail(email, emailTemplates.bookingConfirmation, bookingData);
};

export const sendPaymentConfirmationEmail = async (paymentData) => {
  return await sendEmail(paymentData.customerEmail, emailTemplates.paymentConfirmation, paymentData);
};

export const sendJobAlertEmail = async (jobData, moverData) => {
  const emailData = {
    ...jobData,
    moverName: moverData.businessName || `${moverData.firstName} ${moverData.lastName}`,
    moverEmail: moverData.email
  };
  return await sendEmail(moverData.email, emailTemplates.jobAlert, emailData);
};

export const sendQuoteReceivedEmail = async (quoteData) => {
  return await sendEmail(quoteData.customerEmail, emailTemplates.quoteReceived, quoteData);
};

export const sendJobClaimedEmail = async (jobData) => {
  return await sendEmail(jobData.customerEmail, emailTemplates.jobClaimed, jobData);
};

export const sendBookingCompletedEmail = async (completionData) => {
  return await sendEmail(completionData.customerEmail, emailTemplates.bookingCompleted, completionData);
};

export const sendBookingCompletedCleanerEmail = async (completionData) => {
  return await sendEmail(completionData.moverEmail, emailTemplates.bookingCompletedCleaner, completionData);
};
