import mongoose from 'mongoose';

const jobAlertSchema = new mongoose.Schema({
  // Job details
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  
  // Mover who received the alert
  mover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mover',
    required: true
  },
  
  // Alert status
  status: {
    type: String,
    enum: ['sent', 'viewed', 'interested', 'not-interested', 'claimed', 'completed'],
    default: 'sent'
  },
  
  // Response details
  response: {
    interested: { type: Boolean, default: false },
    responseTime: Date,
    message: String,
    estimatedPrice: Number,
    estimatedTime: Number
  },
  
  // Notification tracking
  notifications: {
    emailSent: { type: Boolean, default: false },
    emailSentAt: Date,
    smsSent: { type: Boolean, default: false },
    smsSentAt: Date,
    pushSent: { type: Boolean, default: false },
    pushSentAt: Date
  },
  
  // Timestamps
  sentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // Alert expires after 24 hours
  viewedAt: Date,
  respondedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
jobAlertSchema.index({ mover: 1, status: 1 });
jobAlertSchema.index({ booking: 1, status: 1 });
jobAlertSchema.index({ expiresAt: 1 });

// Virtual for alert age
jobAlertSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.sentAt) / (1000 * 60 * 60));
});

// Virtual for isExpired
jobAlertSchema.virtual('isExpired').get(function() {
  return Date.now() > this.expiresAt;
});

// Pre-save middleware to set expiration
jobAlertSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

const JobAlert = mongoose.model('JobAlert', jobAlertSchema);

export default JobAlert;
