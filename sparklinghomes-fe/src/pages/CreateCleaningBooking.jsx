import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiPhone, FiMail, FiCalendar, FiClock, FiCheck, FiCreditCard, FiUpload } from 'react-icons/fi';
import { bookingsService } from '../services';
import PaymentForm from '../components/PaymentForm';

const CreateCleaningBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  const [formData, setFormData] = useState({
    // Contact Info
    fullName: '',
    phone: '',
    email: '',
    preferredContact: {
      call: false,
      text: false,
      email: false
    },

    // Service Details
    cleaningType: {
      standard: false,
      deep: false,
      moveInOut: false,
      airbnb: false,
      postConstruction: false
    },
    frequency: 'one-time', // one-time, weekly, bi-weekly, monthly

    // Property Details
    propertyType: 'house', // apartment, house, townhome, condo
    squareFootage: '',
    bedrooms: 2,
    bathrooms: 2,
    hasPets: false,

    // Service Address
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      apartmentUnit: ''
    },

    // Cleaning Preferences
    specialRequests: '',
    cleaningDate: '',
    timeOfDay: 'morning', // morning, afternoon, evening

    // Access & Parking
    accessMethod: 'home', // home, key, doorman
    parkingAvailable: true,

    // Photos
    photos: []
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.fullName || !formData.phone) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zipCode) {
        setError('Please fill in all required address fields');
        return false;
      }
      if (!formData.cleaningDate) {
        setError('Please select a cleaning date');
        return false;
      }
      const selectedTypes = Object.values(formData.cleaningType).filter(v => v).length;
      if (selectedTypes === 0) {
        setError('Please select at least one cleaning type');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);
      setError('');

      // Get selected cleaning types and map to valid enum values
      const selectedCleaningTypes = Object.keys(formData.cleaningType)
        .filter(key => formData.cleaningType[key]);

      // Map cleaning types to valid backend service enum values
      // We'll use 'cleaning' for all types and put specific details in specialInstructions
      const servicesRequested = ['cleaning']; // Valid enum value from backend

      // Transform data to match backend API
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || formData.fullName;
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      const cleaningTypesText = selectedCleaningTypes.map(key => {
        const typeMap = {
          standard: 'Standard Cleaning',
          deep: 'Deep Cleaning',
          moveInOut: 'Move-In / Move-Out Cleaning',
          airbnb: 'Airbnb / Rental Turnover',
          postConstruction: 'Post-Construction Cleaning'
        };
        return typeMap[key] || key;
      }).join(', ');

      const bookingData = {
        customerInfo: {
          firstName: firstName,
          lastName: lastName,
          email: formData.email || `${firstName.toLowerCase()}@guest.sparklinghomes.com`,
          phone: formData.phone
        },
        moveDate: formData.cleaningDate,
        moveTime: formData.timeOfDay === 'morning' ? '09:00' : formData.timeOfDay === 'afternoon' ? '13:00' : '17:00',
        moveType: 'residential',
        homeSize: `${formData.bedrooms}-bedroom`,
        estimatedDuration: 2,
        pickupAddress: {
          street: formData.address.street || 'Not provided',
          city: formData.address.city || 'Not provided',
          state: formData.address.state || 'Not provided',
          zipCode: formData.address.zipCode || '00000',
          apartmentUnit: formData.address.apartmentUnit || '',
          notes: `Property Type: ${formData.propertyType}, Square Footage: ${formData.squareFootage || 'Not specified'}`
        },
        dropoffAddress: {
          street: formData.address.street || 'N/A',
          city: formData.address.city || 'N/A',
          state: formData.address.state || 'N/A',
          zipCode: formData.address.zipCode || '00000',
          notes: ''
        },
        servicesRequested: servicesRequested,
        packingRequired: false,
        items: [],
        specialInstructions: `
CLEANING SERVICE REQUEST

Cleaning Types: ${cleaningTypesText || 'Not specified'}

Property Details:
- Type: ${formData.propertyType}
- Square Footage: ${formData.squareFootage || 'Not specified'}
- Bedrooms: ${formData.bedrooms}
- Bathrooms: ${formData.bathrooms}
- Pets: ${formData.hasPets ? 'Yes' : 'No'}

Service Frequency: ${formData.frequency}

Access Method: ${formData.accessMethod}
Parking Available: ${formData.parkingAvailable ? 'Yes' : 'No'}

Preferred Contact: ${Object.keys(formData.preferredContact).filter(k => formData.preferredContact[k]).join(', ') || 'Any'}

Special Requests:
${formData.specialRequests || 'None'}
        `.trim()
      };

      const response = await bookingsService.createBooking(bookingData);
      console.log('Booking response:', response);
      const bookingId = response.data?.data?.booking?._id || response.data?.data?._id || response.data?._id;
      setCreatedBookingId(bookingId);
      setBookingCreated(true);
      setCurrentStep(4);
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate(`/booking/${createdBookingId}/guest/confirmation`);
  };

  const steps = [
    { number: 1, title: 'Contact & Service', icon: FiUser },
    { number: 2, title: 'Property Details', icon: FiHome },
    { number: 3, title: 'Review', icon: FiCheck },
    { number: 4, title: 'Payment', icon: FiCreditCard }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.number
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏠 Home Cleaning Quote</h1>
            <p className="text-gray-600">Book Online Clean Anytime</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Contact Info & Service Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📞 Contact Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="preferredContact.call"
                        checked={formData.preferredContact.call}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Call</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="preferredContact.text"
                        checked={formData.preferredContact.text}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Text</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="preferredContact.email"
                        checked={formData.preferredContact.email}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Email</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🧹 Service Details</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What type of cleaning do you need? *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'standard', label: 'Standard Cleaning' },
                      { key: 'deep', label: 'Deep Cleaning' },
                      { key: 'moveInOut', label: 'Move-In / Move-Out Cleaning' },
                      { key: 'airbnb', label: 'Airbnb / Rental Turnover' },
                      { key: 'postConstruction', label: 'Post-Construction Cleaning' }
                    ].map(type => (
                      <label key={type.key} className="flex items-center p-3 border-2 border-gray-300 rounded-xl hover:border-green-500 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`cleaningType.${type.key}`}
                          checked={formData.cleaningType[type.key]}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How often do you need service?
                  </label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="one-time">One-Time</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  if (validateStep()) handleNext();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
              >
                Continue
                <FiCheck className="ml-2" />
              </button>
            </div>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🏡 Property Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="townhome">Townhome</option>
                      <option value="condo">Condo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approximate Square Footage
                    </label>
                    <input
                      type="text"
                      name="squareFootage"
                      value={formData.squareFootage}
                      onChange={handleInputChange}
                      placeholder="e.g., 1500"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How many bedrooms?
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How many bathrooms?
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="hasPets"
                        checked={formData.hasPets}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Any pets in the home?</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📍 Service Address</h2>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        maxLength="2"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                        placeholder="12345"
                        maxLength="5"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apartment/Unit # (Optional)
                    </label>
                    <input
                      type="text"
                      name="address.apartmentUnit"
                      value={formData.address.apartmentUnit}
                      onChange={handleInputChange}
                      placeholder="Apt 4B"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🗓️ Scheduling</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Your Date *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        name="cleaningDate"
                        value={formData.cleaningDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time of Day
                    </label>
                    <select
                      name="timeOfDay"
                      value={formData.timeOfDay}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Special Requests</h2>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="List any special requests (e.g., oven, fridge, baseboards, laundry)..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">🔑 Access & Parking</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How will our team access the property?
                    </label>
                    <select
                      name="accessMethod"
                      value={formData.accessMethod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="home">Someone home</option>
                      <option value="key">Key/Code entry</option>
                      <option value="doorman">Doorman / front desk</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="parkingAvailable"
                        checked={formData.parkingAvailable}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Parking available on-site</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (validateStep()) handleNext();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  Review Booking
                  <FiCheck className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">📋 Review Your Booking</h2>
                <p className="text-gray-600">Double-check all the details before submitting</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {formData.fullName}</p>
                      <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                      {formData.email && <p><span className="font-medium">Email:</span> {formData.email}</p>}
                      <p><span className="font-medium">Preferred Contact:</span> {Object.keys(formData.preferredContact).filter(k => formData.preferredContact[k]).join(', ') || 'Any'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Services</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {Object.keys(formData.cleaningType).filter(k => formData.cleaningType[k]).map((type, index) => {
                        const typeMap = {
                          standard: 'Standard Cleaning',
                          deep: 'Deep Cleaning',
                          moveInOut: 'Move-In / Move-Out Cleaning',
                          airbnb: 'Airbnb / Rental Turnover',
                          postConstruction: 'Post-Construction Cleaning'
                        };
                        return <p key={index}>• {typeMap[type]}</p>;
                      })}
                      <p className="mt-2"><span className="font-medium">Frequency:</span> {formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1)}</p>
                    </div>
                  </div>
                </div>

                {/* Property & Scheduling */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Property Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Type:</span> {formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1)}</p>
                      {formData.squareFootage && <p><span className="font-medium">Square Footage:</span> {formData.squareFootage} sq ft</p>}
                      <p><span className="font-medium">Bedrooms:</span> {formData.bedrooms}</p>
                      <p><span className="font-medium">Bathrooms:</span> {formData.bathrooms}</p>
                      <p><span className="font-medium">Pets:</span> {formData.hasPets ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Scheduling</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Date:</span> {new Date(formData.cleaningDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><span className="font-medium">Time:</span> {formData.timeOfDay.charAt(0).toUpperCase() + formData.timeOfDay.slice(1)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Service Address</h3>
                <div className="text-sm text-gray-600">
                  <p>{formData.address.street}{formData.address.apartmentUnit ? `, ${formData.address.apartmentUnit}` : ''}</p>
                  <p>{formData.address.city}, {formData.address.state} {formData.address.zipCode}</p>
                  <div className="mt-3 space-y-1">
                    <p><span className="font-medium">Access Method:</span> {formData.accessMethod === 'home' ? 'Someone home' : formData.accessMethod === 'key' ? 'Key/Code entry' : 'Doorman / front desk'}</p>
                    <p><span className="font-medium">Parking:</span> {formData.parkingAvailable ? 'Available on-site' : 'Not available'}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {formData.specialRequests && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.specialRequests}</p>
                </div>
              )}

              {/* What Happens Next */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FiCheck className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
                      <li>Your booking will be automatically sent to cleaners in your area</li>
                      <li>You'll receive email confirmation after payment</li>
                      <li>A professional cleaner will be assigned to your booking</li>
                      <li>You'll get updates about your scheduled service</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                  <FiCreditCard className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && bookingCreated && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">💳 Secure Payment</h2>
                <p className="text-gray-600">Pay your $97 deposit to confirm your booking</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-900 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Service Date:</strong> {formData.cleaningDate} ({formData.timeOfDay})</p>
                  <p><strong>Property:</strong> {formData.propertyType} ({formData.bedrooms} bed, {formData.bathrooms} bath)</p>
                  <p><strong>Service Types:</strong> {Object.keys(formData.cleaningType).filter(k => formData.cleaningType[k]).map(k => k.replace(/([A-Z])/g, ' $1')).join(', ')}</p>
                  <p><strong>Frequency:</strong> {formData.frequency}</p>
                </div>
              </div>

              <PaymentForm
                bookingId={createdBookingId}
                amount={9700} // $97.00 deposit
                onSuccess={handlePaymentSuccess}
                isGuest={true}
                guestEmail={formData.email}
              />

              <button
                onClick={handleBack}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Back to Edit
              </button>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="flex items-center justify-center">
            <FiCheck className="text-green-600 mr-2" />
            Licensed & Insured Cleaning Professionals
          </p>
          <p className="mt-2">✨ Sparkling Homes Cleaning Service</p>
        </div>
      </div>
    </div>
  );
};

export default CreateCleaningBooking;
