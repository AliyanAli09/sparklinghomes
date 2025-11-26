import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Payment Details
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'eur', 'gbp']
  },
  
  // Payment Type
  type: {
    type: String,
    required: true,
    enum: ['booking-deposit', 'mover-subscription', 'refund']
  },
  emailSent: { type: Boolean, default: false },
  // Stripe Details
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType',
    required: false // Not required for guest payments
  },
  userType: {
    type: String,
    enum: ['User', 'Mover', 'guest', 'customer'],
    default: 'User'
  },
  
  // References (legacy fields for backward compatibility)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  mover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mover',
    required: false
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Guest Information
  guestEmail: {
    type: String,
    required: function() {
      return this.userType === 'guest';
    }
  },
  
  // Metadata
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  paidAt: Date,
  refundedAt: Date,
  
  // Error handling
  failureReason: String,
  lastPaymentError: {
    code: String,
    message: String,
    declineCode: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency.toUpperCase()
  }).format(this.amount / 100); // Stripe amounts are in cents
});

// Indexes for better performance
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ mover: 1, createdAt: -1 });
paymentSchema.index({ userId: 1, userType: 1, createdAt: -1 });
paymentSchema.index({ guestEmail: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ createdAt: -1 });

// Pre-save middleware to update timestamps
paymentSchema.pre('save', function(next) {
  if (this.status === 'succeeded' && !this.paidAt) {
    this.paidAt = new Date();
  }
  if (this.status === 'refunded' && !this.refundedAt) {
    this.refundedAt = new Date();
  }
  next();
});

// Instance method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'succeeded' && this.paymentType !== 'refund';
};

// Instance method to get refund amount
paymentSchema.methods.getRefundAmount = function() {
  if (!this.canBeRefunded()) return 0;
  return this.amount;
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
