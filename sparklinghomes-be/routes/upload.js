import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { handleImageUpload, handleImageDelete, uploadDocument, uploadPhoto } from '../controllers/upload.js';

const router = express.Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

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

// POST /api/upload/image - Upload image to Cloudinary
router.post('/image', protect, upload.single('image'), handleImageUpload);

// DELETE /api/upload/image/:publicId - Delete image from Cloudinary
router.delete('/image/:publicId', protect, handleImageDelete);

// POST /api/upload/document - Upload document to Cloudinary
router.post('/document', protect, documentUpload.single('file'), uploadDocument);

// POST /api/upload/photo - Upload photo to Cloudinary
router.post('/photo', protect, upload.single('file'), uploadPhoto);

export default router;
