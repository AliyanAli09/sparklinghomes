import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiCalendar, FiMapPin, FiUser, FiTruck, FiStar, FiPhone, FiMail, 
  FiMessageSquare, FiDollarSign, FiClock, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiSend
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, serviceUtils } from '../services';
import { getBookingStatusConfig } from '../utils/statusUtils';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookingDetails();
    loadMessages();
  }, [id]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingsService.getBooking(id);
      setBooking(response.data.booking);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await bookingsService.getBookingMessages(id);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await bookingsService.addMessage(id, newMessage);
      setNewMessage('');
      loadMessages(); // Reload messages
    } catch (err) {
      setError(serviceUtils.formatError(err));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAction = async (action, data = {}) => {
    try {
      setActionLoading(true);
      setError('');

      switch (action) {
        case 'accept-quote':
          await bookingsService.acceptQuote(id);
          break;
        case 'cancel':
          await bookingsService.cancelBooking(id, data.reason);
          break;
        case 'complete':
          await bookingsService.completeBooking(id, data);
          break;
        default:
          break;
      }

      loadBookingDetails(); // Reload booking details
    } catch (err) {
      setError(serviceUtils.formatError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    return getBookingStatusConfig(status);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'quote-accepted':
        return <FiCheckCircle className="h-4 w-4" />;
      case 'quote-requested':
      case 'quote-provided':
        return <FiMessageSquare className="h-4 w-4" />;
      case 'completed':
        return <FiClock className="h-4 w-4" />;
      case 'cancelled':
        return <FiXCircle className="h-4 w-4" />;
      case 'in-progress':
        return <FiTruck className="h-4 w-4" />;
      default:
        return <FiCalendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Booking Not Found</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canAcceptQuote = booking?.status === 'quote-provided' && userType === 'customer';
  const canCancel = ['quote-requested', 'quote-provided', 'quote-accepted', 'confirmed'].includes(booking?.status);
  const canComplete = booking?.status === 'confirmed' && userType === 'mover';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Booking Details
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Booking ID: <span className="font-mono text-primary-600">{booking?._id}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(booking?.status)}`}>
                {getStatusIcon(booking?.status)}
                <span className="ml-2">
                  {booking?.status?.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-4 py-2 text-primary-600 hover:text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
              >
                ← Back to Dashboard
              </Link>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Move Details */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3">
                  <FiCalendar className="h-5 w-5 text-white" />
                </div>
                Move Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date & Time</p>
                  <p className="text-lg font-medium text-gray-900">
                    {serviceUtils.formatDate(booking?.moveDate)} at {booking?.moveTime}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Duration</p>
                  <p className="text-lg font-medium text-gray-900">{booking?.estimatedDuration} hours (estimated)</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Move Type</p>
                  <p className="text-lg font-medium text-gray-900 capitalize">{booking?.moveType}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Home Size</p>
                  <p className="text-lg font-medium text-gray-900">{booking?.homeSize}</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-3">
                  <FiMapPin className="h-5 w-5 text-white" />
                </div>
                Addresses
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    Pickup Location
                  </h3>
                  <div className="bg-gray-50/50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
                    <p className="font-medium">{booking?.pickupAddress?.street}</p>
                    <p>{booking?.pickupAddress?.city}, {booking?.pickupAddress?.state} {booking?.pickupAddress?.zipCode}</p>
                    {booking?.pickupAddress?.floor && <p className="text-gray-600">Floor: {booking.pickupAddress.floor}</p>}
                    {booking?.pickupAddress?.elevator && <p className="text-green-600 font-medium">✓ Elevator available</p>}
                    {booking?.pickupAddress?.stairs > 0 && <p className="text-orange-600 font-medium">⚠ {booking.pickupAddress.stairs} stairs</p>}
                    {booking?.pickupAddress?.notes && <p className="italic text-gray-600 bg-white/50 p-2 rounded-lg">{booking.pickupAddress.notes}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Dropoff Location
                  </h3>
                  <div className="bg-gray-50/50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
                    <p className="font-medium">{booking?.dropoffAddress?.street}</p>
                    <p>{booking?.dropoffAddress?.city}, {booking?.dropoffAddress?.state} {booking?.dropoffAddress?.zipCode}</p>
                    {booking?.dropoffAddress?.floor && <p className="text-gray-600">Floor: {booking.dropoffAddress.floor}</p>}
                    {booking?.dropoffAddress?.elevator && <p className="text-green-600 font-medium">✓ Elevator available</p>}
                    {booking?.dropoffAddress?.stairs > 0 && <p className="text-orange-600 font-medium">⚠ {booking.dropoffAddress.stairs} stairs</p>}
                    {booking?.dropoffAddress?.notes && <p className="italic text-gray-600 bg-white/50 p-2 rounded-lg">{booking.dropoffAddress.notes}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Services & Items */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mr-3">
                  <FiTruck className="h-5 w-5 text-white" />
                </div>
                Services & Items
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Requested</h3>
                  <div className="flex flex-wrap gap-2">
                    {booking?.servicesRequested?.map((service, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 rounded-full text-sm font-medium border border-primary-200"
                      >
                        {service.replace('-', ' ')}
                      </span>
                    ))}
                    {booking?.packingRequired && (
                      <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-sm font-medium border border-green-200">
                        Professional Packing
                      </span>
                    )}
                  </div>
                </div>

                {booking?.items && booking.items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Items to Move</h3>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/70">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Weight</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/50">
                          {booking.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-gray-900 font-medium">{item.name}</td>
                              <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-3 text-gray-600">{item.weight} lbs</td>
                              <td className="px-4 py-3 text-gray-600">
                                <div className="flex gap-2">
                                  {item.fragile && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Fragile</span>}
                                  {item.heavy && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Heavy</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {booking?.specialInstructions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h3>
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                      <p className="text-gray-700 text-sm leading-relaxed">{booking.specialInstructions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Details */}
            {booking?.quote && (
              <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg mr-3">
                    <FiDollarSign className="h-5 w-5 text-white" />
                  </div>
                  Quote Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Labor Cost ({booking.quote.estimatedHours} hours @ ${booking.quote.hourlyRate}/hr)</span>
                    <span className="font-medium">${booking.quote.laborCost}</span>
                  </div>
                  {booking.quote.travelFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Travel Fee</span>
                      <span className="font-medium">${booking.quote.travelFee}</span>
                    </div>
                  )}
                  {booking.quote.packingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Packing Fee</span>
                      <span className="font-medium">${booking.quote.packingFee}</span>
                    </div>
                  )}
                  {booking.quote.additionalFees?.map((fee, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{fee.description}</span>
                      <span className="font-medium">${fee.amount}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${booking.quote.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${booking.quote.tax?.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">${booking.quote.total?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quote Actions */}
                {canAcceptQuote && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAction('accept-quote')}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        <FiCheckCircle className="mr-2" />
                        Accept Quote
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for declining:');
                          if (reason) handleAction('cancel', { reason });
                        }}
                        disabled={actionLoading}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg mr-3">
                  <FiMessageSquare className="h-5 w-5 text-white" />
                </div>
                Messages
              </h2>
              
              <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.senderType === userType ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === userType
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === userType ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {serviceUtils.formatDateTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {userType === 'customer' ? 'Your Mover' : 'Customer'}
              </h3>
              
              {userType === 'customer' ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FiTruck className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking?.mover?.businessName}</p>
                      <p className="text-sm text-gray-600">
                        {booking?.mover?.firstName} {booking?.mover?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiPhone className="mr-2 h-4 w-4" />
                      {serviceUtils.formatPhoneNumber(booking?.mover?.phone)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMail className="mr-2 h-4 w-4" />
                      {booking?.mover?.email}
                    </div>
                    {booking?.mover?.rating && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FiStar className="mr-2 h-4 w-4 text-yellow-400" />
                        {booking.mover.rating.average} ({booking.mover.rating.count} reviews)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiUser className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking?.customer?.firstName} {booking?.customer?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">Customer</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiPhone className="mr-2 h-4 w-4" />
                      {serviceUtils.formatPhoneNumber(booking?.customer?.phone)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMail className="mr-2 h-4 w-4" />
                      {booking?.customer?.email}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {canComplete && (
                  <button
                    onClick={() => {
                      const actualDuration = prompt('Actual duration (hours):', booking.estimatedDuration);
                      const finalCost = prompt('Final cost:', booking.quote?.total);
                      if (actualDuration && finalCost) {
                        handleAction('complete', {
                          actualDuration: parseFloat(actualDuration),
                          finalCost: parseFloat(finalCost)
                        });
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <FiCheckCircle className="mr-2" />
                    Mark as Complete
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for cancellation:');
                      if (reason) handleAction('cancel', { reason });
                    }}
                    disabled={actionLoading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <FiXCircle className="mr-2" />
                    Cancel Booking
                  </button>
                )}

                <Link
                  to={`/bookings/${id}/edit`}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-center block"
                >
                  Edit Booking
                </Link>
              </div>
            </div>

            {/* Booking Timeline */}
            <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <FiClock className="mr-2 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Booking Created</p>
                    <p className="text-gray-600">{serviceUtils.formatDateTime(booking?.createdAt)}</p>
                  </div>
                </div>
                
                {booking?.quote && (
                  <div className="flex items-center">
                    <FiDollarSign className="mr-2 h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Quote Provided</p>
                      <p className="text-gray-600">{serviceUtils.formatDateTime(booking?.updatedAt)}</p>
                    </div>
                  </div>
                )}

                {booking?.status === 'completed' && (
                  <div className="flex items-center">
                    <FiCheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Move Completed</p>
                      <p className="text-gray-600">{serviceUtils.formatDateTime(booking?.actualEndTime)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

