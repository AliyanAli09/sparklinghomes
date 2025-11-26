import { asyncHandler } from '../middleware/errorHandler.js';
import Mover from '../models/Mover.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { catchAsync } from '../utils/catchAsync.js';
import { uploadImage } from '../utils/cloudinary.js';

// Mover Onboarding
export const createMoverProfile = catchAsync(async (req, res) => {
  const {
    businessName,
    firstName,
    lastName,
    email,
    phone,
    address,
    serviceAreas,
    availability,
    vehicles,
    services,
    pricing,
    teamSize,
    equipment,
    documents,
    licenseNumber,
    insuranceAmount,
    yearsInBusiness,
    description
  } = req.body;

  // Check if current user already has a mover profile
  const existingMover = await Mover.findById(req.user._id);
  
  if (existingMover) {
    // Update existing mover profile
    const updatedMover = await Mover.findByIdAndUpdate(
      req.user._id,
      {
        businessName,
        firstName,
        lastName,
        email,
        phone,
        address,
        serviceAreas,
        availability,
        vehicles,
        services,
        pricing,
        teamSize,
        equipment,
        verificationDocuments: [
          {
            url: documents.proofOfInsurance,
            publicId: `insurance_${req.user._id}_${Date.now()}`,
            documentType: 'insurance',
            uploadedAt: new Date()
          },
          {
            url: documents.businessLicense,
            publicId: `license_${req.user._id}_${Date.now()}`,
            documentType: 'license',
            uploadedAt: new Date()
          },
          {
            url: documents.vehicleRegistration,
            publicId: `vehicle_${req.user._id}_${Date.now()}`,
            documentType: 'vehicle',
            uploadedAt: new Date()
          },
          {
            url: documents.backgroundCheck,
            publicId: `background_${req.user._id}_${Date.now()}`,
            documentType: 'background-check',
            uploadedAt: new Date()
          },
          {
            url: documents.bondingCertificate,
            publicId: `bonding_${req.user._id}_${Date.now()}`,
            documentType: 'bonding',
            uploadedAt: new Date()
          }
        ].filter(doc => doc.url), // Only include documents that were uploaded
        licenseNumber,
        insuranceAmount,
        yearsInBusiness,
        description,
        status: 'approved', // Auto-approve after onboarding completion
        role: 'mover',
        isActive: true,
        isVerified: true // Auto-verify after onboarding completion
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Mover profile updated successfully',
      data: {
        mover: {
          id: updatedMover._id,
          businessName: updatedMover.businessName,
          email: updatedMover.email,
          status: updatedMover.status
        }
      }
    });
  }

  // Create new mover profile
  const newMover = new Mover({
    _id: req.user._id, // Use the authenticated user's ID
    businessName,
    firstName,
    lastName,
    email,
    phone,
    address,
    serviceAreas,
    availability,
    vehicles,
    services,
    pricing,
    teamSize,
    equipment,
            verificationDocuments: [
          {
            url: documents.proofOfInsurance,
            publicId: `insurance_${req.user._id}_${Date.now()}`,
            documentType: 'insurance',
            uploadedAt: new Date()
          },
          {
            url: documents.businessLicense,
            publicId: `license_${req.user._id}_${Date.now()}`,
            documentType: 'license',
            uploadedAt: new Date()
          },
          {
            url: documents.vehicleRegistration,
            publicId: `vehicle_${req.user._id}_${Date.now()}`,
            documentType: 'vehicle',
            uploadedAt: new Date()
          },
          {
            url: documents.backgroundCheck,
            publicId: `background_${req.user._id}_${Date.now()}`,
            documentType: 'background-check',
            uploadedAt: new Date()
          },
          {
            url: documents.bondingCertificate,
            publicId: `bonding_${req.user._id}_${Date.now()}`,
            documentType: 'bonding',
            uploadedAt: new Date()
          }
        ].filter(doc => doc.url), // Only include documents that were uploaded
    licenseNumber,
    insuranceAmount,
    yearsInBusiness,
    description,
    status: 'approved', // Auto-approve after onboarding completion
    role: 'mover',
    isActive: true,
    isVerified: true // Auto-verify after onboarding completion
  });

  await newMover.save();

  res.status(201).json({
    success: true,
    message: 'Mover profile created successfully',
    data: {
      mover: {
        id: newMover._id,
        businessName: newMover.businessName,
        email: newMover.email,
        status: newMover.status
      }
    }
  });
});

