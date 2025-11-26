import { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiPhone, FiMail, FiSave, FiEdit3, FiUpload, FiFileText, FiX, FiEye, FiDownload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { moversService } from '../services/movers.js';
import SearchableSelect from '../components/SearchableSelect';
import { US_STATES, validateZipCode, validateUSPhoneNumber, formatPhoneNumber } from '../utils/locationUtils';

const MoverProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [moverData, setMoverData] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});

  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    description: '',
    hourlyRate: '',
    services: []
  });

  useEffect(() => {
    fetchMoverData();
  }, []);

  const fetchMoverData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/movers/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setMoverData(data.data);
      
      // Populate form data
      setFormData({
        businessName: data.data.businessName || '',
        firstName: data.data.firstName || '',
        lastName: data.data.lastName || '',
        email: data.data.email || '',
        phone: data.data.phone || '',
        address: {
          street: data.data.address?.street || '',
          city: data.data.address?.city || '',
          state: data.data.address?.state || '',
          zipCode: data.data.address?.zipCode || '',
          country: data.data.address?.country || 'USA'
        },
        description: data.data.description || '',
        hourlyRate: data.data.pricing?.hourlyRate || '',
        services: data.data.services || []
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = async (file, documentType) => {
    if (!file) return;

    setUploadingFiles(prev => ({ ...prev, [documentType]: true }));

    try {
      // Use the regular movers service for document upload (not onboarding)
      const response = await moversService.uploadVerificationDocuments([
        {
          file: file,
          type: documentType,
          description: `${documentType} document for ${formData.businessName || 'mover business'}`
        }
      ]);

      if (response.data && response.data.document) {
        setSuccess(`${documentType.replace(/([A-Z])/g, ' $1').trim()} uploaded successfully!`);
        // Refresh mover data to show updated documents
        fetchMoverData();
      } else {
        throw new Error('Upload response invalid');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload ${documentType}: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number
      const phoneValidation = validateUSPhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.error);
      }

      // Validate ZIP code
      const zipValidation = validateZipCode(formData.address.zipCode);
      if (!zipValidation.isValid) {
        throw new Error(zipValidation.error);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/movers/${moverData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchMoverData(); // Refresh data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form data when canceling edit
      fetchMoverData();
    }
  };

  const getDocumentStatusBadge = (hasDocuments) => {
    if (hasDocuments) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Documents Uploaded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        No Documents
      </span>
    );
  };

  if (!moverData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiUser className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mover Profile</h1>
                <p className="text-sm text-gray-500">Manage your business information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/mover/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 text-red-600">⚠️</div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 text-green-600">✅</div>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
              <button
                onClick={toggleEdit}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {isEditing ? (
                  <>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <FiEdit3 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

             {/*  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  disabled={!isEditing}
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div> */}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const formatted = formatPhoneNumber(e.target.value);
                    handleInputChange('phone', formatted);
                  }}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Business Address</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  {isEditing ? (
                    <SearchableSelect
                      name="address.state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      options={US_STATES}
                      placeholder="State..."
                      displayKey="name"
                      valueKey="code"
                      required
                    />
                  ) : (
                  <input
                    type="text"
                      disabled
                    value={formData.address.state}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={formData.address.zipCode}
                    onChange={(e) => {
                      if (!isEditing) return;
                      const zipCode = e.target.value.replace(/\D/g, '').slice(0, 5);
                      handleInputChange('address.zipCode', zipCode);
                      
                      // Auto-fill city and state if valid ZIP
                      if (zipCode.length === 5) {
                        const validation = validateZipCode(zipCode);
                        if (validation.isValid) {
                          handleInputChange('address.city', validation.city);
                          handleInputChange('address.state', validation.state);
                        }
                      }
                    }}
                    placeholder="12345"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                rows={4}
                disabled={!isEditing}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Tell customers about your moving services, experience, and what makes you unique..."
              />
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Status */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiUser className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Verification Status</h4>
              <p className="text-sm text-gray-600 capitalize">{moverData.status}</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMail className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">Email</h4>
              <p className="text-sm text-gray-600">{moverData.email}</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMapPin className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">Location</h4>
              <p className="text-sm text-gray-600">
                {moverData.address?.city}, {moverData.address?.state}
              </p>
            </div>
          </div>
        </div>

        {/* Document Management Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Documents</h3>
          
          {/* Required Documents */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-4">Required Business Documents</h4>
            <p className="text-sm text-gray-600 mb-4">
              These documents are legally required for your moving business. 
              Only PDF, JPG, and PNG files are accepted.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries({
                businessLicense: 'Business License *',
                proofOfInsurance: 'Proof of Insurance *',
                vehicleRegistration: 'Vehicle Registration *'
              }).map(([key, label]) => {
                const existingDoc = moverData.verificationDocuments?.find(
                  doc => doc.documentType === (key === 'businessLicense' ? 'license' : 
                                               key === 'proofOfInsurance' ? 'insurance' : 
                                               key === 'vehicleRegistration' ? 'vehicle' : key)
                );
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <p className="text-xs text-gray-500 mb-3">
                      {key === 'businessLicense' && 'Required by law in all states'}
                      {key === 'proofOfInsurance' && 'Required for liability protection'}
                      {key === 'vehicleRegistration' && 'Required for commercial vehicles'}
                    </p>
                    
                    {existingDoc ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <FiFileText className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-600">Document uploaded</span>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={existingDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View document"
                          >
                            <FiEye className="h-4 w-4" />
                          </a>
                          <a
                            href={existingDoc.url}
                            download
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <FiDownload className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files[0], key)}
                          className="hidden"
                          id={key}
                        />
                        <label htmlFor={key} className="cursor-pointer">
                          <FiUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {uploadingFiles[key] ? 'Uploading...' : 'Click to upload'}
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Documents */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Optional Documents</h4>
            <p className="text-sm text-gray-600 mb-4">
              These documents can help build customer trust but are not legally required:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries({
                backgroundCheck: 'Background Check (Optional)',
                bondingCertificate: 'Bonding Certificate (Optional)',
                dotAuthority: 'DOT Authority (If Interstate)'
              }).map(([key, label]) => {
                const existingDoc = moverData.verificationDocuments?.find(
                  doc => doc.documentType === (key === 'backgroundCheck' ? 'background' : 
                                               key === 'bondingCertificate' ? 'bonding' : 
                                               key === 'dotAuthority' ? 'dot' : key)
                );
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <p className="text-xs text-gray-500 mb-3">
                      {key === 'backgroundCheck' && 'Voluntary background verification'}
                      {key === 'bondingCertificate' && 'Required only in some states'}
                      {key === 'dotAuthority' && 'Required for interstate moves only'}
                    </p>
                    
                    {existingDoc ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <FiFileText className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-600">Document uploaded</span>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={existingDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View document"
                          >
                            <FiEye className="h-4 w-4" />
                          </a>
                          <a
                            href={existingDoc.url}
                            download
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <FiDownload className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files[0], key)}
                          className="hidden"
                          id={key}
                        />
                        <label htmlFor={key} className="cursor-pointer">
                          <FiUpload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {uploadingFiles[key] ? 'Uploading...' : 'Optional upload'}
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoverProfile;
