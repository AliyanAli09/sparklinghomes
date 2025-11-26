// Utility functions for handling mover ratings consistently

/**
 * Formats a mover rating for display
 * @param {number|object} rating - The rating (can be a number or object with average/count)
 * @param {object} options - Display options
 * @param {number} options.decimals - Number of decimal places (default: 1)
 * @param {boolean} options.showCount - Whether to show review count (default: true)
 * @returns {object} - { value: string, count: string, hasRating: boolean }
 */
export const formatMoverRating = (rating, options = {}) => {
  const { decimals = 1, showCount = true } = options;
  
  if (!rating) {
    return {
      value: 'N/A',
      count: showCount ? '(no reviews)' : '',
      hasRating: false
    };
  }
  
  // Handle number rating (legacy format)
  if (typeof rating === 'number') {
    return {
      value: rating.toFixed(decimals),
      count: showCount ? '(based on reviews)' : '',
      hasRating: true
    };
  }
  
  // Handle object rating (current format)
  if (typeof rating === 'object' && rating !== null) {
    const average = rating.average || 0;
    const count = rating.count || 0;
    
    return {
      value: average > 0 ? average.toFixed(decimals) : 'N/A',
      count: showCount ? `(${count} review${count !== 1 ? 's' : ''})` : '',
      hasRating: average > 0
    };
  }
  
  return {
    value: 'N/A',
    count: showCount ? '(no reviews)' : '',
    hasRating: false
  };
};

/**
 * Gets the rating value as a number for calculations
 * @param {number|object} rating - The rating
 * @returns {number} - The numeric rating value
 */
export const getRatingValue = (rating) => {
  if (typeof rating === 'number') {
    return rating;
  }
  
  if (typeof rating === 'object' && rating !== null) {
    return rating.average || 0;
  }
  
  return 0;
};

/**
 * Gets the review count
 * @param {number|object} rating - The rating
 * @returns {number} - The review count
 */
export const getReviewCount = (rating) => {
  if (typeof rating === 'object' && rating !== null) {
    return rating.count || 0;
  }
  
  return 0;
};