// Get current mover's profile
export const getCurrentMover = catchAsync(async (req, res) => {
  const mover = await Mover.findById(req.user._id).select('-password -verificationToken -passwordResetToken');
  
  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    data: mover
  });
});

// Get mover profile
export const getMoverProfile = catchAsync(async (req, res) => {
  const mover = await Mover.findById(req.params.id)
    .select('-password -verificationToken -passwordResetToken');

  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    data: mover
  });
});

// Update mover profile
export const updateMoverProfile = catchAsync(async (req, res) => {
  const mover = await Mover.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password -verificationToken -passwordResetToken');

  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    message: 'Mover profile updated successfully',
    data: mover
  });
});

// Get movers by service area
export const getMoversByServiceArea = catchAsync(async (req, res) => {
  const { zipCode, city, state, maxDistance = 50 } = req.query;

  let query = {
    status: 'approved',
    isActive: true
  };

  if (zipCode || city || state) {
    query.serviceAreas = {
      $elemMatch: {
        ...(zipCode && { zipCode }),
        ...(city && { city: { $regex: city, $options: 'i' } }),
        ...(state && { state: { $regex: state, $options: 'i' } }),
        maxDistance: { $gte: parseInt(maxDistance) }
      }
    };
  }

  const movers = await Mover.find(query)
    .select('businessName firstName lastName rating services pricing address serviceAreas')
    .sort({ 'rating.average': -1 });

  res.json({
    success: true,
    data: {
      movers,
      count: movers.length
    }
  });
});

// Get mover availability
export const getMoverAvailability = catchAsync(async (req, res) => {
  const { moverId, date } = req.query;

  const mover = await Mover.findById(moverId)
    .select('availability');

  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  // Check if the requested date is available
  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const isAvailable = mover.availability[dayName]?.available || false;

  res.json({
    success: true,
    data: {
      isAvailable,
      availability: mover.availability[dayName] || null
    }
  });
});

// @desc    Get all movers
// @route   GET /api/movers
// @access  Private/Admin
export const getMovers = asyncHandler(async (req, res, next) => {
  const movers = await Mover.find({}).select('-password');
  
  res.status(200).json({
    status: 'success',
    results: movers.length,
    data: {
      movers
    }
  });
});

// @desc    Get single mover
// @route   GET /api/movers/:id
// @access  Public
export const getMover = asyncHandler(async (req, res, next) => {
  const mover = await Mover.findById(req.params.id)
    .select('-password')
    .populate('reviews', 'rating comment createdAt reviewer');

  if (!mover) {
    return res.status(404).json({
      status: 'error',
      message: 'Mover not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      mover
    }
  });
});

