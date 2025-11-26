import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiCalendar, FiMapPin, FiUser, FiTruck, FiStar, FiPhone, FiMail, 
  FiMessageSquare, FiDollarSign, FiClock, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiSend, FiHome, FiShield, FiThumbsUp
} from 'react-icons/fi';
import { bookingsService, reviewsService, serviceUtils } from '../services';
import { getBookingStatusConfig, getStatusBadge } from '../utils/statusUtils';
import { formatMoverRating } from '../utils/ratingUtils';

const GuestBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: '',
    detailedRating: {
      punctuality: 5,
      professionalism: 5,
      care: 5,
      communication: 5,
      value: 5
    },
    categories: []
  });
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingsService.getGuestBooking(id);
      console.log("booking details", response);
      setBooking(response.data.data.booking);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerEmail.trim()) {
      setReviewError('Please enter your email address');
      return;
    }

    if (reviewData.comment.length < 10) {
      setReviewError('Please write at least 10 characters for your review');
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError('');
      
      await reviewsService.createGuestReview({
        bookingId: id,
        customerName: booking.customerInfo.firstName + ' ' + booking.customerInfo.lastName,
        customerEmail: customerEmail,
        ...reviewData
      });
      
      // Reload booking to show updated status
      await loadBookingDetails();
      setShowReviewForm(false);
      setReviewData({
        rating: 5,
        title: '',
        comment: '',
        detailedRating: {
          punctuality: 5,
          professionalism: 5,
          care: 5,
          communication: 5,
          value: 5
        },
        categories: []
      });
      setCustomerEmail('');
    } catch (err) {
      setReviewError(serviceUtils.formatError(err));
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    return getBookingStatusConfig(status, booking?.moveType);
  };

  const canLeaveReview = booking?.status === 'completed' && !booking?.customerReviewed;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">Error: {error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiTruck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Booking Details</h1>
                <p className="text-sm text-gray-500">Booking #{id.slice(-8)}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Booking Status</h2>
              <p className="text-sm text-gray-600 mt-1">Current status of your move</p>
            </div>
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(booking?.status).color}`}>
               {getStatusInfo(booking?.status).text}
             </span>
          </div>
        </div>

        {/* Booking Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Move Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="h-5 w-5 mr-2" />
              Move Details
            </h3>
            <div className="space-y-4">
               <div className="flex items-start space-x-3">
                 <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-gray-900">From</p>
                   <p className="text-sm text-gray-600">
                     {booking?.pickupAddress ? 
                       `${booking.pickupAddress.street || ''}, ${booking.pickupAddress.city || ''}, ${booking.pickupAddress.state || ''} ${booking.pickupAddress.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') || 'N/A' : 
                       'N/A'
                     }
                   </p>
                 </div>
               </div>
               <div className="flex items-start space-x-3">
                 <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-gray-900">To</p>
                   <p className="text-sm text-gray-600">
                     {booking?.dropoffAddress ? 
                       `${booking.dropoffAddress.street || ''}, ${booking.dropoffAddress.city || ''}, ${booking.dropoffAddress.state || ''} ${booking.dropoffAddress.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') || 'N/A' : 
                       'N/A'
                     }
                   </p>
                 </div>
               </div>
               <div className="flex items-start space-x-3">
                 <FiClock className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-gray-900">Move Date & Time</p>
                   <p className="text-sm text-gray-600">
                     {booking?.moveDate ? new Date(booking.moveDate).toLocaleDateString('en-US', {
                       weekday: 'long',
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     }) : 'N/A'}
                     {booking?.moveTime && ` at ${booking.moveTime}`}
                   </p>
                 </div>
               </div>
               <div className="flex items-start space-x-3">
                 <FiHome className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-gray-900">Home Size</p>
                   <p className="text-sm text-gray-600">{booking?.homeSize || 'N/A'}</p>
                 </div>
               </div>
               <div className="flex items-start space-x-3">
                 <FiClock className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-gray-900">Estimated Duration</p>
                   <p className="text-sm text-gray-600">{booking?.estimatedDuration ? `${booking.estimatedDuration} hours` : 'N/A'}</p>
                 </div>
               </div>
               <div className="flex items-start space-x-3">
                 <FiTruck className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-medium text-gray-900">Move Type</p>
                   <p className="text-sm text-gray-600 capitalize">{booking?.moveType || 'N/A'}</p>
                 </div>
               </div>
               {booking?.servicesRequested && booking.servicesRequested.length > 0 && (
                 <div className="flex items-start space-x-3">
                   <FiShield className="h-5 w-5 text-gray-400 mt-0.5" />
                   <div>
                     <p className="font-medium text-gray-900">Services Requested</p>
                     <p className="text-sm text-gray-600 capitalize">{booking.servicesRequested.join(', ')}</p>
                   </div>
                 </div>
               )}
               {booking?.specialInstructions && (
                 <div className="flex items-start space-x-3">
                   <FiMessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                   <div>
                     <p className="font-medium text-gray-900">Special Instructions</p>
                     <p className="text-sm text-gray-600">{booking.specialInstructions}</p>
                   </div>
                 </div>
               )}
               {booking?.items && booking.items.length > 0 && (
                 <div className="flex items-start space-x-3">
                   <FiHome className="h-5 w-5 text-gray-400 mt-0.5" />
                   <div>
                     <p className="font-medium text-gray-900">Items to Move</p>
                     <div className="text-sm text-gray-600">
                       {booking.items.map((item, index) => (
                         <div key={index} className="flex justify-between">
                           <span>{item.name}</span>
                           <span className="text-gray-500">({item.quantity})</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              Payment Information
            </h3>
            <div className="space-y-4">
              {booking?.quote && booking.moveType !== 'long-distance' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold text-lg">${booking.quote.subtotal}</span>
                   
                  </div>
                  {booking.deposit.paid && (
                     <div className="flex justify-between">
                        <span className="text-gray-600">Deposit Paid</span>
                        <span className="font-semibold text-green-600">
                          ${(booking.deposit.amount / 100).toFixed(2)}
                        </span>
                    </div>
                  )}
                 
                </div>
              )}
              
              {booking?.moveType === 'long-distance' ? (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <FiDollarSign className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-800">No Payment Required</p>
                      <p className="text-blue-700 text-sm">
                        We'll contact you with a personalized quote for your long-distance move.
                      </p>
                    </div>
                  </div>
                </div>
              ) : booking?.deposit && booking.deposit.paid ? (
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                      <span className="text-gray-600">Payable Amount (after completion)</span>
                      <span className="font-semibold text-lg">${booking.quote.subtotal - (booking.deposit.amount / 100)}</span>
                  </div>
                 
                </div>
              ) : booking?.deposit && !booking.deposit.paid ? (
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit Required</span>
                    <span className="font-semibold text-orange-600">
                      ${(booking.deposit.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Payment will be required once you select a mover.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mover Information */}
        {booking?.mover && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTruck className="h-5 w-5 mr-2" />
              Your Moving Team
            </h3>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{booking.mover.businessName}</h4>
                <p className="text-sm text-gray-600 mb-2">{booking.mover.firstName} {booking.mover.lastName}</p>
                {(() => {
                  const ratingInfo = formatMoverRating(booking.mover.rating);
                  return ratingInfo.hasRating && (
                    <div className="flex items-center space-x-1 mb-2">
                      <FiStar className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{ratingInfo.value}</span>
                      <span className="text-sm text-gray-500">{ratingInfo.count}</span>
                    </div>
                  );
                })()}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FiMail className="h-4 w-4" />
                    <span>{booking.mover.email}</span>
                  </div>
                  {booking.mover.phone && (
                    <div className="flex items-center space-x-1">
                      <FiPhone className="h-4 w-4" />
                      <span>{booking.mover.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Section */}
        {canLeaveReview && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How was your move?</h3>
              <p className="text-gray-600">Help other customers by sharing your experience</p>
            </div>

            {!showReviewForm ? (
              <div className="text-center">
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Leave a Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                {/* Email Verification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the email address used for this booking"
                    required
                  />
                </div>

                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData({...reviewData, rating: star})}
                        className="text-2xl focus:outline-none"
                      >
                        <FiStar className={`h-8 w-8 ${star <= reviewData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Title
                  </label>
                  <input
                    type="text"
                    value={reviewData.title}
                    onChange={(e) => setReviewData({...reviewData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Summarize your experience"
                    maxLength={100}
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about your moving experience..."
                    minLength={10}
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reviewData.comment.length}/1000 characters (minimum 10)
                  </p>
                </div>

                {/* Detailed Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Detailed Ratings
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: 'punctuality', label: 'Punctuality' },
                      { key: 'professionalism', label: 'Professionalism' },
                      { key: 'care', label: 'Care of Belongings' },
                      { key: 'communication', label: 'Communication' },
                      { key: 'value', label: 'Value for Money' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewData({
                                ...reviewData,
                                detailedRating: {
                                  ...reviewData.detailedRating,
                                  [key]: star
                                }
                              })}
                              className="text-lg focus:outline-none"
                            >
                              <FiStar className={`h-5 w-5 ${star <= reviewData.detailedRating[key] ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {reviewError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{reviewError}</p>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {reviewLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FiThumbsUp className="h-4 w-4" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Already Reviewed */}
        {booking?.customerReviewed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <FiCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-900 mb-1">Thank you for your review!</h3>
            <p className="text-green-700">Your feedback helps us improve our service.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestBookingDetails;
