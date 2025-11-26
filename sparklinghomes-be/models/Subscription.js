import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  // Mover reference
  mover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mover',
    required: true
  },
  
  // Stripe subscription details
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  
  // Subscription details
  plan: {
    type: String,
    default: 'monthly',
    enum: ['monthly', 'annual']
  },
  amount: {
    type: Number,
    required: true,
    default: 9700 // $97.00 in cents
  },
  currency: {
    type: String,
    default: 'usd'
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid'],
    default: 'incomplete'
  },
  
  // Billing cycle
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  
  // Payment method
  defaultPaymentMethod: {
    type: String,
    description: 'Stripe payment method ID'
  },
  
  // Trial information
  trialStart: Date,
  trialEnd: Date,
  
  // Cancellation
  canceledAt: Date,
  cancellationReason: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amount
subscriptionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency.toUpperCase()
  }).format(this.amount / 100);
});

// Virtual for subscription status
subscriptionSchema.virtual('isActive').get(function() {
  return ['active', 'trialing'].includes(this.status);
});

// Virtual for days until renewal
subscriptionSchema.virtual('daysUntilRenewal').get(function() {
  if (!this.currentPeriodEnd || !this.isActive) return null;
  const now = new Date();
  const renewal = new Date(this.currentPeriodEnd);
  const diffTime = renewal - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Indexes for better performance
subscriptionSchema.index({ mover: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Pre-save middleware to update status
subscriptionSchema.pre('save', function(next) {
  if (this.status === 'canceled' && !this.canceledAt) {
    this.canceledAt = new Date();
  }
  next();
});

// Instance method to check if subscription is active
subscriptionSchema.methods.isSubscriptionActive = function() {
  return this.isActive;
};

// Instance method to get next billing date
subscriptionSchema.methods.getNextBillingDate = function() {
  return this.currentPeriodEnd;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
