import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Upload image buffer to Cloudinary
export const uploadImage = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'image',
      folder: options.folder || 'booknmove',
      public_id: options.public_id,
      transformation: options.transformation || [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ],
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Upload multiple images
export const uploadMultipleImages = async (files, options = {}) => {
  const uploadPromises = files.map((file, index) => {
    const fileOptions = {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index}` : undefined
    };
    return uploadImage(file.buffer, fileOptions);
  });

  return Promise.all(uploadPromises);
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  const parts = url.split('/');
  const fileWithExtension = parts[parts.length - 1];
  const publicId = fileWithExtension.split('.')[0];
  const folder = parts[parts.length - 2];
  return `${folder}/${publicId}`;
};
