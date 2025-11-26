import { useState, useEffect } from 'react';
import { FiHome, FiMapPin, FiCalendar, FiClock, FiDollarSign, FiMessageSquare, FiCheck, FiX, FiArrowLeft, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobDistributionService, serviceUtils } from '../services';
import { getBookingStatusConfig } from '../utils/statusUtils';

const MoverJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobAlerts, setJobAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState('');
  const [responseData, setResponseData] = useState({
    interested: false,
    message: '',
    estimatedTime: ''
  });
  const [completionLoading, setCompletionLoading] = useState(false);

  useEffect(() => {
    loadJobAlerts();
  }, []);

  const loadJobAlerts = async () => {
    try {
      setLoading(true);
      console.log('Loading job alerts...');
      console.log('User:', user);
      console.log('Auth token:', localStorage.getItem('authToken'));
      
      const response = await jobDistributionService.getJobAlerts();
      console.log('Job alerts response:', response);
      setJobAlerts(response.data?.jobAlerts || []);
    } catch (err) {
      console.error('Error loading job alerts:', err);
      setError(serviceUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    try {
      if (!selectedAlert) {
        console.error('No alert selected for response');
        return;
      }

      console.log('Submitting response for alert:', selectedAlert._id);
      console.log('Response data:', responseData);
      
      setResponseLoading(true);
      setResponseError('');
      
      await jobDistributionService.respondToJobAlert(selectedAlert._id, responseData);
      console.log('Response submitted successfully');
      
      // Reload alerts
      console.log('Reloading job alerts...');
      await loadJobAlerts();
      
      // Close modal and reset state
      setShowResponseModal(false);
      setSelectedAlert(null);
      setResponseData({
        interested: false,
        message: '',
        estimatedTime: ''
      });
      
      console.log('Response process completed successfully');
    } catch (err) {
      const errorMessage = serviceUtils.formatError(err);
      console.error('Error responding to job alert:', {
        error: err,
        message: errorMessage,
        alertId: selectedAlert?._id,
        responseData
      });
      setResponseError(errorMessage);
      setError(errorMessage); // Also set global error for visibility
    } finally {
      setResponseLoading(false);
    }
  };

  const openResponseModal = (alert) => {
    console.log('Opening response modal for alert:', alert._id);
    setSelectedAlert(alert);
    setShowResponseModal(true);
    setResponseError(''); // Clear any previous errors
    setResponseData({
      interested: false,
      message: '',
      estimatedTime: ''
    });
  };

  const closeResponseModal = () => {
    console.log('Closing response modal');
    setShowResponseModal(false);
    setSelectedAlert(null);
    setResponseError('');
    setResponseData({
      interested: false,
      message: '',
      estimatedTime: ''
    });
  };

  const handleMarkCompleted = async (alertId) => {
    try {
      setCompletionLoading(true);
      console.log('Marking job as completed:', alertId);
      
      // Call API to mark job as completed
      await jobDistributionService.markJobCompleted(alertId);
      
      // Reload alerts to reflect changes
      await loadJobAlerts();
      
      console.log('Job marked as completed successfully');
    } catch (err) {
      const errorMessage = serviceUtils.formatError(err);
      console.error('Error marking job as completed:', errorMessage);
      setError(errorMessage);
    } finally {
      setCompletionLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    // Job alert statuses are different from booking statuses
    const jobAlertStatusConfig = {
      'sent': { color: 'bg-blue-100 text-blue-800', text: 'New Alert' },
      'viewed': { color: 'bg-yellow-100 text-yellow-800', text: 'Viewed' },
      'interested': { color: 'bg-green-100 text-green-800', text: 'Interested' },
      'not-interested': { color: 'bg-red-100 text-red-800', text: 'Not Interested' },
      'claimed': { color: 'bg-purple-100 text-purple-800', text: 'Job Claimed' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Completed' }
    };
    
    return jobAlertStatusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading available jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/mover/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <FiHome className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Jobs & Alerts</h1>
                <p className="text-sm text-gray-500">Manage your claimed jobs and respond to new alerts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiX className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
              </div>
              <div className="ml-2 sm:ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Claimed Jobs Section */}
        {jobAlerts.filter(alert => alert.status === 'claimed' || alert.status === 'completed').length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Jobs</h2>
                <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    {jobAlerts.filter(alert => alert.status === 'claimed').length} active
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {jobAlerts.filter(alert => alert.status === 'completed').length} completed
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {jobAlerts.filter(alert => alert.status === 'claimed' || alert.status === 'completed').map((alert) => (
                  <div key={alert._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(alert.status).color} w-fit`}>
                            {getStatusInfo(alert.status).text}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Job Details</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <FiMapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Service Address:</strong> {alert.booking?.pickupAddress ? `${alert.booking.pickupAddress.street}, ${alert.booking.pickupAddress.city}, ${alert.booking.pickupAddress.state} ${alert.booking.pickupAddress.zipCode}` : 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiCalendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Service Date:</strong> {alert.booking?.moveDate ? new Date(alert.booking.moveDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiClock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Time:</strong> {alert.booking?.moveTime || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <FiHome className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Property Size:</strong> {alert.booking?.homeSize || 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiClock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Duration:</strong> {alert.booking?.estimatedDuration ? `${alert.booking.estimatedDuration} hours` : 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiDollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Deposit:</strong> {alert.booking?.deposit?.amount ? `$${(alert.booking.deposit.amount / 100).toFixed(2)}` : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {alert.booking?.specialInstructions && (
                          <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-700">
                              <strong>Special Instructions:</strong> {alert.booking.specialInstructions}
                            </p>
                          </div>
                        )}
                        
                        {(alert.booking?.customer || alert.booking?.customerInfo) && (
                          <div className="mt-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-gray-700">
                              <strong>Customer:</strong> {alert.booking.customer ? `${alert.booking.customer.firstName} ${alert.booking.customer.lastName}` : `${alert.booking.customerInfo.firstName} ${alert.booking.customerInfo.lastName}`}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 sm:mt-0 sm:ml-4 flex justify-end sm:justify-start">
                        {alert.status === 'claimed' && (
                          <button
                            onClick={() => handleMarkCompleted(alert._id)}
                            disabled={completionLoading}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            {completionLoading ? (
                              <>
                                <FiLoader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <FiCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>
                        )}
                        {alert.status === 'completed' && (
                          <div className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-100 text-green-800 text-xs sm:text-sm font-medium rounded-lg text-center">
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Job Alerts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Available Alerts</h2>
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {jobAlerts.filter(alert => alert.status === 'sent').length} new alerts
                </span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  {jobAlerts.filter(alert => alert.status === 'not-interested').length} declined
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {jobAlerts.filter(alert => alert.status !== 'claimed' && alert.status !== 'completed').length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <FiHome className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No new alerts</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  You'll receive alerts when new jobs are posted in your service area.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {jobAlerts.filter(alert => alert.status !== 'claimed' && alert.status !== 'completed').map((alert) => (
                  <div key={alert._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(alert.status).color} w-fit`}>
                            {getStatusInfo(alert.status).text}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Job Details</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <FiMapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Service Address:</strong> {alert.booking?.pickupAddress ? `${alert.booking.pickupAddress.street}, ${alert.booking.pickupAddress.city}, ${alert.booking.pickupAddress.state} ${alert.booking.pickupAddress.zipCode}` : 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiCalendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Service Date:</strong> {alert.booking?.moveDate ? new Date(alert.booking.moveDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiClock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Time:</strong> {alert.booking?.moveTime || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start space-x-2">
                              <FiHome className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Property Size:</strong> {alert.booking?.homeSize || 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiClock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span><strong>Duration:</strong> {alert.booking?.estimatedDuration ? `${alert.booking.estimatedDuration} hours` : 'N/A'}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span><strong>Deposit:</strong> {alert.booking?.deposit?.amount ? `$${(alert.booking.deposit.amount / 100).toFixed(2)}` : 'N/A'} </span>
                            </div>
                          </div>
                        </div>
                        
                        {alert.booking?.specialInstructions && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Special Instructions:</strong> {alert.booking.specialInstructions}
                            </p>
                          </div>
                        )}
                        
                        {alert.booking?.servicesRequested && alert.booking.servicesRequested.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Services Required:</strong> {alert.booking.servicesRequested.join(', ')}
                            </p>
                          </div>
                        )}
                        
                        {(alert.booking?.customer || alert.booking?.customerInfo) && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Customer:</strong> {alert.booking.customer ? `${alert.booking.customer.firstName} ${alert.booking.customer.lastName}` : `${alert.booking.customerInfo.firstName} ${alert.booking.customerInfo.lastName}`}
                            </p>
                          </div>
                        )}
                        
                        {(alert.booking?.quote || alert.booking?.deposit) && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-3">Job Payment Details</h4>
                            <div className="space-y-3">
                              {alert.booking.quote && (
                                <div className="space-y-2 text-sm">
                                  {alert.booking.quote.hourlyRate && (
                                    <div className="flex justify-between">
                                      <span>Hourly Rate:</span>
                                      <span>${alert.booking.quote.hourlyRate}/hr</span>
                                    </div>
                                  )}
                                  {alert.booking.quote.estimatedHours && (
                                    <div className="flex justify-between">
                                      <span>Estimated Hours:</span>
                                      <span>{alert.booking.quote.estimatedHours} hrs</span>
                                    </div>
                                  )}
                                  {alert.booking.quote.laborCost && (
                                    <div className="flex justify-between">
                                      <span>Labor Cost:</span>
                                      <span>${alert.booking.quote.laborCost}</span>
                                    </div>
                                  )}
                                  {alert.booking.quote.travelFee > 0 && (
                                    <div className="flex justify-between">
                                      <span>Travel Fee:</span>
                                      <span>${alert.booking.quote.travelFee}</span>
                                    </div>
                                  )}
                                  {alert.booking.quote.packingFee > 0 && (
                                    <div className="flex justify-between">
                                      <span>Packing Fee:</span>
                                      <span>${alert.booking.quote.packingFee}</span>
                                    </div>
                                  )}
                                  {alert.booking.quote.equipmentFee > 0 && (
                                    <div className="flex justify-between">
                                      <span>Equipment Fee:</span>
                                      <span>${alert.booking.quote.equipmentFee}</span>
                                    </div>
                                  )}
                                  <div className="border-t border-blue-300 pt-2 mt-2">
                                    <div className="flex justify-between font-medium text-blue-900">
                                      <span>Your Payment:</span>
                                      <span>${alert.booking.quote.subtotal - (alert.booking.deposit.amount/100)} + hourly</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {alert.booking.deposit && (
                                <div className="border-t border-blue-300 pt-3 mt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-900">Customer Deposit:</span>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">${(alert.booking.deposit.amount / 100).toFixed(2)}</span>
                                     
                                    </div>
                                  </div>
                                  <p className="text-xs text-blue-700 mt-1">
                                    {alert.booking.paymentStatus === 'deposit-paid' 
                                      ? "Customer has secured this job with their deposit payment"
                                      : "Customer deposit is pending - job not yet secured"
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 sm:mt-0 sm:ml-4 flex justify-end sm:justify-start">
                        {alert.status === 'sent' && (
                          <button
                            onClick={() => openResponseModal(alert)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Claim Job
                          </button>
                        )}
                        {alert.status === 'not-interested' && (
                          <div className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-100 text-red-800 text-xs sm:text-sm font-medium rounded-lg text-center">
                            Declined
                          </div>
                        )}
                        {alert.status === 'viewed' && (
                        <button
                          onClick={() => openResponseModal(alert)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Respond
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-white">Claim Job</h3>
                <button
                  onClick={closeResponseModal}
                  disabled={responseLoading}
                  className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                Job ID: #{selectedAlert._id.slice(-8)}
              </p>
            </div>

            {/* Modal Content */}
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              {/* Error Display */}
              {responseError && (
                <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start">
                    <FiX className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5 mr-2 sm:mr-3" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-red-800">Error Submitting Response</h4>
                      <p className="text-xs sm:text-sm text-red-700 mt-1">{responseError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 sm:space-y-6">
                {/* Interest Checkbox */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <label className="flex items-start space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={responseData.interested}
                      onChange={(e) => setResponseData({...responseData, interested: e.target.checked})}
                      disabled={responseLoading}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">I want to claim this job</span>
                      <p className="text-xs text-gray-600 mt-1">
                        By checking this box, you're claiming this job and it will be assigned to you to complete.
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Message Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Message to Customer <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData({...responseData, message: e.target.value})}
                    disabled={responseLoading}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 text-xs sm:text-sm"
                    placeholder="Introduce yourself and let the customer know about your experience and availability for this job..."
                  />
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    Tip: Professional, friendly messages help build trust with customers.
                  </p>
                </div>
                
                {/* Payment Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-blue-900 mb-2 sm:mb-3 flex items-center text-xs sm:text-sm">
                    <FiDollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Job Payment & Status
                  </h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Your Payment:</span>
                      <span className="font-medium">${selectedAlert?.booking?.quote?.subtotal - (selectedAlert?.booking?.deposit?.amount / 100) || 'N/A'} + hourly</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Deposit:</span>
                      <span className="font-medium">
                        ${selectedAlert?.booking?.deposit?.amount ? (selectedAlert.booking.deposit.amount / 100).toFixed(2) : 'N/A'}
                       
                      </span>
                    </div>
                  </div>
                 
                </div>
                
                {/* Estimated Time Input */}
               {/*  <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion Time <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={responseData.estimatedTime}
                    onChange={(e) => setResponseData({...responseData, estimatedTime: e.target.value})}
                    disabled={responseLoading}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 text-xs sm:text-sm"
                    placeholder="e.g., 4 hours, same day, within 2 days, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    Let the customer know your availability and expected completion timeframe.
                  </p>
                </div> */}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={closeResponseModal}
                  disabled={responseLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponse}
                  disabled={responseLoading || (!responseData.interested && !responseData.message.trim())}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm"
                >
                  {responseLoading ? (
                    <>
                      <FiLoader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Claim Job</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Validation Message */}
              {!responseData.interested && !responseData.message.trim() && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Please either claim the job or provide a message to the customer.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoverJobs;
