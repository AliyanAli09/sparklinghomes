import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // References
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reviewerType',
    required: false // Not required for guest reviews
  },
  reviewerType: {
    type: String,
    enum: ['User', 'Mover'],
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'revieweeType',
    required: true
  },
  revieweeType: {
    type: String,
    enum: ['User', 'Mover'],
    required: true
  },
  
  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  
  // Detailed ratings for movers
  detailedRating: {
    punctuality: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    care: { type: Number, min: 1, max: 5 }, // care of belongings
    communication: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 } // value for money
  },
  
  // Review content
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters'],
    minlength: [10, 'Comment must be at least 10 characters']
  },
  
  // Review categories (for filtering)
  categories: [{
    type: String,
    enum: [
      'excellent-service',
      'on-time',
      'careful-handling',
      'professional',
      'good-communication',
      'fair-pricing',
      'would-recommend',
      'late-arrival',
      'damaged-items',
      'unprofessional',
      'poor-communication',
      'overpriced',
      'would-not-recommend'
    ]
  }],
  
  // Verification
  isVerified: {
    type: Boolean,
    default: true // Auto-verified since it's tied to actual bookings
  },
  
  // Response from reviewee
  response: {
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot be more than 500 characters']
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'revieweeType'
    }
  },
  
  // Helpful votes
  helpfulVotes: {
    count: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // Moderation
  isVisible: {
    type: Boolean,
    default: true
  },
  moderationFlags: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant']
    },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date, default: Date.now }
  }],
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderationNotes: String,
  
  // Photos (optional)
  photos: [String], // Cloudinary URLs
  
  // Guest reviewer information (for non-authenticated reviews)
  guestReviewer: {
    name: String,
    email: String
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for overall detailed rating average (for movers)
reviewSchema.virtual('detailedRatingAverage').get(function() {
  if (!this.detailedRating) return null;
  
  const ratings = Object.values(this.detailedRating).filter(rating => rating != null);
  if (ratings.length === 0) return null;
  
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
});

// Static method to calculate average rating for a mover
reviewSchema.statics.calculateMoverRating = async function(moverId) {
  const result = await this.aggregate([
    {
      $match: {
        reviewee: new mongoose.Types.ObjectId(moverId),
        revieweeType: 'Mover',
        isVisible: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (result.length === 0) {
    return { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
  
  const data = result[0];
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  data.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });
  
  return {
    average: Math.round(data.averageRating * 10) / 10,
    count: data.totalReviews,
    distribution
  };
};

// Pre-save middleware to update mover's rating
reviewSchema.post('save', async function() {
  if (this.revieweeType === 'Mover') {
    const Mover = mongoose.model('Mover');
    const ratingData = await this.constructor.calculateMoverRating(this.reviewee);
    
    await Mover.findByIdAndUpdate(this.reviewee, {
      'rating.average': ratingData.average,
      'rating.count': ratingData.count
    });
  }
});

// Pre-remove middleware to update mover's rating when review is deleted
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.revieweeType === 'Mover') {
    const Mover = mongoose.model('Mover');
    const ratingData = await doc.constructor.calculateMoverRating(doc.reviewee);
    
    await Mover.findByIdAndUpdate(doc.reviewee, {
      'rating.average': ratingData.average,
      'rating.count': ratingData.count
    });
  }
});

// Instance method to mark review as helpful
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpfulVotes.voters.includes(userId)) {
    this.helpfulVotes.voters.push(userId);
    this.helpfulVotes.count++;
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to unmark review as helpful
reviewSchema.methods.unmarkHelpful = function(userId) {
  const index = this.helpfulVotes.voters.indexOf(userId);
  if (index > -1) {
    this.helpfulVotes.voters.splice(index, 1);
    this.helpfulVotes.count = Math.max(0, this.helpfulVotes.count - 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Ensure only one review per booking per reviewer type
reviewSchema.index({ booking: 1, reviewerType: 1 }, { unique: true });

// Other indexes for performance
reviewSchema.index({ reviewee: 1, revieweeType: 1, isVisible: 1 });
reviewSchema.index({ reviewer: 1, reviewerType: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'helpfulVotes.count': -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
