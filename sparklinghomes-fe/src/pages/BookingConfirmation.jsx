import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FiCheckCircle, FiHome, FiMail, FiPhone, FiCalendar, FiMapPin, FiClock, FiArrowRight, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { bookingsService } from '../services';
import { getBookingStatusConfig } from '../utils/statusUtils';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if this is a fresh payment success (from URL params or localStorage flag)
        const urlParams = new URLSearchParams(location.search);
        const paymentSuccess = urlParams.get('payment_success') === 'true' || 
                              localStorage.getItem(`payment_success_${bookingId}`) === 'true';
        
        // Clear localStorage if this is a fresh payment to force backend fetch
        if (paymentSuccess) {
          localStorage.removeItem(`booking_confirmation_${bookingId}`);
          localStorage.removeItem(`payment_success_${bookingId}`);
        }

        // First, try to get from localStorage, but always refresh from backend for payment status
        const saved = localStorage.getItem(`booking_confirmation_${bookingId}`);
        if (saved && !paymentSuccess) {
          const parsedData = JSON.parse(saved);
          setBookingData(parsedData);
          // Don't return early - continue to fetch fresh data from backend
        }

        // Always fetch fresh data from backend to get updated payment status
        console.log('Fetching booking data from backend for ID:', bookingId);
        const response = await bookingsService.getGuestBooking(bookingId);
        
        if (response?.data?.data?.booking) {
          const booking = response.data.data.booking;
          console.log('Booking data:', booking);
          // Transform backend data to match the expected format
          const transformedData = {
            bookingId: booking._id,
            moveDate: booking.moveDate ? new Date(booking.moveDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Not specified',
            moveTime: booking.moveTime || 'Not specified',
            pickupAddress: booking.pickupAddress ? 
              `${booking.pickupAddress.street || ''}, ${booking.pickupAddress.city || ''}, ${booking.pickupAddress.state || ''} ${booking.pickupAddress.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Not specified',
            dropoffAddress: booking.dropoffAddress ? 
              `${booking.dropoffAddress.street || ''}, ${booking.dropoffAddress.city || ''}, ${booking.dropoffAddress.state || ''} ${booking.dropoffAddress.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Not specified',
            homeSize: booking.homeSize || 'Not specified',
            customerEmail: booking.customerInfo?.email || 'Not specified',
            customerPhone: booking.customerInfo?.phone || 'Not specified',
            depositAmount: booking.deposit?.amount || 0,
            depositPaid: booking.deposit?.paid || false,
            moveType: booking.moveType || 'residential'
          };

          setBookingData(transformedData);
          
          // Save to localStorage for future visits
          localStorage.setItem(`booking_confirmation_${bookingId}`, JSON.stringify(transformedData));
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingData();
    }
  }, [bookingId, location.search]);

  // Add a function to refresh booking data (useful after payment)
  const refreshBookingData = async () => {
    if (bookingId) {
      try {
        setLoading(true);
        setError(null);
        
        // Clear localStorage to force fresh fetch
        localStorage.removeItem(`booking_confirmation_${bookingId}`);
        
        console.log('Refreshing booking data from backend for ID:', bookingId);
        const response = await bookingsService.getGuestBooking(bookingId);
        
        if (response?.data?.data?.booking) {
          const booking = response.data.data.booking;
          console.log('Refreshed booking data:', booking);
          
          const transformedData = {
            bookingId: booking._id,
            moveDate: booking.moveDate ? new Date(booking.moveDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Not specified',
            moveTime: booking.moveTime || 'Not specified',
            pickupAddress: booking.pickupAddress ? 
              `${booking.pickupAddress.street || ''}, ${booking.pickupAddress.city || ''}, ${booking.pickupAddress.state || ''} ${booking.pickupAddress.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Not specified',
            dropoffAddress: booking.dropoffAddress ? 
              `${booking.dropoffAddress.street || ''}, ${booking.dropoffAddress.city || ''}, ${booking.dropoffAddress.state || ''} ${booking.dropoffAddress.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '') : 'Not specified',
            homeSize: booking.homeSize || 'Not specified',
            customerEmail: booking.customerInfo?.email || 'Not specified',
            customerPhone: booking.customerInfo?.phone || 'Not specified',
            depositAmount: booking.deposit?.amount || 0,
            depositPaid: booking.deposit?.paid || false,
            moveType: booking.moveType || 'residential'
          };

          setBookingData(transformedData);
          
          // Save updated data to localStorage
          localStorage.setItem(`booking_confirmation_${bookingId}`, JSON.stringify(transformedData));
        }
      } catch (err) {
        console.error('Error refreshing booking data:', err);
        setError('Failed to refresh booking details');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Clean up localStorage after 24 hours or when component unmounts
    const timer = setTimeout(() => {
      localStorage.removeItem(`booking_confirmation_${bookingId}`);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearTimeout(timer);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <FiLoader className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Booking Details</h2>
            <p className="text-gray-600">
              Please wait while we fetch your booking information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiHome className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Booking Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error === 'Booking not found' 
                ? 'We couldn\'t find the confirmation details for this booking.'
                : 'There was an error loading your booking details. Please try again later.'
              }
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <FiCheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {bookingData.depositPaid ? 'Payment Confirmed!' : 'Request Submitted!'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            {bookingData.depositPaid
              ? 'Thank you for your booking! Your payment has been processed successfully and professional cleaners in your area are being notified.'
              : bookingData.moveType === 'long-distance'
                ? 'Thank you for your cleaning request! Our team will review your request and contact you within 24 hours with a personalized quote.'
                : 'Thank you for your booking request! Professional cleaners in your area are being notified and will contact you soon.'
            }
          </p>
          
          {/* Refresh button for users who just made a payment */}
          {!bookingData.depositPaid && bookingData.moveType !== 'long-distance' && (
            <div className="mt-4">
              <button
                onClick={refreshBookingData}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Just Paid? Click to Refresh Status</span>
              </button>
            </div>
          )}
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-lg font-semibold">Booking Confirmation</h2>
                <p className="text-green-100">ID: #{bookingData.bookingId}</p>
              </div>
              <FiHome className="h-8 w-8 text-green-200" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cleaning Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cleaning Details</h3>

                <div className="flex items-start space-x-3">
                  <FiCalendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Service Date & Time</p>
                    <p className="text-gray-600">{bookingData.moveDate} at {bookingData.moveTime}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Service Address</p>
                    <p className="text-gray-600">{bookingData.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FiHome className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Property Size</p>
                    <p className="text-gray-600">{bookingData.homeSize?.replace('-', ' ')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FiCheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Service Type</p>
                    <p className="text-gray-600">{bookingData.moveType?.replace('-', ' ') || 'Standard Cleaning'}</p>
                  </div>
                </div>
              </div>

              {/* Contact & Payment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Payment</h3>
                
                <div className="flex items-start space-x-3">
                  <FiMail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">{bookingData.customerEmail}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FiPhone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">{bookingData.customerPhone}</p>
                  </div>
                </div>

                {bookingData.depositPaid ? (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiCheckCircle className="h-5 w-5 text-green-600" />
                      <p className="font-semibold text-green-800">Payment Confirmed</p>
                    </div>
                    <p className="text-green-700 text-sm">
                      Deposit: ${(bookingData.depositAmount / 100).toFixed(2)} paid successfully
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FiCheckCircle className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold text-blue-800">
                          {bookingData.moveType === 'long-distance' ? 'Request Submitted' : 'Payment Pending'}
                        </p>
                      </div>
                      {bookingData.moveType !== 'long-distance' && (
                        <button
                          onClick={refreshBookingData}
                          disabled={loading}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-md transition-colors"
                        >
                          <FiRefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                          <span>Refresh</span>
                        </button>
                      )}
                    </div>
                    <p className="text-blue-700 text-sm">
                      {bookingData.moveType === 'long-distance' 
                        ? 'No payment required. We\'ll contact you with a personalized quote.'
                        : 'If you just made a payment, click "Refresh" above to update your status.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FiClock className="h-6 w-6 text-blue-600 mr-3" />
            What Happens Next?
          </h3>
          
          <div className="space-y-4">
            {bookingData.depositPaid ? (
              // Regular booking flow
              <>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Cleaners Are Notified</h4>
                    <p className="text-gray-600">Professional cleaning companies in your area are being contacted about your job.</p>
                  </div>
                </div>



                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Finalize Details</h4>
                    <p className="text-gray-600">Work directly with your chosen cleaner to confirm all details and schedule your cleaning service.</p>
                  </div>
                </div>
              </>
            ) : bookingData.moveType === 'long-distance' ? (
              // Long-distance booking flow
              <>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Request Under Review</h4>
                    <p className="text-gray-600">Our team is reviewing your cleaning request and gathering specialized cleaners.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized Quote</h4>
                    <p className="text-gray-600">You'll receive a detailed quote via email within 24 hours with pricing and timeline information.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Review & Approve</h4>
                    <p className="text-gray-600">Review the quote details and approve if it meets your needs and budget.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Service Coordination</h4>
                    <p className="text-gray-600">Our team will coordinate with specialized cleaners to finalize your service details.</p>
                  </div>
                </div>
              </>
            ) : (
              // Regular booking without payment flow
              <>
                <div className="flex items-start space-x-4">

                  <div>
                    <h4 className="font-semibold text-gray-900">Waiting for Payment Confirmation</h4>
                    <p className="text-gray-600">Please wait for your payment to be confirmed before the cleaners are notified.</p>
                  </div>
                </div>


              </>
            )}
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <FiMail className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Check Your Email</h3>
              <p className="text-blue-800">
                We've sent a detailed confirmation email to <strong>{bookingData.customerEmail}</strong> with all your booking information and next steps.
              </p>
              <p className="text-blue-700 text-sm mt-2">
                Don't see it? Check your spam folder or contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Support & Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to assist you with any questions about your cleaning service.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:marcusbrndn@yahoo.com"
                className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FiMail className="h-4 w-4" />
                <span>marcusbrndn@yahoo.com</span>
              </a>


            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Planning Your Cleaning?</h3>
            <p className="text-gray-600 mb-6">
              Get tips and resources to make your cleaning day smooth and stress-free.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <span>Back to Home</span>
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
