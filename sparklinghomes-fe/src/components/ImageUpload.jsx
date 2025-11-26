import { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiImage, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const ImageUpload = ({ 
  onUpload, 
  onRemove, 
  multiple = false, 
  maxFiles = 5, 
  maxSize = 5, // MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  placeholder = 'Drag & drop images here or click to browse',
  showPreview = true,
  aspectRatio = null // Optional: maintain aspect ratio
}) => {
  const { user } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${process.env.VITE_API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        publicId: data.publicId,
        url: data.url,
        width: data.width,
        height: data.height,
        format: data.format,
        size: data.size
      };
    } catch (err) {
      console.error('Upload error:', err);
      throw new Error('Failed to upload image');
    }
  };

  const handleFileUpload = async (files) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        // Update progress
        setUploadProgress(prev => ({ ...prev, [index]: 0 }));

        // Simulate progress (Cloudinary doesn't provide real-time progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[index] || 0;
            if (current < 90) {
              return { ...prev, [index]: current + 10 };
            }
            clearInterval(progressInterval);
            return prev;
          });
        }, 100);

        const result = await uploadToBackend(file);
        
        // Complete progress
        setUploadProgress(prev => ({ ...prev, [index]: 100 }));
        
        return {
          ...result,
          originalFile: file,
          name: file.name
        };
      });

      const results = await Promise.all(uploadPromises);
      
      if (multiple) {
        onUpload(results);
      } else {
        onUpload(results[0]);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input value to allow same file selection
    e.target.value = '';
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-gray-100 rounded-full">
            <FiUpload className="h-6 w-6 text-gray-600" />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {uploading ? 'Uploading...' : placeholder}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxSize}MB
            </p>
          </div>

          {!uploading && (
            <button
              type="button"
              onClick={handleBrowseClick}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Browse Files
            </button>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([index, progress]) => (
              <div key={index} className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
