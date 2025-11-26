import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiTruck, FiPlus, FiMinus, FiInfo, FiCreditCard, FiCheck, FiAlertCircle, FiArrowRight, FiUser, FiMail, FiPhone, FiX, FiClock } from 'react-icons/fi';
import { bookingsService, serviceUtils } from '../services';
import PaymentForm from '../components/PaymentForm';
import SearchableSelect from '../components/SearchableSelect';
import { US_STATES, validateZipCode, validateUSPhoneNumber, formatPhoneNumber } from '../utils/locationUtils';

// Note: For Stripe payments to work, you need to set VITE_STRIPE_PUBLISHABLE_KEY in your .env file
// Example: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_key_here


const CreateBooking = () => {
  const navigate = useNavigate();
  
  // Refs for form focus management
  const formRef = useRef(null);
  const stepRefs = useRef({});
  const inputRefs = useRef({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [quote, setQuote] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Initialize form data with persistence
  const getInitialFormData = () => {
    const savedData = localStorage.getItem('booknmove_booking_form');
    const savedStep = localStorage.getItem('booknmove_booking_step');
    
    const defaultData = {
      // Customer Information
      customerInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      // Move Details
      moveDate: '',
      moveTime: '09:00',
      estimatedDuration: 2,
      moveType: 'residential',
      homeSize: '2-bedroom',
      
      // Addresses
      pickupAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        floor: '',
        elevator: false,
        stairs: 0,
        parkingDistance: 0,
        notes: ''
      },
      dropoffAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        floor: '',
        elevator: false,
        stairs: 0,
        parkingDistance: 0,
        notes: ''
      },
      
      // Services & Items
      servicesRequested: ['full-service'],
      packingRequired: false,
      items: [
        { name: 'Sofa', quantity: 1, weight: 147, fragile: false, heavy: true },
        { name: 'Dining Table', quantity: 1, weight: 100, fragile: false, heavy: true },
        { name: 'Boxes (Medium)', quantity: 10, weight: 30, fragile: false, heavy: false }
      ],
      
      // Special Instructions
      specialInstructions: '',
      accessNotes: ''
    };
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return { ...defaultData, ...parsed };
      } catch (e) {
        console.warn('Failed to parse saved form data:', e);
        return defaultData;
      }
    }
    return defaultData;
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Dynamic steps based on move type
  const getSteps = () => {
    if (formData.moveType === 'long-distance') {
      return [
        { title: 'Contact Info', icon: FiUser },
        { title: 'Move Details', icon: FiCalendar },
        { title: 'Pickup Address', icon: FiMapPin },
        { title: 'Dropoff Address', icon: FiMapPin },
        { title: 'Items & Services', icon: FiTruck },
        { title: 'Review', icon: FiCheck }
      ];
    } else {
      return [
        { title: 'Contact Info', icon: FiUser },
        { title: 'Move Details', icon: FiCalendar },
        { title: 'Pickup Address', icon: FiMapPin },
        { title: 'Dropoff Address', icon: FiMapPin },
        { title: 'Items & Services', icon: FiTruck },
        { title: 'Quote', icon: FiInfo },
        { title: 'Review', icon: FiCheck },
        { title: 'Payment', icon: FiCreditCard }
      ];
    }
  };

  const steps = useMemo(() => getSteps(), [formData.moveType]);

  // Pricing system
  const pricingChart = {
    'studio': { basePrice: 347, additionalHour: 97, deposit: 147 },
    '1-bedroom': { basePrice: 347, additionalHour: 97, deposit: 147 },
    '2-bedroom': { basePrice: 347, additionalHour: 97, deposit: 147 },
    '3-bedroom': { basePrice: 447, additionalHour: 147, deposit: 147 },
    '4-bedroom': { basePrice: 547, additionalHour: 197, deposit: 147 },
    'small-office': { basePrice: 347, additionalHour: 97, deposit: 147 },
    'medium-office': { basePrice: 447, additionalHour: 147, deposit: 147 },
    'large-office': { basePrice: 547, additionalHour: 197, deposit: 147 },
    '2-labor-only': { basePrice: 297, additionalHour: 97, deposit: 147 },
    '3-labor-only': { basePrice: 347, additionalHour: 125, deposit: 147 }
  };

  const calculateQuote = () => {
    const pricing = pricingChart[formData.homeSize] || pricingChart['2-bedroom'];
    const basePrice = pricing.basePrice;
    const additionalHour = pricing.additionalHour;
    const additionalHours = Math.max(0, formData.estimatedDuration - 2);
    const additionalCost = additionalHours * pricing.additionalHour;
    const totalPrice = basePrice + additionalCost;
    
    return {
      basePrice,
      additionalHourCost: additionalHour,
      additionalHours,
      additionalCost,
      totalPrice,
      deposit: pricing.deposit,
      homeSize: formData.homeSize
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Mark field as touched
    if (name) {
      setTouchedFields(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    if (name && name.includes('.')) {
      const nameParts = name.split('.');
      if (nameParts.length >= 2) {
        const [parent, child] = nameParts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
            ...(prev[parent] || {}),
          [child]: type === 'checkbox' ? checked : value
        }
      }));
      }
    } else if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear validation error when user starts typing
    if (name && validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleServiceChange = (service) => {
    // Mark services field as touched
    setTouchedFields(prev => ({
      ...prev,
      services: true
    }));
    
    setFormData(prev => ({
      ...prev,
      servicesRequested: prev.servicesRequested.includes(service)
        ? prev.servicesRequested.filter(s => s !== service)
        : [...prev.servicesRequested, service]
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { name: '', quantity: 1, weight: 0, fragile: false, heavy: false }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    // Mark items field as touched
    setTouchedFields(prev => ({
      ...prev,
      items: true,
      [`item${index}Name`]: true
    }));
    
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateStep = (step, forceValidation = false) => {
    const errors = {};
    
    // Get the current step configuration
    const isLongDistance = formData.moveType === 'long-distance';
    
    switch (step) {
      case 1:
        if (!formData.customerInfo.firstName && (touchedFields['customerInfo.firstName'] || forceValidation)) {
          errors['customerInfo.firstName'] = 'First name is required';
        }
        if (!formData.customerInfo.lastName && (touchedFields['customerInfo.lastName'] || forceValidation)) {
          errors['customerInfo.lastName'] = 'Last name is required';
        }
        if (!formData.customerInfo.email && (touchedFields['customerInfo.email'] || forceValidation)) {
          errors['customerInfo.email'] = 'Email is required';
        }
        if (!formData.customerInfo.phone && (touchedFields['customerInfo.phone'] || forceValidation)) {
          errors['customerInfo.phone'] = 'Phone number is required';
        } else if (formData.customerInfo.phone && (touchedFields['customerInfo.phone'] || forceValidation)) {
          const phoneValidation = validateUSPhoneNumber(formData.customerInfo.phone);
          if (!phoneValidation.isValid) {
            errors['customerInfo.phone'] = phoneValidation.error;
          }
        }
        break;
        
      case 2:
        if (!formData.moveDate && (touchedFields.moveDate || forceValidation)) {
          errors.moveDate = 'Move date is required';
        }
        if (!formData.moveTime && (touchedFields.moveTime || forceValidation)) {
          errors.moveTime = 'Move time is required';
        }
        if (!formData.homeSize && (touchedFields.homeSize || forceValidation)) {
          errors.homeSize = 'Home size is required';
        }
        if (!formData.moveType && (touchedFields.moveType || forceValidation)) {
          errors.moveType = 'Move type is required';
        }
        break;
        
      case 3:
        if (!formData.pickupAddress.street && (touchedFields['pickupAddress.street'] || forceValidation)) {
          errors['pickupAddress.street'] = 'Pickup street address is required';
        }
        if (!formData.pickupAddress.city && (touchedFields['pickupAddress.city'] || forceValidation)) {
          errors['pickupAddress.city'] = 'Pickup city is required';
        }
        if (!formData.pickupAddress.state && (touchedFields['pickupAddress.state'] || forceValidation)) {
          errors['pickupAddress.state'] = 'Pickup state is required';
        }
        if (!formData.pickupAddress.zipCode && (touchedFields['pickupAddress.zipCode'] || forceValidation)) {
          errors['pickupAddress.zipCode'] = 'Pickup ZIP code is required';
        } else if (formData.pickupAddress.zipCode && (touchedFields['pickupAddress.zipCode'] || forceValidation)) {
          const zipValidation = validateZipCode(formData.pickupAddress.zipCode);
          if (!zipValidation.isValid) {
            errors['pickupAddress.zipCode'] = zipValidation.error;
          }
        }
        break;
        
      case 4:
        if (!formData.dropoffAddress.street && (touchedFields['dropoffAddress.street'] || forceValidation)) {
          errors['dropoffAddress.street'] = 'Dropoff street address is required';
        }
        if (!formData.dropoffAddress.city && (touchedFields['dropoffAddress.city'] || forceValidation)) {
          errors['dropoffAddress.city'] = 'Dropoff city is required';
        }
        if (!formData.dropoffAddress.state && (touchedFields['dropoffAddress.state'] || forceValidation)) {
          errors['dropoffAddress.state'] = 'Dropoff state is required';
        }
        if (!formData.dropoffAddress.zipCode && (touchedFields['dropoffAddress.zipCode'] || forceValidation)) {
          errors['dropoffAddress.zipCode'] = 'Dropoff ZIP code is required';
        } else if (formData.dropoffAddress.zipCode && (touchedFields['dropoffAddress.zipCode'] || forceValidation)) {
          const zipValidation = validateZipCode(formData.dropoffAddress.zipCode);
          if (!zipValidation.isValid) {
            errors['dropoffAddress.zipCode'] = zipValidation.error;
          }
        }
        break;
        
      case 5:
        if (formData.items.length === 0 && (touchedFields.items || forceValidation)) {
          errors.items = 'At least one item is required';
        }
        if (formData.servicesRequested.length === 0 && (touchedFields.services || forceValidation)) {
          errors.services = 'At least one service is required';
        }
        
        // Validate individual items
        if (formData.items && Array.isArray(formData.items)) {
        formData.items.forEach((item, index) => {
            if ((!item || !item.name || !item.name.trim()) && (touchedFields[`item${index}Name`] || forceValidation)) {
            errors[`item${index}Name`] = 'Item name is required';
          }
        });
        }
        break;
        
      case 6:
        // For long-distance moves, step 6 is the review step
        if (isLongDistance) {
          return true; // No validation needed for long-distance review
        } else {
          return true; // Quote step always valid
        }
        
      case 7:
        // For regular moves, step 7 is review with terms
        if (!isLongDistance) {
          if (!agreedToTerms && (touchedFields.terms || forceValidation)) {
            errors.terms = 'You must agree to the terms and conditions to proceed';
          }
        }
        break;
        
      case 8:
        // For regular moves, step 8 is payment
        return true;
        
      default:
        return true;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    // Mark all fields in current step as touched before validation
    const markCurrentStepFieldsAsTouched = () => {
      const newTouchedFields = { ...touchedFields };
      
      switch (currentStep) {
        case 1:
          newTouchedFields['customerInfo.firstName'] = true;
          newTouchedFields['customerInfo.lastName'] = true;
          newTouchedFields['customerInfo.email'] = true;
          newTouchedFields['customerInfo.phone'] = true;
          break;
        case 2:
          newTouchedFields.moveDate = true;
          newTouchedFields.moveTime = true;
          newTouchedFields.homeSize = true;
          newTouchedFields.moveType = true;
          break;
        case 3:
          newTouchedFields['pickupAddress.street'] = true;
          newTouchedFields['pickupAddress.city'] = true;
          newTouchedFields['pickupAddress.state'] = true;
          newTouchedFields['pickupAddress.zipCode'] = true;
          break;
        case 4:
          newTouchedFields['dropoffAddress.street'] = true;
          newTouchedFields['dropoffAddress.city'] = true;
          newTouchedFields['dropoffAddress.state'] = true;
          newTouchedFields['dropoffAddress.zipCode'] = true;
          break;
        case 5:
          newTouchedFields.services = true;
          newTouchedFields.items = true;
          // Mark all item names as touched
          if (formData.items && Array.isArray(formData.items)) {
            formData.items.forEach((_, index) => {
              newTouchedFields[`item${index}Name`] = true;
            });
          }
          break;
        case 7:
          if (formData.moveType !== 'long-distance') {
            newTouchedFields.terms = true;
          }
          break;
      }
      
      setTouchedFields(newTouchedFields);
    };
    
    markCurrentStepFieldsAsTouched();
    
    if (validateStep(currentStep, true)) { // Force validation when trying to proceed
      const maxSteps = steps.length;
      
      if (formData.moveType === 'long-distance') {
        // For long-distance moves, use the dynamic step count
        setCurrentStep(prev => Math.min(prev + 1, maxSteps));
      } else {
        setCurrentStep(prev => Math.min(prev + 1, maxSteps));
        
        // Calculate quote when reaching step 6 (quote step)
        if (currentStep === 5) {
          setQuote(calculateQuote());
        }
      }
      setError('');
    }
  };

  // Memoize the validation result to prevent infinite re-renders
  const isCurrentStepValid = useMemo(() => {
    return validateStep(currentStep);
  }, [currentStep, formData, agreedToTerms, touchedFields]);

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
    setValidationErrors({});
  };

  const submitBooking = async () => {
    setLoading(true);
    setError('');

    try {
      let bookingData;
      
      if (formData.moveType === 'long-distance') {
        // For long-distance moves, don't include quote data
        bookingData = {
          ...formData,
          // No quote data for long-distance moves
        };
      } else {
        // Ensure we have the latest quote for regular moves
        const currentQuote = quote || calculateQuote();
        
        bookingData = {
          ...formData,
          quote: {
            ...currentQuote,
            // Ensure all pricing details are included
            subtotal: currentQuote.totalPrice,
            tax: currentQuote.totalPrice * 0.08, // 8% tax
            total: currentQuote.totalPrice * 1.08,
            currency: 'USD',
            deposit: currentQuote.deposit
          }
        };
      }
      
      console.log('📋 Full booking data being sent:', bookingData);

      const response = await bookingsService.createBooking(bookingData);
      
      // Debug logging to understand response structure
      console.log('🔍 Booking Creation Response Debug:');
      console.log('  Full response:', response);
      console.log('  Response status:', response?.status);
      console.log('  Response data:', response?.data);
      console.log('  Response data type:', typeof response?.data);
      console.log('  Response data keys:', response?.data ? Object.keys(response.data) : 'No data');
      
      // Try different possible response structures
      let bookingId = null;
      
      // Check various possible response structures
      if (response?.data?.booking?._id) {
        bookingId = response.data.booking._id;
        console.log('  ✅ Found booking ID in response.data.booking._id:', bookingId);
      } else if (response?.data?._id) {
        bookingId = response.data._id;
        console.log('  ✅ Found booking ID in response.data._id:', bookingId);
      } else if (response?.data?.id) {
        bookingId = response.data.id;
        console.log('  ✅ Found booking ID in response.data.id:', bookingId);
      } else if (response?.data?.data?.booking?._id) {
        bookingId = response.data.data.booking._id;
        console.log('  ✅ Found booking ID in response.data.data.booking._id:', bookingId);
      } else if (response?.data?.data?._id) {
        bookingId = response.data.data._id;
        console.log('  ✅ Found booking ID in response.data.data._id:', bookingId);
      }
      
      if (bookingId) {
        setCreatedBookingId(bookingId);
        setBookingCreated(true);
        //localStorage.setItem('booking_created', 'true');
        //localStorage.setItem('booking_id', bookingId);
        
        if (formData.moveType === 'long-distance') {
          // For long-distance moves, redirect to a confirmation page
          navigate(`/booking-confirmation/${bookingId}`);
        } else {
          // Move to payment step for regular moves
          setCurrentStep(8);
        }
        console.log('  ✅ Booking created successfully with ID:', bookingId);
      } else {
        console.error('  ❌ Could not find booking ID in response structure');
        console.error('  Full response structure:', JSON.stringify(response, null, 2));
        throw new Error('Invalid response: booking ID not found');
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(serviceUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-create booking when reaching payment step if not already created
  const ensureBookingExists = async () => {
    if (currentStep === 8 && !bookingCreated && !loading) {
      await submitBooking();
    }
  };

  // Call ensureBookingExists when reaching payment step
  useEffect(() => {
    ensureBookingExists();
  }, [currentStep]);
  useEffect(() => {
    const bookingCreated = localStorage.getItem('booking_created');
    const bookingId = localStorage.getItem('booking_id');
    if (bookingCreated && bookingId) {
      setBookingCreated(true);
      setCreatedBookingId(bookingId);
      setCurrentStep(8);
    }
  }, []);

  // Form persistence and focus management
  useEffect(() => {
    // Save form data to localStorage whenever it changes
    const saveFormData = () => {
      try {
        //localStorage.setItem('booknmove_booking_form', JSON.stringify(formData));
        //localStorage.setItem('booknmove_booking_step', currentStep.toString());
      } catch (e) {
        console.warn('Failed to save form data:', e);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveFormData, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep]);

  // Restore step from localStorage on component mount
  useEffect(() => {
    const savedStep = localStorage.getItem('booknmove_booking_step');
    if (savedStep && !isNaN(parseInt(savedStep))) {
      const step = parseInt(savedStep);
      if (step >= 1 && step <= 8) {
        setCurrentStep(step);
      }
    }
  }, []);

  // Reset step when move type changes
  useEffect(() => {
    // If user changes to long-distance and is on step 6 (quote), go to step 6 (review)
    if (formData.moveType === 'long-distance' && currentStep === 6) {
      // Stay on step 6 but it becomes review instead of quote
      return;
    }
    // If user changes from long-distance to regular and is on step 6 (review), go to step 6 (quote)
    if (formData.moveType !== 'long-distance' && currentStep === 6 && steps.length === 8) {
      // Stay on step 6 but it becomes quote instead of review
      return;
    }
  }, [formData.moveType, currentStep, steps.length]);

  // Auto-focus management
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

  // Clean up localStorage on successful booking completion
  useEffect(() => {
    if (bookingCreated) {
      // Clear form data after successful booking
      const timeoutId = setTimeout(() => {
        localStorage.removeItem('booknmove_booking_form');
        localStorage.removeItem('booknmove_booking_step');
      }, 5000); // Keep data for 5 seconds in case of payment issues

      return () => clearTimeout(timeoutId);
    }
  }, [bookingCreated]);

  // Handle page reload warnings
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if there's form data and booking isn't completed
      if (formData.customerInfo?.firstName && !bookingCreated) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, bookingCreated]);



  const getFieldError = (fieldName) => {
    // Only show error if field has been touched
    return touchedFields[fieldName] ? validationErrors[fieldName] : null;
  };

  const renderFieldError = (fieldName) => {
    const error = getFieldError(fieldName);
    if (!error) return null;
    
    return (
      <div className="flex items-center mt-1 text-red-600 text-sm">
        <FiAlertCircle className="w-4 h-4 mr-1" />
        {error}
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 sm:py-8">
      <div ref={formRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              <span className="block">Book Your Move</span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl xl:text-5xl bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent font-extrabold">
                In Minutes
              </span>
          </h1>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -left-4 w-8 h-8 bg-primary-100 rounded-full opacity-60 animate-pulse hidden sm:block"></div>
            <div className="absolute -top-4 -right-6 w-6 h-6 bg-primary-200 rounded-full opacity-40 animate-pulse delay-300 hidden sm:block"></div>
          </div>
          
       {/*    <div className="max-w-3xl mx-auto">
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-4 leading-relaxed font-medium">
              Connect with <span className="text-primary-600 font-semibold">trusted local movers</span> instantly
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Our streamlined platform matches you with verified professionals in your area. 
              Get quotes, compare services, and book your move with confidence.
            </p>
          </div> */}
          
          {/* Benefits */}
         {/*  <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200 shadow-sm">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Instant Quotes</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200 shadow-sm">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Verified Movers</span>
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200 shadow-sm">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Secure Booking</span>
            </div>
          </div> */}
        </div>

        {/* Progress Steps */}
        <div className="mb-8 sm:mb-12">
          <div className="hidden md:flex items-center justify-center xl:justify-center overflow-x-auto xl:overflow-x-visible scrollbar-thin pb-2 xl:pb-0">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center relative min-w-0">
                <div className="flex flex-col items-center relative z-10">
                  <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all duration-300 ${
                  currentStep > index + 1
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 border-primary-600 text-white shadow-lg'
                    : currentStep === index + 1
                    ? 'border-primary-600 text-primary-600 bg-white shadow-lg'
                    : 'border-gray-300 text-gray-400 bg-gray-50'
                }`}>
                  {currentStep > index + 1 ? (
                      <FiCheck className="w-5 h-5 lg:w-6 lg:h-6" />
                  ) : (
                      <step.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  )}
                </div>
                <span
                    className={`text-sm font-medium mt-3 transition-colors duration-200 text-center whitespace-nowrap ${
                    currentStep === index + 1 ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 lg:w-20 h-0.5 mx-4 transition-all duration-300 ${
                    currentStep > index + 1 ? 'bg-gradient-to-r from-primary-600 to-primary-700' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile Progress Grid */}
          <div className="md:hidden">
            <div className="grid grid-cols-4 gap-3 mb-6">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                    currentStep > index + 1
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 border-primary-600 text-white shadow-lg'
                      : currentStep === index + 1
                      ? 'border-primary-600 text-primary-600 bg-white shadow-lg'
                      : 'border-gray-300 text-gray-400 bg-gray-50'
                  }`}>
                    {currentStep > index + 1 ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-1.5 text-center leading-tight ${
                    currentStep === index + 1 ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Mobile progress bar */}
            <div className="relative">
              <div className="w-full h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-1 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Step {currentStep}</span>
                <span>of {steps.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <div ref={(el) => stepRefs.current[1] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Contact Information</h2>
                <p className="text-gray-600">We need your contact details to process your booking</p>
              </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="customerInfo.firstName"
                    value={formData.customerInfo.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      getFieldError('customerInfo.firstName') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    required
                  />
                  {renderFieldError('customerInfo.firstName')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="customerInfo.lastName"
                    value={formData.customerInfo.lastName}
                    onChange={handleInputChange}
                    placeholder="Smith"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      getFieldError('customerInfo.lastName') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    required
                  />
                  {renderFieldError('customerInfo.lastName')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="customerInfo.email"
                    value={formData.customerInfo.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      getFieldError('customerInfo.email') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    required
                  />
                  {renderFieldError('customerInfo.email')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="customerInfo.phone"
                    value={formData.customerInfo.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      handleInputChange({
                        target: {
                          name: 'customerInfo.phone',
                          value: formatted
                        }
                      });
                    }}
                    placeholder="(555) 123-4567"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      getFieldError('customerInfo.phone') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    required
                  />
                  {renderFieldError('customerInfo.phone')}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Move Details */}
          {currentStep === 2 && (
            <div ref={(el) => stepRefs.current[2] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Move Details</h2>
                <p className="text-gray-600">Tell us about your move requirements</p>
              </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move Date *
                  </label>
                  <input
                    type="date"
                    name="moveDate"
                    value={formData.moveDate}
                    onChange={handleInputChange}
                    min={(() => {
                      try {
                        return new Date().toISOString().split('T')[0];
                      } catch (e) {
                        console.error('Date formatting error:', e);
                        return '';
                      }
                    })()}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      getFieldError('moveDate') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    required
                  />
                  {renderFieldError('moveDate')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    name="moveTime"
                    value={formData.moveTime}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      getFieldError('moveTime') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                  </select>
                  {renderFieldError('moveTime')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Home Size *
                  </label>
                  <select
                    name="homeSize"
                    value={formData.homeSize}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('homeSize') ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="studio">Studio (2 movers + truck)</option>
                    <option value="1-bedroom">1 Bedroom (2 movers + truck)</option>
                    <option value="2-bedroom">2 Bedroom (2 movers + truck)</option>
                    <option value="3-bedroom">3 Bedroom (3 movers + truck)</option>
                    <option value="4-bedroom">4 Bedroom (4 movers + truck)</option>
                    <option value="small-office">Small Office (2 movers + truck)</option>
                    <option value="medium-office">Medium Office (3 movers + truck)</option>
                    <option value="large-office">Large Office (4 movers + truck)</option>
                    <option value="2-labor-only">2 Labor Only (2 movers)</option>
                    <option value="3-labor-only">3 Labor Only (3 movers)</option>

                  </select>
                  {renderFieldError('homeSize')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move Type *
                  </label>
                  <select
                    name="moveType"
                    value={formData.moveType}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('moveType') ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                   <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="long-distance">Long Distance</option>
                   
                    
                  </select>
                  {renderFieldError('moveType')}
                </div>
              </div>

             {/*  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div> */}
            </div>
          )}

          {/* Step 3: Pickup Address */}
          {currentStep === 3 && (
            <div ref={(el) => stepRefs.current[3] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Pickup Address</h2>
                <p className="text-gray-600">Where should we pick up your items?</p>
              </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="pickupAddress.street"
                    value={formData.pickupAddress.street}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('pickupAddress.street') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {renderFieldError('pickupAddress.street')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="pickupAddress.city"
                    value={formData.pickupAddress.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('pickupAddress.city') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {renderFieldError('pickupAddress.city')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <SearchableSelect
                    name="pickupAddress.state"
                    value={formData.pickupAddress.state}
                    onChange={handleInputChange}
                    options={US_STATES}
                    placeholder="Search for your state..."
                    displayKey="name"
                    valueKey="code"
                    error={!!getFieldError('pickupAddress.state')}
                    required
                  />
                  {renderFieldError('pickupAddress.state')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="pickupAddress.zipCode"
                    value={formData.pickupAddress.zipCode}
                    onChange={(e) => {
                      const zipCode = e.target.value.replace(/\D/g, '').slice(0, 5);
                      handleInputChange({
                        target: {
                          name: 'pickupAddress.zipCode',
                          value: zipCode
                        }
                      });
                      
                      // Auto-fill city and state if valid ZIP
                      if (zipCode.length === 5) {
                        const validation = validateZipCode(zipCode);
                        if (validation.isValid) {
                          setFormData(prev => ({
                            ...prev,
                            pickupAddress: {
                              ...prev.pickupAddress,
                              zipCode: zipCode,
                              city: validation.city,
                              state: validation.state
                            }
                          }));
                        }
                      }
                    }}
                    placeholder="12345"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('pickupAddress.zipCode') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {renderFieldError('pickupAddress.zipCode')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apartment
                  </label>
                  <input
                    type="text"
                    name="pickupAddress.floor"
                    value={formData.pickupAddress.floor}
                    onChange={handleInputChange}
                    placeholder="Apt #"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stairs
                  </label>
                  <input
                    type="number"
                    name="pickupAddress.stairs"
                    value={formData.pickupAddress.stairs}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Number of stairs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="pickupAddress.elevator"
                      checked={formData.pickupAddress.elevator}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Elevator available</span>
                  </label>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Distance (feet)
                  </label>
                  <input
                    type="number"
                    name="pickupAddress.parkingDistance"
                    value={formData.pickupAddress.parkingDistance}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Distance from parking to entrance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div> */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="pickupAddress.notes"
                    value={formData.pickupAddress.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Building codes, special instructions, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Dropoff Address */}
          {currentStep === 4 && (
            <div ref={(el) => stepRefs.current[4] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dropoff Address</h2>
                <p className="text-gray-600">Where should we deliver your items?</p>
              </div>
               
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="dropoffAddress.street"
                    value={formData.dropoffAddress.street}
                    onChange={handleInputChange}
                    placeholder="456 Oak Avenue"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('dropoffAddress.street') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {renderFieldError('dropoffAddress.street')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="dropoffAddress.city"
                    value={formData.dropoffAddress.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('dropoffAddress.city') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {renderFieldError('dropoffAddress.city')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <SearchableSelect
                    name="dropoffAddress.state"
                    value={formData.dropoffAddress.state}
                    onChange={handleInputChange}
                    options={US_STATES}
                    placeholder="Search for your state..."
                    displayKey="name"
                    valueKey="code"
                    error={!!getFieldError('dropoffAddress.state')}
                    required
                  />
                  {renderFieldError('dropoffAddress.state')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="dropoffAddress.zipCode"
                    value={formData.dropoffAddress.zipCode}
                    onChange={(e) => {
                      const zipCode = e.target.value.replace(/\D/g, '').slice(0, 5);
                      handleInputChange({
                        target: {
                          name: 'dropoffAddress.zipCode',
                          value: zipCode
                        }
                      });
                      
                      // Auto-fill city and state if valid ZIP
                      if (zipCode.length === 5) {
                        const validation = validateZipCode(zipCode);
                        if (validation.isValid) {
                          setFormData(prev => ({
                            ...prev,
                            dropoffAddress: {
                              ...prev.dropoffAddress,
                              zipCode: zipCode,
                              city: validation.city,
                              state: validation.state
                            }
                          }));
                        }
                      }
                    }}
                    placeholder="12345"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      getFieldError('dropoffAddress.zipCode') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {renderFieldError('dropoffAddress.zipCode')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor/Apartment
                  </label>
                  <input
                    type="text"
                    name="dropoffAddress.floor"
                    value={formData.dropoffAddress.floor}
                    onChange={handleInputChange}
                    placeholder="Floor, Apt #, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stairs
                  </label>
                  <input
                    type="number"
                    name="dropoffAddress.stairs"
                    value={formData.dropoffAddress.stairs}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Number of stairs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="dropoffAddress.elevator"
                      checked={formData.dropoffAddress.elevator}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Elevator available</span>
                  </label>
                </div>

               {/*  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parking Distance (feet)
                  </label>
                  <input
                    type="number"
                    name="dropoffAddress.parkingDistance"
                    value={formData.dropoffAddress.parkingDistance}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Distance from parking to entrance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div> */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="dropoffAddress.notes"
                    value={formData.dropoffAddress.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Building codes, special instructions, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Items & Services */}
          {currentStep === 5 && (
            <div ref={(el) => stepRefs.current[5] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Items & Services</h2>
                <p className="text-gray-600">What services do you need and what items are you moving?</p>
              </div>
               
              {/* Services */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Services Needed *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {serviceUtils.getServicesOptions().map((service) => (
                    <label key={service} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.servicesRequested.includes(service)}
                        onChange={() => handleServiceChange(service)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {service.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
                {renderFieldError('services')}
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900">Items to Move *</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center text-primary-600 hover:text-primary-500"
                  >
                    <FiPlus className="mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(formData.items || []).map((item, index) => (
                    <div key={index} className="relative p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      {/* Delete button in top-right corner */}
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 z-10"
                        title="Remove item"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                      
                      {/* Item content */}
                      <div className="pr-10"> {/* Add right padding to avoid overlap with delete button */}
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                          <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                            <input
                              type="text"
                              value={item?.name || ''}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              placeholder="Item name"
                              className={`w-full px-2 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm ${
                                getFieldError(`item${index}Name`) ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            {renderFieldError(`item${index}Name`)}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="text"
                              value={item?.quantity || 0}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target?.value))}
                              
                              placeholder="Qty"
                              className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                            />
                          </div>
                          {/* <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Weight (lbs)</label>
                            <input
                              type="text"
                              value={item?.weight || 0}
                              onChange={(e) => updateItem(index, 'weight', parseInt(e.target.value) || 0)}
                              
                              placeholder="Weight"
                              className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                            />
                          </div> */}
                          <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Options</label>
                            <div className="flex space-x-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item?.fragile || false}
                                  onChange={(e) => updateItem(index, 'fragile', e.target.checked)}
                                  className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-1 text-xs text-gray-600">Fragile</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item?.heavy || false}
                                  onChange={(e) => updateItem(index, 'heavy', e.target.checked)}
                                  className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-1 text-xs text-gray-600">Heavy</span>
                              </label>
                            </div>
                            
                          </div>
                          
                        </div>
                        {item.name.toLowerCase().includes("piano")&& <p className='text-xs mt-2 text-gray-600'>*Additional charges will be applied for piano moving</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {renderFieldError('items')}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any special handling requirements, fragile items, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Step 6: Quote (only for regular moves) */}
          {currentStep === 6 && formData.moveType !== 'long-distance' && quote && (
            <div ref={(el) => stepRefs.current[6] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Quote</h2>
                <p className="text-gray-600">Here's your personalized moving quote</p>
              </div>
               
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {quote.homeSize.replace('-', ' ').toUpperCase()} MOVE
                  </h3>
                  <p className="text-gray-600">Professional moving service with truck and movers</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">Base Service</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>First 2 hours</span>
                        <span className="font-medium">${quote.basePrice}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Extra Hours</span>
                          <span className="font-medium">${quote.additionalHourCost} per hour</span>
                        </div>
                      {quote.additionalHours > 0 && (
                        <div className="flex justify-between">
                          <span>Additional {quote.additionalHours} hour(s)</span>
                          <span className="font-medium">${quote.additionalCost}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      {/* <div className="flex justify-between">
                        <span>Total Move Cost</span>
                        <span className="font-medium">${quote.totalPrice}</span>
                      </div> */}
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Deposit Due Today</span>
                        <span className="font-bold text-primary-600">${quote.deposit}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Balance Due After Move</span>
                        <span>${quote.totalPrice - quote.deposit}+${quote.additionalHourCost} per extra hour</span>
                      </div>
                     
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiInfo className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 mb-1">Important Notes</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Prices are subject to change based on final move requirements</li>
                        <li>• Deposit secures your booking</li>
                        <li>• Balance is paid directly to your assigned mover after completion</li>
                        <li>• No time estimates provided to avoid customer/mover conflicts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review (long-distance) or Step 7: Review (regular moves) */}
          {((currentStep === 6 && formData.moveType === 'long-distance') || (currentStep === 7 && formData.moveType !== 'long-distance')) && (
            <div ref={(el) => stepRefs.current[formData.moveType === 'long-distance' ? 6 : 7] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {formData.moveType === 'long-distance' ? 'Confirm Your Long-Distance Move Request' : 'Review Your Booking'}
                </h2>
                <p className="text-gray-600">
                  {formData.moveType === 'long-distance' 
                    ? 'We\'ll review your request and send you a personalized quote via email'
                    : 'Double-check all the details before submitting'
                  }
                </p>
              </div>
               
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer & Move Details Summary */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {formData.customerInfo.firstName} {formData.customerInfo.lastName}</p>
                      <p><span className="font-medium">Email:</span> {formData.customerInfo.email}</p>
                      <p><span className="font-medium">Phone:</span> {formData.customerInfo.phone}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Move Details</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Date:</span> {formData.moveDate ? serviceUtils.formatDate(formData.moveDate) : 'Not specified'}</p>
                      <p><span className="font-medium">Time:</span> {formData.moveTime}</p>
                      <p><span className="font-medium">Type:</span> {formData.moveType}</p>
                      <p><span className="font-medium">Home Size:</span> {formData.homeSize}</p>
                      <p><span className="font-medium">Duration:</span> {formData.estimatedDuration} hours</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Addresses</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <p className="font-medium">Pickup:</p>
                        <p>{formData.pickupAddress.street}</p>
                        <p>{formData.pickupAddress.city}, {formData.pickupAddress.state} {formData.pickupAddress.zipCode}</p>
                      </div>
                      <div>
                        <p className="font-medium">Dropoff:</p>
                        <p>{formData.dropoffAddress.street}</p>
                        <p>{formData.dropoffAddress.city}, {formData.dropoffAddress.state} {formData.dropoffAddress.zipCode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services & Items Summary */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Services</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {(formData.servicesRequested || []).map((service, index) => (
                        <p key={index} className="capitalize">
                          • {service ? service.replace('-', ' ') : 'Unknown service'}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Items</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {(formData.items || []).map((item, index) => (
                        <p key={index}>
                          • {item?.name || 'Unnamed item'} (Qty: {item?.quantity || 0})
                          {item?.fragile && <span className="text-orange-600 ml-1">• Fragile</span>}
                          {item?.heavy && <span className="text-red-600 ml-1">• Heavy</span>}
                        </p>
                      ))}
                    </div>
                  </div>

                  {formData.specialInstructions && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
                      <p className="text-sm text-gray-600">{formData.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FiInfo className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {formData.moveType === 'long-distance' ? (
                          <>
                            <li>We'll review your long-distance move request within 24 hours</li>
                            <li>Our team will contact you via email with a personalized quote</li>
                            <li>We'll provide detailed information about the moving process and timeline</li>
                            <li>Once you approve the quote, we'll assign a specialized long-distance mover</li>
                          </>
                        ) : (
                          <>
                            <li>Your booking will be automatically sent to movers in your area</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Agreement - Only for non-long-distance moves */}
              {formData.moveType !== 'long-distance' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="agreedToTerms"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setTouchedFields(prev => ({ ...prev, terms: true }));
                        setAgreedToTerms(e.target.checked);
                        if (validationErrors.terms) {
                          setValidationErrors(prev => ({ ...prev, terms: null }));
                        }
                      }}
                      className={`mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                        getFieldError('terms') ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    <div className="flex-1">
                      <label htmlFor="agreedToTerms" className="text-sm text-gray-700 cursor-pointer">
                        I agree to the{' '}
                        <a 
                          href="/terms" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500 underline"
                        >
                          Terms and Conditions
                        </a>{' '}
                        and{' '}
                        <a 
                          href="/privacy" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500 underline"
                        >
                          Privacy Policy
                        </a>{' '}
                        of BooknMove platform. By booking this move, I understand that I am securing my booking with a deposit and will receive quotes from verified movers in my area. *
                      </label>
                      {renderFieldError('terms')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 8: Payment (only for regular moves) */}
          {currentStep === 8 && formData.moveType !== 'long-distance' && (
            <div ref={(el) => stepRefs.current[8] = el} className="space-y-6">
              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment</h2>
                <p className="text-gray-600">Secure your booking with a deposit payment</p>
              </div>
               
              
               
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FiInfo className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Booking Deposit Required</h3>
                    <p className="text-sm text-blue-700">
                      To secure your booking, a $147 deposit is required. This deposit ensures your move is prioritized with our vetted movers.
                    </p>
                  </div>
                </div>
              </div>

                                            {loading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                   <p className="text-gray-600">Creating your booking...</p>
                 </div>
               ) : (
                 <div>
                   <PaymentForm
                     amount={(quote?.deposit || 147) * 100} // Convert to cents
                     paymentType="booking-deposit"
                     bookingId={createdBookingId}
                     guestEmail={formData.customerInfo.email} // Pass guest email
                     description={`Booking deposit for ${quote?.homeSize?.replace('-', ' ') || 'your'} move${formData.moveDate ? ` on ${serviceUtils.formatDate(formData.moveDate)}` : ''}`}
                     onSuccess={(paymentData) => {
                       // Save booking data for confirmation page
                       const confirmationData = {
                         bookingId: createdBookingId,
                         moveDate: serviceUtils.formatDate(formData.moveDate),
                         moveTime: formData.moveTime,
                         pickupAddress: `${formData.pickupAddress.street}, ${formData.pickupAddress.city}, ${formData.pickupAddress.state} ${formData.pickupAddress.zipCode}`,
                         dropoffAddress: `${formData.dropoffAddress.street}, ${formData.dropoffAddress.city}, ${formData.dropoffAddress.state} ${formData.dropoffAddress.zipCode}`,
                         homeSize: formData.homeSize,
                         customerEmail: formData.customerInfo.email,
                         customerPhone: formData.customerInfo.phone,
                         depositAmount: quote?.deposit * 100 || paymentData.amount
                       };
                       
                       // Store in localStorage for the confirmation page
                       localStorage.setItem(`booking_confirmation_${createdBookingId}`, JSON.stringify(confirmationData));
                       
                       // Clear the booking form data
                       localStorage.removeItem('booknmove_booking_form');
                       
                       // Redirect to guest-friendly confirmation page
                       navigate(`/booking-confirmation/${createdBookingId}`);
                     }}
                     onError={(error) => {
                       setError('Payment failed. Please try again.');
                     }}
                   />
                   <div className="mt-4 text-center text-sm text-gray-500">
                     <p>Having trouble with payment? Contact support at SUPPORT@BOOKANDMOVE.COM</p>
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200/50">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ← Previous
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isCurrentStepValid}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
            >
              Next →
            </button>
          ) : currentStep === steps.length ? (
            <button
              type="button"
              onClick={submitBooking}
              disabled={loading || !isCurrentStepValid}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
            >
              {loading 
                ? 'Creating Booking...' 
                : formData.moveType === 'long-distance' 
                  ? 'Submit Request' 
                  : 'Proceed to Payment'
              }
            </button>
          ) : null}
        </div>

        {/* Payment timeout warning */}
       {/*  {currentStep === 7 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <FiClock className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-1">⚠️ Important Payment Notice</h4>
                <p className="text-sm text-red-800">
                  <strong>You have 10 minutes to complete your deposit payment</strong> after clicking "Proceed to Payment". 
                  If payment is not completed within this time, your booking will be automatically cancelled to ensure fair access for all customers.
                </p>
                <p className="text-xs text-red-700 mt-2">
                  💡 Tip: Have your payment information ready before proceeding to ensure a smooth checkout process.
                </p>
              </div>
            </div>
          </div>
        )}
 */}
        {/* Terms validation message - Only for non-long-distance moves */}
        {currentStep === steps.length && !agreedToTerms && formData.moveType !== 'long-distance' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <FiAlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Agreement Required</p>
                <p className="text-sm text-amber-700">
                  Please agree to the Terms and Conditions above to proceed with your booking.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBooking;

