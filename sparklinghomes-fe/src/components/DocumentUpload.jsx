import { useState } from 'react';
import { FiUpload, FiFile, FiTrash2, FiEye, FiCheck, FiAlertCircle } from 'react-icons/fi';

const DocumentUpload = ({ onDocumentUploaded, onDocumentDeleted }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [uploadData, setUploadData] = useState({
    documentType: '',
    description: '',
    file: null
  });

  const documentTypes = [
    { value: 'business-license', label: 'Business License' },
    { value: 'insurance-certificate', label: 'Insurance Certificate' },
    { value: 'vehicle-registration', label: 'Vehicle Registration' },
    { value: 'background-check', label: 'Background Check' },
    { value: 'bonding-certificate', label: 'Bonding Certificate' },
    { value: 'workers-comp', label: 'Workers Compensation' },
    { value: 'other', label: 'Other Document' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF and image files are allowed');
        return;
      }

      setUploadData(prev => ({ ...prev, file }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadData.documentType || !uploadData.file) {
      setError('Please select a document type and file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('documentType', uploadData.documentType);
      formData.append('description', uploadData.description);
      formData.append('document', uploadData.file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/movers/upload-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      const result = await response.json();
      setSuccess('Document uploaded successfully!');
      
      // Reset form
      setUploadData({
        documentType: '',
        description: '',
        file: null
      });

      // Notify parent component
      if (onDocumentUploaded) {
        onDocumentUploaded(result.data.document);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setUploadData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Business Documents</h3>
        <p className="text-sm text-gray-600">
          Upload your business documents for verification. Supported formats: PDF, JPG, PNG, GIF (max 10MB)
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FiCheck className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type *
          </label>
          <select
            required
            value={uploadData.documentType}
            onChange={(e) => handleInputChange('documentType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select document type</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={uploadData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            placeholder="Brief description of the document..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document File *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG, GIF up to 10MB
              </p>
            </div>
          </div>
          
          {/* Selected File Display */}
          {uploadData.file && (
            <div className="mt-3 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FiFile className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadData.file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadData(prev => ({ ...prev, file: null }))}
                className="text-red-600 hover:text-red-800"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !uploadData.documentType || !uploadData.file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <FiUpload className="h-4 w-4" />
              <span>Upload Document</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;
