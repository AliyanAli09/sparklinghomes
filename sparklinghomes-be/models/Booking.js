import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // References
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for guest bookings
  },
  // Guest customer information (for non-authenticated bookings)
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    isGuest: { type: Boolean, default: false }
  },
  mover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mover',
    required: false // Changed to false - system will assign mover
  },
  
  // Job Assignment
  jobAssignment: {
    status: {
      type: String,
      enum: ['unassigned', 'alerted', 'claimed', 'assigned', 'in-progress', 'completed'],
      default: 'unassigned'
    },
    assignedAt: Date,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'assignedByType'
    },
    assignedByType: {
      type: String,
      enum: ['system', 'admin', 'mover']
    },
    alertsSent: { type: Number, default: 0 },
    lastAlertSent: Date,
    expiresAt: Date // When job assignment expires
  },
  
  // Moving Details
  moveDate: {
    type: Date,
    required: [true, 'Move date is required']
  },
  moveTime: {
    type: String,
    required: [true, 'Move time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true,
    min: [1, 'Estimated duration must be at least 1 hour']
  },
  
  // Addresses
  pickupAddress: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'USA' },
    floor: String,
    elevator: { type: Boolean, default: false },
    stairs: { type: Number, default: 0 },
    parkingDistance: { type: Number, default: 0 }, // in feet
    notes: String
  },
  dropoffAddress: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'USA' },
    floor: String,
    elevator: { type: Boolean, default: false },
    stairs: { type: Number, default: 0 },
    parkingDistance: { type: Number, default: 0 }, // in feet
    notes: String
  },
  
  // Move Details
  moveType: {
    type: String,
    enum: ['local', 'long-distance', 'commercial', 'residential'],
    required: true
  },
  homeSize: {
    type: String,
    enum: ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 'small-office', 'medium-office', 'large-office', '2-labor-only', '3-labor-only'],
    required: true
  },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    weight: Number, // in pounds
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    fragile: { type: Boolean, default: false },
    heavy: { type: Boolean, default: false }, // over 50 lbs
    notes: String
  }],
  
  // Services Required
  servicesRequested: [{
    type: String,
    enum: [
      'loading-only',
      'unloading-only',
      'full-service',
      'packing',
      'unpacking',
      'furniture-disassembly',
      'furniture-assembly',
      'piano-moving',
      'cleaning',
      'storage'
    ]
  }],
  packingRequired: { type: Boolean, default: false },
  
  // Pricing
  quote: {
    hourlyRate: Number,
    estimatedHours: Number,
    laborCost: Number,
    travelFee: Number,
    packingFee: Number,
    equipmentFee: Number,
    additionalFees: [{
      description: String,
      amount: Number
    }],
    subtotal: Number,
    tax: Number,
    total: Number,
    currency: { type: String, default: 'USD' }
  },
  
  // Booking Status
  status: {
    type: String,
    enum: [
      'pending-assignment', // New status for unassigned jobs
      'quote-requested',
      'quote-provided',
      'quote-accepted',
      'confirmed',
      'in-progress',
      'completed',
      'cancelled',
      'disputed'
    ],
    default: 'pending-assignment'
  },
  
  // Cancellation details
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'cancelledByType'
  },
  cancelledByType: {
    type: String,
    enum: ['User', 'Mover', 'Admin']
  },
  
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'messages.senderType'
    },
    senderType: {
      type: String,
      enum: ['User', 'Mover']
    },
    message: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],
  
  // Special Instructions
  specialInstructions: String,
  accessNotes: String, // building access, gate codes, etc.
  
  // Completion Details
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: Number,
  finalCost: Number,
  completionNotes: String,
  customerSignature: String,
  
  // Review flags
  customerReviewed: { type: Boolean, default: false },
  moverReviewed: { type: Boolean, default: false },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'deposit-paid', 'fully-paid', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: String,
  paymentIntentId: String, // Stripe payment intent ID

  // Deposit information
  deposit: {
    amount: {
      type: Number,
      required: true,
      default: 9700 // $97.00 in cents - standard deposit
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    paymentIntentId: String
  },

  // Final payment (paid directly to mover)
  finalPayment: {
    amount: Number,
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    paymentMethod: String
  },

  // Long-distance processing flag
  longDistanceProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ mover: 1, status: 1 });
bookingSchema.index({ 'pickupAddress.zipCode': 1 });
bookingSchema.index({ 'dropoffAddress.zipCode': 1 });
bookingSchema.index({ moveDate: 1 });
bookingSchema.index({ 'jobAssignment.status': 1 });

// Virtual for isUrgent
bookingSchema.virtual('isUrgent').get(function() {
  if (!this.moveDate) return false;
  const daysUntilMove = Math.ceil((this.moveDate - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilMove <= 2;
});

// Virtual for canBeAssigned
bookingSchema.virtual('canBeAssigned').get(function() {
  return this.status === 'pending-assignment' && 
         this.jobAssignment.status === 'unassigned' &&
         this.deposit.paid;
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Validate that either customer or customerInfo is provided
  if (!this.customer && !this.customerInfo) {
    return next(new Error('Either customer reference or customer information is required'));
  }
  
  // Set deposit amount from quote if provided
  if (this.isNew && this.quote && this.quote.deposit) {
    this.deposit.amount = this.quote.deposit * 100; // Convert to cents
  }
  
  // Set job assignment expiration if not set
  if (this.isNew && !this.jobAssignment.expiresAt) {
    this.jobAssignment.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  
  // Update status based on job assignment
  if (this.jobAssignment.status === 'assigned' && this.status === 'pending-assignment') {
    this.status = 'quote-requested';
  }
  
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