// @desc    Search movers
// @route   GET /api/movers/search
// @access  Public
export const searchMovers = asyncHandler(async (req, res, next) => {
  const {
    zipCode,
    city,
    state,
    services,
    maxDistance = 50,
    minRating = 0,
    maxPrice,
    sortBy = 'rating'
  } = req.query;

  // Build query
  let query = {
    status: 'approved',
    isActive: true
  };

  // Location-based search
  if (zipCode || city) {
    query.$or = [];
    
    if (zipCode) {
      query.$or.push({ 'serviceAreas.zipCode': zipCode });
    }
    
    if (city && state) {
      query.$or.push({ 
        'serviceAreas.city': new RegExp(city, 'i'),
        'serviceAreas.state': state
      });
    }
  }

  // Services filter
  if (services) {
    const serviceArray = Array.isArray(services) ? services : [services];
    query.services = { $in: serviceArray };
  }

  // Rating filter
  if (minRating > 0) {
    query['rating.average'] = { $gte: minRating };
  }

  // Price filter
  if (maxPrice) {
    query['pricing.hourlyRate'] = { $lte: maxPrice };
  }

  // Execute query
  let sortOptions = {};
  switch (sortBy) {
    case 'rating':
      sortOptions = { 'rating.average': -1, 'rating.count': -1 };
      break;
    case 'price-low':
      sortOptions = { 'pricing.hourlyRate': 1 };
      break;
    case 'price-high':
      sortOptions = { 'pricing.hourlyRate': -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    default:
      sortOptions = { 'rating.average': -1 };
  }

  const movers = await Mover.find(query)
    .select('-password -verificationDocuments')
    .sort(sortOptions)
    .limit(20);

  res.status(200).json({
    status: 'success',
    results: movers.length,
    data: {
      movers
    }
  });
});

// @desc    Update mover
// @route   PUT /api/movers/:id
// @access  Private
export const updateMover = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    businessName: req.body.businessName,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    address: req.body.address,
    services: req.body.services,
    teamSize: req.body.teamSize,
    equipment: req.body.equipment,
    description: req.body.description,
    yearsInBusiness: req.body.yearsInBusiness,
    status: req.body.status // Admin only
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  // Only admin can update status
  if (fieldsToUpdate.status && req.user.role !== 'admin') {
    delete fieldsToUpdate.status;
  }

  const mover = await Mover.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      mover
    }
  });
});

// @desc    Delete mover
// @route   DELETE /api/movers/:id
// @access  Private
export const deleteMover = asyncHandler(async (req, res, next) => {
  await Mover.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get mover bookings
// @route   GET /api/movers/me/bookings
// @access  Private/Mover
export const getMoverBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ mover: req.user._id })
    .populate('customer', 'firstName lastName phone')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings
    }
  });
});

// @desc    Get mover reviews
// @route   GET /api/movers/:id/reviews
// @access  Public
export const getMoverReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ 
    reviewee: req.params.id,
    revieweeType: 'Mover',
    isVisible: true
  })
  .populate('reviewer', 'firstName lastName')
  .sort('-createdAt')
  .limit(20);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

// @desc    Upload mover photos
// @route   POST /api/movers/upload-photos
// @access  Private/Mover
export const uploadMoverPhotos = asyncHandler(async (req, res, next) => {
  // This would handle photo upload to Cloudinary
  res.status(200).json({
    status: 'success',
    message: 'Photo upload functionality will be implemented'
  });
});

