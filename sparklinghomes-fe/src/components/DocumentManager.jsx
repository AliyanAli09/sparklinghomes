import { useState, useEffect } from 'react';
import { FiFile, FiTrash2, FiEye, FiDownload, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/movers/me/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setDocuments(data.data.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/movers/me/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete document');

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
    } catch (err) {
      setError(err.message);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const typeMap = {
      'business-license': 'Business License',
      'insurance-certificate': 'Insurance Certificate',
      'vehicle-registration': 'Vehicle Registration',
      'background-check': 'Background Check',
      'bonding-certificate': 'Bonding Certificate',
      'workers-comp': 'Workers Compensation',
      'other': 'Other Document'
    };
    return typeMap[type] || type;
  };

  const getDocumentIcon = (type) => {
    if (type === 'pdf') return '📄';
    if (type.includes('image')) return '🖼️';
    return '📋';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <FiAlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Error: {error}</p>
          <button
            onClick={fetchDocuments}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploaded Documents</h3>
        <p className="text-sm text-gray-600">
          Manage your business documents for verification
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FiFile className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No documents uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload your business documents to get verified
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => (
            <div
              key={document._id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getDocumentIcon(document.url.split('.').pop())}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {getDocumentTypeLabel(document.documentType)}
                  </h4>
                  {document.description && (
                    <p className="text-sm text-gray-600">{document.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Uploaded {formatDate(document.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* View Document */}
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View document"
                >
                  <FiEye className="h-4 w-4" />
                </a>

                {/* Download Document */}
                <a
                  href={document.url}
                  download
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download document"
                >
                  <FiDownload className="h-4 w-4" />
                </a>

                {/* Delete Document */}
                <button
                  onClick={() => handleDeleteDocument(document._id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete document"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Status Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <FiCheck className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Document Verification</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your documents will be reviewed by our admin team. This process typically takes 1-3 business days.
              You'll receive an email notification once your account is verified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;
