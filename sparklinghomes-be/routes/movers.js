import express from 'express';
import multer from 'multer';
import { protect, restrictToUserType } from '../middleware/auth.js';
import {
  createMoverProfile,
  getCurrentMover,
  getMoverProfile,
  updateMoverProfile,
  getMoversByServiceArea,
  getMoverAvailability,
  uploadVerificationDocuments,
  uploadVerificationDocumentsOnboarding,
  getMoverDocuments,
  deleteMoverDocument
} from '../controllers/movers.js';

const router = express.Router();

// Configure multer for document uploads
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, and common document formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for documents!'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

// Mover onboarding and profile management
router.post('/onboard', protect, createMoverProfile);
router.get('/me', protect, getCurrentMover);
router.get('/:id', getMoverProfile);
router.put('/:id', updateMoverProfile);

// Service area and availability queries
router.get('/service-area/search', getMoversByServiceArea);
router.get('/:id/availability', getMoverAvailability);

// Document management routes
router.post('/upload-documents-onboarding', protect, documentUpload.single('file'), handleMulterError, uploadVerificationDocumentsOnboarding);
router.post('/upload-documents', protect, restrictToUserType('mover'), documentUpload.single('file'), handleMulterError, uploadVerificationDocuments);
router.get('/me/documents', protect, restrictToUserType('mover'), getMoverDocuments);
router.delete('/me/documents/:documentId', protect, restrictToUserType('mover'), deleteMoverDocument);

export default router;
