import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientType',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['User', 'Mover'],
    required: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: [
      'booking-confirmation',
      'job-alert',
      'quote-provided',
      'quote-accepted',
      'job-claimed',
      'job-completed',
      'payment-received',
      'subscription-expiring',
      'system-alert'
    ],
    required: true
  },
  
  // Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related data
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Booking', 'JobAlert', 'Payment', 'Subscription']
  },
  
  // Delivery status
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
  smsSent: { type: Boolean, default: false },
  smsSentAt: Date,
  pushSent: { type: Boolean, default: false },
  pushSentAt: Date,
  
  // Read status
  read: { type: Boolean, default: false },
  readAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Expiration
  expiresAt: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for isExpired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && Date.now() > this.expiresAt;
});

// Pre-save middleware to set default expiration
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    // Set default expiration based on type
    const defaultExpirations = {
      'booking-confirmation': 30, // 30 days
      'job-alert': 1, // 1 day
      'quote-provided': 7, // 7 days
      'quote-accepted': 30,
      'job-claimed': 30,
      'job-completed': 30,
      'payment-received': 30,
      'subscription-expiring': 7,
      'system-alert': 7
    };
    
    const days = defaultExpirations[this.type] || 7;
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
