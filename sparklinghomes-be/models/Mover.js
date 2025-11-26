import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const moverSchema = new mongoose.Schema({
  // Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot be more than 100 characters']
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  
  // Contact Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  
  // Business Address
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'USA' }
  },
  
  // Service Areas (array of zip codes or cities they serve)
  serviceAreas: [{
    zipCode: String,
    city: String,
    state: String,
    maxDistance: { type: Number, default: 50 } // miles from base location
  }],
  
  // Services Offered
  services: [{
    type: String,
    enum: [
      'local-moving',
      'long-distance-moving',
      'commercial-moving',
      'residential-moving',
      'piano-moving',
      'furniture-moving',
      'packing-services',
      'storage-services',
      'loading-unloading',
      'cleaning-services'
    ]
  }],
  
  // Pricing
  pricing: {
    hourlyRate: {
      type: Number,
      required: true,
      min: [0, 'Hourly rate must be positive']
    },
    minimumHours: {
      type: Number,
      default: 2,
      min: [1, 'Minimum hours must be at least 1']
    },
    travelFee: {
      type: Number,
      default: 0,
      min: [0, 'Travel fee must be positive']
    }
  },
  
  // Availability
  availability: {
    monday: { available: Boolean, hours: { start: String, end: String } },
    tuesday: { available: Boolean, hours: { start: String, end: String } },
    wednesday: { available: Boolean, hours: { start: String, end: String } },
    thursday: { available: Boolean, hours: { start: String, end: String } },
    friday: { available: Boolean, hours: { start: String, end: String } },
    saturday: { available: Boolean, hours: { start: String, end: String } },
    sunday: { available: Boolean, hours: { start: String, end: String } }
  },
  
  // Team Information
  teamSize: {
    type: Number,
    required: true,
    min: [1, 'Team size must be at least 1'],
    max: [20, 'Team size cannot exceed 20']
  },
  equipment: [{
    type: String,
    enum: [
      'moving-truck-small',
      'moving-truck-medium',
      'moving-truck-large',
      'dolly',
      'straps',
      'blankets',
      'boxes',
      'packing-materials',
      'piano-dolly',
      'furniture-pads'
    ]
  }],
  
  // Verification & Insurance
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    url: { type: String, required: true }, // Cloudinary URL
    publicId: { type: String, required: true }, // Cloudinary public ID
    documentType: {
      type: String,
      enum: ['license', 'insurance', 'bonding', 'background-check', 'vehicle', 'dot', 'other']
    },
    description: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  insuranceAmount: {
    type: Number,
    required: true,
    min: [100000, 'Insurance coverage must be at least $100,000']
  },
  
  // Rating & Reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  
  // Business Details
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  yearsInBusiness: {
    type: Number,
    min: [0, 'Years in business must be positive']
  },
  photos: [String], // Cloudinary URLs
  
  // Account Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  },
  role: {
    type: String,
    default: 'mover'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  // Subscription Status
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'pending'],
    default: 'pending'
  },
  subscriptionExpiresAt: Date,
  
  // Stripe Customer ID
  stripeCustomerId: String,
  
  // Verification tokens
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Verification details
  verificationNotes: String,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
moverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual populate bookings
moverSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'mover'
});

// Virtual populate reviews
moverSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'mover'
});

// Pre-save middleware to hash password
moverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
moverSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to create password reset token
moverSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
};

// Instance method to check if mover is available on a date
moverSchema.methods.isAvailableOn = function(date) {
  const dayName = date.toLocaleLowerCase();
  return this.availability[dayName]?.available || false;
};

// Indexes for better performance
// moverSchema.index({ email: 1 }); // Removed - duplicate of unique: true on email field
moverSchema.index({ 'address.city': 1, 'address.state': 1 });
moverSchema.index({ 'serviceAreas.zipCode': 1 });
moverSchema.index({ services: 1 });
moverSchema.index({ 'rating.average': -1 });
moverSchema.index({ status: 1 });
moverSchema.index({ createdAt: -1 });

const Mover = mongoose.model('Mover', moverSchema);

export default Mover;
