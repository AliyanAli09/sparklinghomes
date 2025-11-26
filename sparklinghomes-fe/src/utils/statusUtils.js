// Status utility functions for consistent status handling across the app

export const getBookingStatusConfig = (status, moveType = 'residential') => {
  const statusConfig = {
    'pending-assignment': {
      color: moveType === 'long-distance' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800',
      text: moveType === 'long-distance' ? 'Quote in progress' : 'Looking for movers available',
      icon: moveType === 'long-distance' ? 'message-square' : 'search',
      description: moveType === 'long-distance' ? 'Our team is preparing your personalized quote' : 'We are searching for available movers in your area'
    },
    'quote-requested': {
      color: 'bg-blue-100 text-blue-800',
      text: moveType === 'long-distance' ? 'Quote in progress' : 'Quote requested',
      icon: 'message-square',
      description: moveType === 'long-distance' ? 'Our team is preparing your personalized quote' : 'Waiting for movers to provide quotes'
    },
    'quote-provided': {
      color: 'bg-purple-100 text-purple-800',
      text: moveType === 'long-distance' ? 'Quote ready' : 'Quote provided',
      icon: 'dollar-sign',
      description: moveType === 'long-distance' ? 'Your personalized quote is ready for review' : 'Mover has provided a quote, waiting for your approval'
    },
    'quote-accepted': {
      color: 'bg-green-100 text-green-800',
      text: moveType === 'long-distance' ? 'Quote approved' : 'Quote accepted',
      icon: 'check-circle',
      description: moveType === 'long-distance' ? 'You have approved the quote, booking is confirmed' : 'You have accepted the quote, booking is confirmed'
    },
    'confirmed': {
      color: 'bg-green-100 text-green-800',
      text: 'Confirmed',
      icon: 'check-circle',
      description: 'Booking is confirmed and ready for move day'
    },
    'in-progress': {
      color: 'bg-purple-100 text-purple-800',
      text: 'In progress',
      icon: 'truck',
      description: 'Your move is currently in progress'
    },
    'completed': {
      color: 'bg-blue-100 text-blue-800',
      text: 'Completed',
      icon: 'check-circle',
      description: 'Your move has been completed successfully'
    },
    'cancelled': {
      color: 'bg-red-100 text-red-800',
      text: 'Cancelled',
      icon: 'x-circle',
      description: 'This booking has been cancelled'
    },
    'disputed': {
      color: 'bg-orange-100 text-orange-800',
      text: 'Disputed',
      icon: 'alert-triangle',
      description: 'This booking is under dispute'
    },
    'long-distance-pending': {
      color: 'bg-blue-100 text-blue-800',
      text: 'Quote in progress',
      icon: 'message-square',
      description: 'Our team is preparing your personalized quote'
    },
    'long-distance-quote-ready': {
      color: 'bg-purple-100 text-purple-800',
      text: 'Quote ready',
      icon: 'dollar-sign',
      description: 'Your personalized quote is ready for review'
    },
    'long-distance-quote-approved': {
      color: 'bg-green-100 text-green-800',
      text: 'Quote approved',
      icon: 'check-circle',
      description: 'You have approved the quote, booking is confirmed'
    }
  };

  return statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800',
    text: status || 'Unknown',
    icon: 'help-circle',
    description: 'Status unknown'
  };
};

export const getJobAssignmentStatusConfig = (status) => {
  const statusConfig = {
    'unassigned': {
      color: 'bg-gray-100 text-gray-800',
      text: 'Unassigned',
      description: 'No mover has been assigned yet'
    },
    'alerted': {
      color: 'bg-yellow-100 text-yellow-800',
      text: 'Alerted',
      description: 'Job alerts have been sent to movers'
    },
    'claimed': {
      color: 'bg-blue-100 text-blue-800',
      text: 'Claimed',
      description: 'A mover has claimed this job'
    },
    'assigned': {
      color: 'bg-green-100 text-green-800',
      text: 'Assigned',
      description: 'Job has been assigned to a mover'
    },
    'completed': {
      color: 'bg-blue-100 text-blue-800',
      text: 'Completed',
      description: 'Job has been completed'
    }
  };

  return statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800',
    text: status || 'Unknown',
    description: 'Status unknown'
  };
};

export const getPaymentStatusConfig = (status, moveType = 'residential') => {
  const statusConfig = {
    'pending': {
      color: moveType === 'long-distance' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800',
      text: moveType === 'long-distance' ? 'Quote in progress' : 'Pending',
      description: moveType === 'long-distance' ? 'Customer waiting for quote details' : 'Payment is pending'
    },
    'deposit-paid': {
      color: 'bg-blue-100 text-blue-800',
      text: 'Deposit paid',
      description: 'Deposit has been paid'
    },
    'paid': {
      color: 'bg-green-100 text-green-800',
      text: 'Paid',
      description: 'Payment completed'
    },
    'failed': {
      color: 'bg-red-100 text-red-800',
      text: 'Failed',
      description: 'Payment failed'
    },
    'refunded': {
      color: 'bg-orange-100 text-orange-800',
      text: 'Refunded',
      description: 'Payment has been refunded'
    },
    'long-distance-pending': {
      color: 'bg-blue-100 text-blue-800',
      text: 'Quote in progress',
      description: 'Customer waiting for quote details'
    },
    'long-distance-quote-ready': {
      color: 'bg-purple-100 text-purple-800',
      text: 'Quote ready',
      description: 'Quote prepared, awaiting customer approval'
    }
  };

  return statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800',
    text: status || 'Unknown',
    description: 'Status unknown'
  };
};

// Helper function to get status badge component
export const getStatusBadge = (status, type = 'booking', moveType = 'residential') => {
  let config;
  
  switch (type) {
    case 'job-assignment':
      config = getJobAssignmentStatusConfig(status);
      break;
    case 'payment':
      config = getPaymentStatusConfig(status, moveType);
      break;
    default:
      config = getBookingStatusConfig(status, moveType);
  }

  return {
    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`,
    text: config.text,
    description: config.description
  };
};
