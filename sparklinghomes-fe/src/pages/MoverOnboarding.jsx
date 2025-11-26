import { useState, useEffect, useMemo, useRef } from 'react';
import { FiUpload, FiMapPin, FiClock, FiHome, FiShield, FiFileText, FiCreditCard, FiEye, FiDownload, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { moversService } from '../services/movers.js';

const CleanerOnboarding = () => {
  const navigate = useNavigate();
  const { user, userType, isAuthenticated, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const formRef = useRef(null);
  const stepRefs = useRef({});
  const inputRefs = useRef({});

  // Service mapping from display names to backend enum values
  const serviceMapping = {
    'Residential Cleaning': 'cleaning-services',
    'Commercial Cleaning': 'cleaning-services',
    'Deep Cleaning': 'cleaning-services',
    'Move-in/Move-out Cleaning': 'cleaning-services',
    'Window Cleaning': 'cleaning-services',
    'Carpet Cleaning': 'cleaning-services',
    'Post-Construction Cleaning': 'cleaning-services',
    'Green/Eco-Friendly Cleaning': 'cleaning-services'
  };

  // Reverse mapping from backend enum values to display names
  const reverseServiceMapping = useMemo(() => 
    Object.fromEntries(
      Object.entries(serviceMapping).map(([key, value]) => [value, key])
    ), []
  );

  // Redirect if not authenticated or not a mover/cleaner
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (userType !== 'mover') {
        navigate('/dashboard');
      } else if (user && user.status === 'approved') {
        // If cleaner is already approved, redirect to dashboard
        navigate('/mover/dashboard');
      } else if (user && user.verificationDocuments && user.verificationDocuments.length > 0) {
        // If cleaner has uploaded documents, they've completed onboarding
        navigate('/mover/dashboard');
      }
    }
  }, [isAuthenticated, userType, authLoading, navigate, user]);

  useEffect(() => {
    // Focus the first input in the current step after a short delay
    const focusTimeout = setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start' // or 'center', depending on your layout
        });
      }
      const currentStepElement = stepRefs.current[currentStep];
      if (currentStepElement) {
        const firstInput = currentStepElement.querySelector('input, select, textarea');
        if (firstInput) {
          firstInput.focus();
          // Scroll to the step if it's not fully visible
          currentStepElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, [currentStep]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a mover
  if (!isAuthenticated || userType !== 'mover') {
    return null;
  }

  const [formData, setFormData] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    serviceAreas: [{ zipCode: '', city: '', state: '', maxDistance: 50 }],
    availability: {
      monday: { available: false, hours: { start: '09:00', end: '17:00' } },
      tuesday: { available: false, hours: { start: '09:00', end: '17:00' } },
      wednesday: { available: false, hours: { start: '09:00', end: '17:00' } },
      thursday: { available: false, hours: { start: '09:00', end: '17:00' } },
      friday: { available: false, hours: { start: '09:00', end: '17:00' } },
      saturday: { available: false, hours: { start: '09:00', end: '17:00' } },
      sunday: { available: false, hours: { start: '09:00', end: '17:00' } }
    },
    vehicles: [{ type: '', make: '', model: '', year: '', licensePlate: '', capacity: '' }],
    services: [],
    pricing: { hourlyRate: '', minimumHours: 2, travelFee: 0 },
    teamSize: 1,
    equipment: [],
    documents: {
      businessLicense: '',
      proofOfInsurance: '',
      vehicleRegistration: '',
      backgroundCheck: '',
      bondingCertificate: '',
      dotAuthority: ''
    },
    licenseNumber: '',
    insuranceAmount: '',
    yearsInBusiness: '',
    description: ''
  });

  const [uploadingFiles, setUploadingFiles] = useState({});

  // Prefill form with existing user data
  useEffect(() => {
    if (user && userType === 'mover') {
      // Map verification documents to form document structure (matching CleanerProfile)
      const mapDocuments = (verificationDocuments) => {
        const documents = {
          businessLicense: '',
          proofOfInsurance: '',
          vehicleRegistration: '',
          backgroundCheck: '',
          bondingCertificate: '',
          dotAuthority: ''
        };
        
        if (verificationDocuments && Array.isArray(verificationDocuments)) {
          verificationDocuments.forEach(doc => {
            switch (doc.documentType) {
              case 'license':
                documents.businessLicense = doc.url;
                break;
              case 'insurance':
                documents.proofOfInsurance = doc.url;
                break;
              case 'vehicle':
                documents.vehicleRegistration = doc.url;
                break;
              case 'background-check':
              case 'background': // Handle both formats
                documents.backgroundCheck = doc.url;
                break;
              case 'bonding':
                documents.bondingCertificate = doc.url;
                break;
              case 'dot':
                documents.dotAuthority = doc.url;
                break;
            }
          });
        }
        
        return documents;
      };

      setFormData(prev => ({
        ...prev,
        businessName: user.businessName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || 'USA'
        },
        services: (user.services || []).map(service => reverseServiceMapping[service] || service),
        pricing: {
          hourlyRate: user.pricing?.hourlyRate || '',
          minimumHours: user.pricing?.minimumHours || 2,
          travelFee: user.pricing?.travelFee || 0
        },
        teamSize: user.teamSize || 1,
        licenseNumber: user.licenseNumber || '',
        insuranceAmount: user.insuranceAmount || '',
        description: user.description || '',
        documents: mapDocuments(user.verificationDocuments)
      }));
    }
  }, [user, userType, reverseServiceMapping]);

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

    // Map form document keys to backend document types (matching CleanerProfile)
    const documentTypeMapping = {
      'businessLicense': 'license',
      'proofOfInsurance': 'insurance',
      'vehicleRegistration': 'vehicle',
      'backgroundCheck': 'background', // Match CleanerProfile expectation
      'bondingCertificate': 'bonding',
      'dotAuthority': 'dot'
    };

    const backendDocumentType = documentTypeMapping[documentType] || documentType;

    try {
      // Use the onboarding cleaners service for document upload
      const response = await moversService.uploadVerificationDocumentsOnboarding([
        {
          file: file,
          type: backendDocumentType,
          description: `${documentType} document for ${formData.businessName || 'cleaner business'}`
        }
      ]);

      if (response.data && response.data.document) {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: response.data.document.url
          }
        }));

        setSuccess(`${documentType.replace(/([A-Z])/g, ' $1').trim()} uploaded successfully!`);
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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Map services from display names to backend enum values
    const mappedFormData = {
      ...formData,
      services: formData.services.map(service => serviceMapping[service] || service)
    };

    // Log the data being sent
    console.log('=== MOVER ONBOARDING SUBMIT ===');
    console.log('Original Form Data:', formData);
    console.log('Mapped Form Data being sent:', mappedFormData);
    console.log('Auth Token:', localStorage.getItem('authToken'));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/movers/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(mappedFormData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        console.log('Full error response:', response);
        throw new Error(errorData.message || 'Onboarding failed');
      }

      const successData = await response.json();
      console.log('Success response data:', successData);

      setSuccess('Cleaner profile created successfully! You are now verified. Redirecting to subscription...');
      
      // Refresh user data to get updated status
      try {
        const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Update localStorage with new user data
          localStorage.setItem('userData', JSON.stringify(userData.data));
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
      
      setTimeout(() => {
        navigate('/mover/payment');
      }, 2000);
    } catch (err) {
      console.error('Submit error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Basic Business Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
          <input
            type="text"
            required
            value={formData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Business Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
          <input
            type="text"
            required
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            required
            value={formData.address.city}
            onChange={(e) => handleInputChange('address.city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <input
            type="text"
            required
            value={formData.address.state}
            onChange={(e) => handleInputChange('address.state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
          <input
            type="text"
            required
            value={formData.address.zipCode}
            onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input
            type="text"
            value={formData.address.country}
            onChange={(e) => handleInputChange('address.country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Services </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['Residential Cleaning', 'Commercial Cleaning', 'Deep Cleaning', 'Move-in/Move-out Cleaning', 'Window Cleaning', 'Carpet Cleaning', 'Post-Construction Cleaning', 'Green/Eco-Friendly Cleaning'].map((service) => (
              <label key={service} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.services.includes(service)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        services: [...prev.services, service]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        services: prev.services.filter(s => s !== service)
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{service}</span>
              </label>
            ))}
          </div>
        </div>

       {/*  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.pricing.hourlyRate}
              onChange={(e) => handleInputChange('pricing.hourlyRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Hours</label>
            <input
              type="number"
              min="1"
              value={formData.pricing.minimumHours}
              onChange={(e) => handleInputChange('pricing.minimumHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Travel Fee ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.pricing.travelFee}
              onChange={(e) => handleInputChange('pricing.travelFee', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
            <input
              type="number"
              min="1"
              value={formData.teamSize}
              onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
         {/*  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Amount ($)</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.insuranceAmount}
              onChange={(e) => handleInputChange('insuranceAmount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Tell customers about your business, experience, and what makes you unique..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Required Business Documents</h3>
      <p className="text-sm text-gray-600">
        Upload the following legally required documents for your cleaning business. 
        Only PDF, JPG, and PNG files are accepted. You can also skip this step now and upload documents later from your profile.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries({
          businessLicense: 'Business License *',
          proofOfInsurance: 'Proof of Insurance *',
          vehicleRegistration: 'Vehicle Registration *'
        }).map(([key, label]) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <p className="text-xs text-gray-500 mb-3">
              {key === 'businessLicense' && 'Required by law in all states'}
              {key === 'proofOfInsurance' && 'Required for liability protection'}
              {key === 'vehicleRegistration' && 'Required for commercial vehicles'}
            </p>
            
            {formData.documents[key] ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FiFileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600">Document uploaded</span>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={formData.documents[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                    title="View document"
                  >
                    <FiEye className="h-4 w-4" />
                  </a>
                  <a
                    href={formData.documents[key]}
                    download
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <FiDownload className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleInputChange(`documents.${key}`, '')}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove document"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
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
        ))}
      </div>

      {/* Optional Documents Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-4">Optional Documents</h4>
        <p className="text-sm text-gray-600 mb-4">
          These documents can help build customer trust but are not legally required:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries({
            backgroundCheck: 'Background Check (Optional)',
            bondingCertificate: 'Bonding Certificate (Optional)',
            dotAuthority: 'DOT Authority (If Interstate)'
          }).map(([key, label]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <p className="text-xs text-gray-500 mb-3">
                {key === 'backgroundCheck' && 'Voluntary background verification'}
                {key === 'bondingCertificate' && 'Required only in some states'}
                {key === 'dotAuthority' && 'Required for interstate moves only'}
              </p>
              
              {formData.documents[key] ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiFileText className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">Document uploaded</span>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={formData.documents[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                      title="View document"
                    >
                      <FiEye className="h-4 w-4" />
                    </a>
                    <a
                      href={formData.documents[key]}
                      download
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                      title="Download document"
                    >
                      <FiDownload className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleInputChange(`documents.${key}`, '')}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove document"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
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
                    <p className="text-xs text-gray-600">
                      {uploadingFiles[key] ? 'Uploading...' : 'Optional upload'}
                    </p>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return <div>Step {currentStep}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FiHome className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Become a Cleaner</h1>
                <p className="text-sm text-gray-500">Complete your profile to start receiving jobs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={formRef}>
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600">
              Step {currentStep} of 4: {
                currentStep === 1 ? 'Basic Information' :
                currentStep === 2 ? 'Business Address' :
                currentStep === 3 ? 'Services & Pricing' :
                'Document Upload'
              }
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200" >
          {renderCurrentStep()}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Skip for now'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : 'Complete Onboarding'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanerOnboarding;
