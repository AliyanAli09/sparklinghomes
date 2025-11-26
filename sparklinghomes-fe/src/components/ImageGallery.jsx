import { useState } from 'react';
import { FiX, FiEye, FiTrash2, FiDownload, FiEdit } from 'react-icons/fi';

const ImageGallery = ({
  images = [],
  onRemove,
  onEdit,
  onReorder,
  maxImages = 10,
  showActions = true,
  gridCols = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  className = '',
  aspectRatio = 'aspect-square',
  showImageInfo = false
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleRemove = (imageId) => {
    if (onRemove) {
      onRemove(imageId);
    }
  };

  const handleEdit = (image) => {
    if (onEdit) {
      onEdit(image);
    }
  };

  const openLightbox = (image) => {
    setSelectedImage(image);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setSelectedImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FiEye className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Grid */}
      <div className={`grid ${gridCols} gap-4 ${className}`}>
        {images.slice(0, maxImages).map((image, index) => (
          <div
            key={image.publicId || image.id || index}
            className={`relative group ${aspectRatio} bg-gray-100 rounded-lg overflow-hidden`}
          >
            {/* Image */}
            <img
              src={image.url}
              alt={image.name || `Image ${index + 1}`}
              className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              onClick={() => openLightbox(image)}
              loading="lazy"
            />

            {/* Overlay Actions */}
            {showActions && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openLightbox(image)}
                    className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                    title="View full size"
                  >
                    <FiEye className="h-4 w-4 text-gray-700" />
                  </button>
                  
                  {onEdit && (
                    <button
                      onClick={() => handleEdit(image)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      title="Edit image"
                    >
                      <FiEdit className="h-4 w-4 text-gray-700" />
                    </button>
                  )}
                  
                  {onRemove && (
                    <button
                      onClick={() => handleRemove(image.publicId || image.id || index)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                      title="Remove image"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Image Info Badge */}
            {showImageInfo && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {image.format?.toUpperCase()}
              </div>
            )}

            {/* Remove Button (Always visible on mobile) */}
            {showActions && onRemove && (
              <button
                onClick={() => handleRemove(image.publicId || image.id || index)}
                className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all md:hidden"
                title="Remove image"
              >
                <FiX className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Image Count Info */}
      {images.length > maxImages && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {maxImages} of {images.length} images
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all z-10"
            >
              <FiX className="h-6 w-6" />
            </button>

            {/* Image */}
            <img
              src={selectedImage.url}
              alt={selectedImage.name || 'Full size image'}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Details */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    {selectedImage.name || 'Image'}
                  </h3>
                  {showImageInfo && (
                    <div className="text-sm text-gray-300 space-x-4 mt-1">
                      <span>{selectedImage.width} × {selectedImage.height}</span>
                      <span>{selectedImage.format?.toUpperCase()}</span>
                      {selectedImage.size && (
                        <span>{formatFileSize(selectedImage.size)}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <a
                    href={selectedImage.url}
                    download={selectedImage.name || 'image'}
                    className="p-2 bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30 transition-all"
                    title="Download image"
                  >
                    <FiDownload className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
