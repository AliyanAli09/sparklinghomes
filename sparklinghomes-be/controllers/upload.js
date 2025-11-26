import { uploadImage, deleteImage } from '../utils/cloudinary.js';
import { catchAsync } from '../utils/catchAsync.js';

// Upload image to Cloudinary
const handleImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload to Cloudinary using the utility function
    const result = await uploadImage(req.file.buffer, {
      folder: 'booknmove'
    });

    // Return the uploaded image data
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

// Delete image from Cloudinary
const handleImageDelete = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Delete from Cloudinary using the utility function
    const result = await deleteImage(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete image'
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

// Upload document (for movers)
const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const { documentType } = req.body;

  if (!documentType) {
    return res.status(400).json({
      success: false,
      message: 'Document type is required'
    });
  }

  try {
    // Upload to Cloudinary using the buffer
    const result = await uploadImage(req.file.buffer, {
      folder: 'mover-documents',
      public_id: `${documentType}_${Date.now()}`
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        documentType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Upload photo (for movers)
const uploadPhoto = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    // Upload to Cloudinary using the buffer
    const result = await uploadImage(req.file.buffer, {
      folder: 'mover-photos',
      public_id: `mover_photo_${Date.now()}`
    });

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
});

export {
  handleImageUpload,
  handleImageDelete,
  uploadDocument,
  uploadPhoto
};
