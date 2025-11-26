import api from './api';

// Movers service
export const moversService = {
  // Search movers with filters
  searchMovers: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add non-empty filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => params.append(key, item));
        } else {
          params.append(key, value);
        }
      }
    });
    
    return await api.get(`/movers/search?${params.toString()}`);
  },

  // Get mover by ID
  getMover: async (moverId) => {
    return await api.get(`/movers/${moverId}`);
  },

  // Get mover reviews
  getMoverReviews: async (moverId, page = 1, limit = 10) => {
    return await api.get(`/movers/${moverId}/reviews?page=${page}&limit=${limit}`);
  },

  // Update mover profile (mover only)
  updateMover: async (moverId, updateData) => {
    return await api.put(`/movers/${moverId}`, updateData);
  },

  // Get mover bookings (mover only)
  getMoverBookings: async () => {
    return await api.get('/movers/me/bookings');
  },

  // Update mover availability (mover only)
  updateAvailability: async (availability) => {
    return await api.put('/movers/availability', { availability });
  },

  // Update mover pricing (mover only)
  updatePricing: async (pricing) => {
    return await api.put('/movers/pricing', { pricing });
  },

  // Upload mover photos (mover only)
  uploadMoverPhotos: async (photos) => {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photos`, photo);
    });
    
    return await api.post('/movers/upload-photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload verification documents during onboarding (mover only)
  uploadVerificationDocumentsOnboarding: async (documents) => {
    // Map frontend field names to backend document types
    const documentTypeMap = {
      businessLicense: 'license',
      proofOfInsurance: 'insurance',
      vehicleRegistration: 'vehicle',
      backgroundCheck: 'background',
      bondingCertificate: 'bonding',
      dotAuthority: 'dot'
    };

    const formData = new FormData();
    documents.forEach((doc) => {
      formData.append('file', doc.file);
      // Map the field name to the correct document type
      const documentType = documentTypeMap[doc.type] || doc.type;
      formData.append('documentType', documentType);
      if (doc.description) {
        formData.append('description', doc.description);
      }
    });
    
    return await api.post('/movers/upload-documents-onboarding', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Upload verification documents (mover only)
  uploadVerificationDocuments: async (documents) => {
    // Map frontend field names to backend document types
    const documentTypeMap = {
      businessLicense: 'license',
      proofOfInsurance: 'insurance',
      vehicleRegistration: 'vehicle',
      backgroundCheck: 'background',
      bondingCertificate: 'bonding',
      dotAuthority: 'dot'
    };

    const formData = new FormData();
    documents.forEach((doc) => {
      formData.append('file', doc.file);
      // Map the field name to the correct document type
      const documentType = documentTypeMap[doc.type] || doc.type;
      formData.append('documentType', documentType);
      if (doc.description) {
        formData.append('description', doc.description);
      }
    });
    
    return await api.post('/movers/upload-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get all movers (admin only)
  getAllMovers: async () => {
    return await api.get('/movers');
  },

  // Delete mover (admin/owner only)
  deleteMover: async (moverId) => {
    return await api.delete(`/movers/${moverId}`);
  }
};