// @desc    Upload verification documents during onboarding (no mover profile required)
// @route   POST /api/movers/upload-documents-onboarding
// @access  Private
export const uploadVerificationDocumentsOnboarding = asyncHandler(async (req, res, next) => {
  console.log('Onboarding upload request received:', {
    body: req.body,
    file: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file',
    user: req.user ? {
      id: req.user._id,
      role: req.user.role,
      userType: req.userType
    } : 'No user'
  });

  const { documentType, description } = req.body;
  
  if (!req.file) {
    console.log('No file in request');
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  if (!documentType) {
    console.log('No document type in request body');
    return res.status(400).json({
      success: false,
      message: 'Document type is required'
    });
  }

  // Validate document type
  const allowedDocumentTypes = ['insurance', 'license', 'vehicle', 'background', 'bonding', 'dot', 'other'];
  if (!allowedDocumentTypes.includes(documentType)) {
    console.log('Invalid document type:', documentType);
    return res.status(400).json({
      success: false,
      message: `Invalid document type. Allowed types: ${allowedDocumentTypes.join(', ')}`
    });
  }

  try {
    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, {
      folder: 'mover-documents-onboarding',
      public_id: `${documentType}_${req.user._id}_${Date.now()}`,
      resource_type: 'auto'
    });

    console.log('File uploaded to Cloudinary:', result.secure_url);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: {
          documentType,
          url: result.secure_url,
          publicId: result.public_id,
          description: description || '',
          uploadedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// @desc    Upload verification documents
// @route   POST /api/movers/upload-documents
// @access  Private/Mover
export const uploadVerificationDocuments = asyncHandler(async (req, res, next) => {
  console.log('Upload request received:', {
    body: req.body,
    file: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file',
    user: req.user ? {
      id: req.user._id,
      role: req.user.role,
      userType: req.userType
    } : 'No user'
  });

  const { documentType, description } = req.body;
  
  if (!req.file) {
    console.log('No file in request');
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  if (!documentType) {
    console.log('No document type in request body');
    return res.status(400).json({
      success: false,
      message: 'Document type is required'
    });
  }

  // Validate document type
  const allowedDocumentTypes = ['insurance', 'license', 'vehicle', 'background', 'bonding', 'dot', 'other'];
  if (!allowedDocumentTypes.includes(documentType)) {
    console.log('Invalid document type:', documentType);
    return res.status(400).json({
      success: false,
      message: `Invalid document type. Allowed types: ${allowedDocumentTypes.join(', ')}`
    });
  }

  try {
    // Check if user is a mover
    const mover = await Mover.findById(req.user._id);
    if (!mover) {
      console.log('Mover not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Mover profile not found. Please complete your mover profile first.'
      });
    }

    console.log('Mover found:', mover._id);

    // Upload to Cloudinary
    const result = await uploadImage(req.file.buffer, {
      folder: 'mover-documents',
      public_id: `${documentType}_${req.user._id}_${Date.now()}`,
      resource_type: 'auto'
    });

    console.log('File uploaded to Cloudinary:', result.secure_url);

    // Remove existing document of same type if exists
    mover.verificationDocuments = mover.verificationDocuments.filter(
      doc => doc.documentType !== documentType
    );

    // Add new document
    mover.verificationDocuments.push({
      documentType,
      url: result.secure_url,
      publicId: result.public_id,
      description: description || '',
      uploadedAt: new Date()
    });

    await mover.save();
    console.log('Document saved to mover profile');

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: {
          documentType,
          url: result.secure_url,
          publicId: result.public_id,
          description: description || '',
          uploadedAt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// @desc    Get mover's uploaded documents
// @route   GET /api/movers/me/documents
// @access  Private/Mover
export const getMoverDocuments = asyncHandler(async (req, res, next) => {
  const mover = await Mover.findById(req.user._id).select('verificationDocuments');
  
  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  res.json({
    success: true,
    data: {
      documents: mover.verificationDocuments
    }
  });
});

// @desc    Delete a specific document
// @route   DELETE /api/movers/me/documents/:documentId
// @access  Private/Mover
export const deleteMoverDocument = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;
  
  const mover = await Mover.findById(req.user._id);
  
  if (!mover) {
    return res.status(404).json({
      success: false,
      message: 'Mover not found'
    });
  }

  // Find the document
  const document = mover.verificationDocuments.id(documentId);
  
  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Remove from array
  mover.verificationDocuments.pull(documentId);
  await mover.save();

  res.json({
    success: true,
    message: 'Document deleted successfully'
  });
});

// @desc    Update availability
// @route   PUT /api/movers/availability
// @access  Private/Mover
export const updateAvailability = asyncHandler(async (req, res, next) => {
  const mover = await Mover.findByIdAndUpdate(
    req.user._id,
    { availability: req.body.availability },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      availability: mover.availability
    }
  });
});

// @desc    Update pricing
// @route   PUT /api/movers/pricing
// @access  Private/Mover
export const updatePricing = asyncHandler(async (req, res, next) => {
  const mover = await Mover.findByIdAndUpdate(
    req.user._id,
    { pricing: req.body.pricing },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      pricing: mover.pricing
    }
  });
});
