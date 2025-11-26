import { useState, useEffect } from 'react';
import { FiSearch, FiEye,  FiTrash, FiCalendar, FiAlertCircle, FiUser, FiTruck, FiMapPin, FiDollarSign, FiClock, FiPackage, FiCheckCircle, FiXCircle, FiCreditCard, FiMessageSquare, FiEdit, FiSave, FiX } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { adminService, serviceUtils, getApiUrl } from '../services';
import { getBookingStatusConfig, getStatusBadge } from '../utils/statusUtils';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [verifiedMovers, setVerifiedMovers] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchVerifiedMovers();
  }, [currentPage, filterStatus, searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const params = {
        page: currentPage,
        limit: 20
      };
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await adminService.getAllBookings(params);
      setBookings(response.data.bookings);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedMovers = async () => {
    try {
      const response = await adminService.getVerifiedMovers();
      setVerifiedMovers(response.data);
    } catch (err) {
      console.error('Failed to fetch verified movers:', err);
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking({
      ...booking,
      moveDate: booking.moveDate ? new Date(booking.moveDate).toISOString().split('T')[0] : '',
      moveTime: booking.moveTime || '',
      moverId: booking.mover?._id || '',
      status: booking.status || '',
      adminNotes: booking.adminNotes || ''
    });
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    // Check if assigning a new mover
    const isAssigningMover = editingBooking.moverId && editingBooking.moverId !== editingBooking.mover?._id;
    
    if (isAssigningMover) {
      const selectedMover = verifiedMovers.find(m => m._id === editingBooking.moverId);
      setConfirmAction({
        type: 'assign_mover',
        message: `Are you sure you want to assign ${selectedMover?.businessName} to this booking? This will send email notifications to both the customer and cleaner.`,
        onConfirm: () => performUpdate()
      });
      setShowConfirmDialog(true);
    } else {
      performUpdate();
    }
  };
  const handleDeleteBooking = async (bookingId) => {
    try {
      console.log("here");
      setDeletingBooking(true);
      const response = await fetch(getApiUrl(`/admin/bookings/${bookingId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete booking');
      fetchBookings();
      setDeletingBooking(false);
    } catch (err) {
      setError(err.message);
      console.log("error", err);
    } finally {
      setDeletingBooking(false);
      setShowDeleteModal(false);
    }
  };

  const performUpdate = async () => {
    if (!editingBooking) return;

    try {
      setUpdating(true);
      setError('');
      setSuccess('');

      const updateData = {
        moveDate: editingBooking.moveDate,
        moveTime: editingBooking.moveTime,
        status: editingBooking.status,
        adminNotes: editingBooking.adminNotes
      };

      // Only include moverId if it's different from current
      if (editingBooking.moverId && editingBooking.moverId !== editingBooking.mover?._id) {
        updateData.moverId = editingBooking.moverId;
      }

      await adminService.updateBooking(editingBooking._id, updateData);
      
      setEditingBooking(null);
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setSuccess('Booking updated successfully!');
      fetchBookings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to update booking:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
  };

  const getStatusBadgeComponent = (status) => {
    const badge = getStatusBadge(status, 'booking');
    return (
      <span className={badge.className}>
        {badge.text}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDepositAmount = (depositAmount) => {
    // Handle both old format (might be stored as dollars) and new format (cents)
    if (!depositAmount) return '$0.00';
    
    // If amount is less than 1000, assume it's already in dollars
    // If amount is 1000 or more, assume it's in cents and convert
    const amount = depositAmount < 1000 ? depositAmount : depositAmount / 100;
    return formatCurrency(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Booking Management" 
      subtitle="Monitor all platform bookings"
    >
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <FiCheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <FiAlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search bookings by customer or cleaner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending-assignment">Looking for cleaners</option>
                <option value="quote-requested">Quote requested</option>
                <option value="quote-provided">Quote provided</option>
                <option value="quote-accepted">Quote accepted</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Bookings ({bookings.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiCalendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            #{booking._id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.moveDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.customer?.firstName || booking.customerInfo?.firstName} {booking.customer?.lastName || booking.customerInfo?.lastName}
                            {booking.customerInfo?.isGuest && <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">Guest</span>}
                          </div>
                          <div className="text-sm text-gray-500">{booking.customer?.email || booking.customerInfo?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <FiTruck className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.mover?.businessName || 'Unassigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.mover?.email || 'No cleaner assigned'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking?.moveType?.toUpperCase()}
                     {/*  {getStatusBadgeComponent(booking.status, 'booking', booking.moveType)} */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.moveType === 'long-distance' ? (
                          <div className="flex items-center">
                            <FiMessageSquare className="h-4 w-4 text-blue-400 mr-1" />
                            <span className="font-medium text-blue-600">Quote in progress</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <FiDollarSign className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="font-medium">{formatDepositAmount(booking.deposit?.amount || 0)}</span>
                              <span className="ml-1 text-xs text-gray-500">deposit</span>
                            </div>
                            <div className="flex items-center mt-1">
                              {booking.deposit?.paid ? (
                                <FiCheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              ) : (
                                <FiXCircle className="h-3 w-3 text-red-500 mr-1" />
                              )}
                              <span className={`text-xs ${booking.deposit?.paid ? 'text-green-600' : 'text-red-600'}`}>
                                {booking.deposit?.paid ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewBooking(booking)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="View details"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEditBooking(booking)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Edit booking"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => { setShowDeleteModal(true); setSelectedBooking(booking); }}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete booking"
                      >
                        <FiTrash className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Booking Details Modal */}
        <AdminModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          title={`Booking Details - #${selectedBooking?._id?.slice(-8)}`}
          size="2xl"
          showActions={false}
        >
          {selectedBooking && (
            <div className="max-h-[80vh] overflow-y-auto space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiCalendar className="h-5 w-5 text-blue-600 mr-2" />
                    Booking Information
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Booking ID</p>
                      <p className="text-sm text-gray-900">#{selectedBooking._id.slice(-8)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Move Date</p>
                      <p className="text-sm text-gray-900 flex items-center">
                        <FiClock className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(selectedBooking.moveDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <div className="mt-1">{getStatusBadgeComponent(selectedBooking.status)}</div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment Status</p>
                      <p className="text-sm text-gray-900 capitalize">{selectedBooking.paymentStatus || 'pending'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Job Assignment</p>
                      <div className="mt-1">
                        {(() => {
                          const jobBadge = getStatusBadge(selectedBooking.jobAssignment?.status || 'unassigned', 'job-assignment');
                          return (
                            <span className={jobBadge.className}>
                              {jobBadge.text}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiCreditCard className="h-5 w-5 text-green-600 mr-2" />
                    Payment Information
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedBooking.moveType === 'long-distance' ? (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <FiMessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">Long-Distance Move Request</p>
                              <p className="text-xs text-blue-600">Customer waiting for quote details</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Action Required</p>
                            <p className="text-sm text-gray-900">Contact customer with quote details</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Status</p>
                            <div className="flex items-center">
                              <FiMessageSquare className="h-4 w-4 text-blue-500 mr-1" />
                              <span className="text-sm text-blue-600">Quote in progress</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Deposit Amount</p>
                          <p className="text-sm text-gray-900 flex items-center">
                            <FiDollarSign className="h-4 w-4 text-gray-400 mr-1" />
                            {formatDepositAmount(selectedBooking.deposit?.amount || 0)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Deposit Status</p>
                          <div className="flex items-center">
                            {selectedBooking.deposit?.paid ? (
                              <>
                                <FiCheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm text-green-600">Paid</span>
                              </>
                            ) : (
                              <>
                                <FiXCircle className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-sm text-red-600">Pending</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedBooking.deposit?.paidAt && selectedBooking.moveType !== 'long-distance' && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Paid At</p>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedBooking.deposit.paidAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    
                    {selectedBooking.paymentIntentId && selectedBooking.moveType !== 'long-distance' && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Payment Intent ID</p>
                        <p className="text-sm text-gray-900 font-mono text-xs">
                          {selectedBooking.paymentIntentId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiPackage className="h-5 w-5 text-green-600 mr-2" />
                    Services
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedBooking.servicesRequested && selectedBooking.servicesRequested.length > 0 ? (
                      selectedBooking.servicesRequested.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {service.replace(/-/g, ' ').replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No specific services selected</p>
                    )}
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Home Size</p>
                        <p className="text-sm text-gray-900 capitalize">{selectedBooking.homeSize?.replace('-', ' ')}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Move Type</p>
                        <p className="text-sm text-gray-900 capitalize">{selectedBooking.moveType}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Estimated Duration</p>
                        <p className="text-sm text-gray-900">{selectedBooking.estimatedDuration} hours</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Move Time</p>
                        <p className="text-sm text-gray-900">{selectedBooking.moveTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Information */}
              {selectedBooking.quote ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiDollarSign className="h-5 w-5 text-green-600 mr-2" />
                    Quote Details
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    
                    {/* Additional Fees */}
                    {selectedBooking.quote.additionalFees && selectedBooking.quote.additionalFees.length > 0 && (
                      <div className="mt-6">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Additional Fees</h5>
                        <div className="space-y-2">
                          {selectedBooking.quote.additionalFees.map((fee, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-sm text-gray-700">{fee.description}</span>
                              <span className="text-sm font-medium text-gray-900">${fee.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quote Summary */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Subtotal</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ${selectedBooking.quote.subtotal || 'N/A'}
                          </p>
                        </div>
                        
                       
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiDollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    Quote Details
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No Quote Available</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {selectedBooking.moveType === 'long-distance'
                        ? 'Long-distance moves require manual quote processing'
                        : 'This booking is waiting for a cleaner to provide a quote'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiUser className="h-5 w-5 text-green-600 mr-2" />
                  Customer Information
                </h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Full Name</p>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.customer?.firstName || selectedBooking.customerInfo?.firstName} {selectedBooking.customer?.lastName || selectedBooking.customerInfo?.lastName}
                        {selectedBooking.customerInfo?.isGuest && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Guest User
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-900">{selectedBooking.customer?.email || selectedBooking.customerInfo?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-sm text-gray-900">{selectedBooking.customer?.phone || selectedBooking.customerInfo?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cleaner Information */}
              {selectedBooking.mover && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiTruck className="h-5 w-5 text-purple-600 mr-2" />
                    Cleaner Information
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Business Name</p>
                        <p className="text-sm text-gray-900">{selectedBooking.mover.businessName}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{selectedBooking.mover.email}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{selectedBooking.mover.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiMapPin className="h-5 w-5 text-red-600 mr-2" />
                  Address Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Pickup Address</h5>
                    <div className="space-y-2">
                      {selectedBooking.pickupAddress?.street && (
                        <p className="text-sm text-gray-700">{selectedBooking.pickupAddress.street}</p>
                      )}
                      <p className="text-sm text-gray-700">
                        {selectedBooking.pickupAddress?.city}, {selectedBooking.pickupAddress?.state} {selectedBooking.pickupAddress?.zipCode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Dropoff Address</h5>
                    <div className="space-y-2">
                      {selectedBooking.dropoffAddress?.street && (
                        <p className="text-sm text-gray-700">{selectedBooking.dropoffAddress.street}</p>
                      )}
                      <p className="text-sm text-gray-700">
                        {selectedBooking.dropoffAddress?.city}, {selectedBooking.dropoffAddress?.state} {selectedBooking.dropoffAddress?.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                {/* Edit removed - admins can only update status, not edit bookings */}
              </div>
            </div>
          )}
        </AdminModal>
        {/* Delete Booking Modal */}
        {showDeleteModal && (
          <AdminModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Booking"
            showActions={false}
          >
            <div className="space-y-4">
              <p className="text-gray-700">Are you sure you want to delete this booking {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}  ?</p>
              <p className="text-gray-700">Booking ID: {selectedBooking._id}</p>
              <p className="text-gray-700">Booking Date: {new Date(selectedBooking.moveDate).toLocaleDateString()}</p>
              <p className="text-gray-700">Booking Time: {selectedBooking.moveTime}</p>
              <p className="text-gray-700">Booking Status: {selectedBooking.status}</p>
              <p className="text-gray-700">Booking Amount: ${selectedBooking.quote?.subtotal || 'N/A'}</p>
              <p className="text-gray-700 font-medium">Booking Deposit: ${selectedBooking.deposit?.amount/100 || 'N/A'} (Paid: {selectedBooking.deposit?.paid ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>})</p>

              <p className="text-gray-700">This action cannot be undone and will permanently remove the booking and all associated data.</p>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                onClick={(e) => { console.log("clicked"), handleDeleteBooking(selectedBooking._id)}}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {deletingBooking ? 'Deleting...' : 'Delete Booking'}
              </button>
              </div>
              
            </div>
          </AdminModal>
        )}
        {/* Edit Booking Modal */}
        <AdminModal
          isOpen={!!editingBooking}
          onClose={handleCancelEdit}
          title={`Edit Booking - #${editingBooking?._id?.slice(-8)}`}
          size="lg"
          showActions={false}
        >
          {editingBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Move Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move Date
                  </label>
                  <input
                    type="date"
                    value={editingBooking.moveDate}
                    onChange={(e) => setEditingBooking({
                      ...editingBooking,
                      moveDate: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Move Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move Time
                  </label>
                  <input
                    type="time"
                    value={editingBooking.moveTime}
                    onChange={(e) => setEditingBooking({
                      ...editingBooking,
                      moveTime: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Cleaner Assignment */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Cleaner
                  </label>
                  <select
                    value={editingBooking.moverId}
                    onChange={(e) => setEditingBooking({
                      ...editingBooking,
                      moverId: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a cleaner (optional)</option>
                    {verifiedMovers.map((mover) => (
                      <option key={mover._id} value={mover._id}>
                        {mover.businessName} - {mover.firstName} {mover.lastName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only verified and approved cleaners are shown
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({
                      ...editingBooking,
                      status: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending-assignment">Looking for cleaners</option>
                    <option value="quote-requested">Quote requested</option>
                    <option value="quote-provided">Quote provided</option>
                    <option value="quote-accepted">Quote accepted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={editingBooking.adminNotes}
                    onChange={(e) => setEditingBooking({
                      ...editingBooking,
                      adminNotes: e.target.value
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any admin notes..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  disabled={updating}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                >
                  <FiX className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleUpdateBooking}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                >
                  {updating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <FiSave className="h-4 w-4" />
                  <span>{updating ? 'Updating...' : 'Update Booking'}</span>
                </button>
              </div>
            </div>
          )}
        </AdminModal>

        {/* Confirmation Dialog */}
        <AdminModal
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          title="Confirm Action"
          size="md"
          showActions={false}
        >
          <div className="space-y-4">
            <div className="flex items-center">
              <FiAlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
              <p className="text-gray-700">{confirmAction?.message}</p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={updating}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction?.onConfirm}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
              >
                {updating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{updating ? 'Processing...' : 'Confirm'}</span>
              </button>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
