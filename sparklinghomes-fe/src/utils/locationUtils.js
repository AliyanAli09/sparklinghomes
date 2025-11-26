import zipcodes from 'zipcodes';

// US States data
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
];

// Validate and auto-fill city/state from zipcode
export const validateZipCode = (zipCode) => {
  if (!zipCode || zipCode.length !== 5) {
    return { isValid: false, error: 'ZIP code must be 5 digits' };
  }

  const locationInfo = zipcodes.lookup(zipCode);
  
  if (!locationInfo) {
    return { isValid: false, error: 'Invalid ZIP code' };
  }

  return {
    isValid: true,
    city: locationInfo.city,
    state: locationInfo.state,
    data: locationInfo
  };
};

// Get cities for a specific state
export const getCitiesForState = (stateCode) => {
  // This would ideally come from a comprehensive database
  // For now, we'll use zipcode data to get common cities
  const stateCities = zipcodes.filter(entry => entry.state === stateCode);
  const uniqueCities = [...new Set(stateCities.map(entry => entry.city))];
  return uniqueCities.sort();
};

// Validate city exists in state
export const validateCityInState = (city, state) => {
  const cities = getCitiesForState(state);
  return cities.includes(city.toUpperCase());
};

// Format phone number for display
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid US number length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber; // Return original if not valid format
};

// Validate US phone number
export const validateUSPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Must be 10 digits (US) or 11 digits starting with 1 (US with country code)
  if (cleaned.length === 10) {
    return { isValid: true, formatted: formatPhoneNumber(cleaned) };
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return { isValid: true, formatted: formatPhoneNumber(cleaned) };
  }
  
  return { 
    isValid: false, 
    error: 'Please enter a valid US phone number (10 digits)' 
  };
};
