import { useState, useEffect } from 'react';
import { FiMapPin, FiCalendar, FiHome, FiClock, FiDollarSign, FiMessageSquare, FiCheck, FiX } from 'react-icons/fi';
import { jobDistributionService, serviceUtils } from '../services';

const JobAlerts = () => {
  const [jobAlerts, setJobAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({
    interested: false,
    message: '',
    estimatedPrice: '',
    estimatedTime: ''
  });

  useEffect(() => {
    loadJobAlerts();
  }, []);

  const loadJobAlerts = async () => {
    try {
      setLoading(true);
      const response = await jobDistributionService.getJobAlerts();
      setJobAlerts(response.data?.jobAlerts || []);
    } catch (err) {
      setError(serviceUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    try {
      if (!selectedAlert) return;
      
      await jobDistributionService.respondToJobAlert(selectedAlert._id, responseData);
      
      // Reload alerts
      await loadJobAlerts();
      
      // Close modal
      setShowResponseModal(false);
      setSelectedAlert(null);
      setResponseData({
        interested: false,
        message: '',
        estimatedPrice: '',
        estimatedTime: ''
      });
    } catch (err) {
      setError(serviceUtils.formatError(err));
    }
  };

  const openResponseModal = (alert) => {
    setSelectedAlert(alert);
    setShowResponseModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'not-interested':
        return 'bg-red-100 text-red-800';
      case 'claimed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'New Alert';
      case 'viewed':
        return 'Viewed';
      case 'interested':
        return 'Interested';
      case 'not-interested':
        return 'Not Interested';
      case 'claimed':
        return 'Job Claimed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (jobAlerts.length === 0) {
    return (
      <div className="text-center py-8">
        <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No job alerts</h3>
        <p className="mt-1 text-sm text-gray-500">
          You'll receive alerts when new jobs are posted in your service area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Job Alerts</h2>
        <span className="text-sm text-gray-500">
          {jobAlerts.filter(alert => alert.status === 'sent').length} new alerts
        </span>
      </div>

      <div className="space-y-3">
        {jobAlerts.map((alert) => (
          <div
            key={alert._id}
            className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
              alert.status === 'sent' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {getStatusText(alert.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {serviceUtils.formatDateTime(alert.sentAt)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Job Details</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 h-4 w-4" />
                        {serviceUtils.formatDate(alert.booking?.moveDate)}
                      </div>
                      <div className="flex items-center">
                        <FiHome className="mr-2 h-4 w-4" />
                        {alert.booking?.homeSize?.replace('-', ' ')}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="mr-2 h-4 w-4" />
                        {alert.booking?.estimatedDuration} hours
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 h-4 w-4" />
                        <span className="font-medium">Pickup:</span>
                      </div>
                      <div className="ml-6 text-xs">
                        {alert.booking?.pickupAddress?.street}<br />
                        {alert.booking?.pickupAddress?.city}, {alert.booking?.pickupAddress?.state}
                      </div>
                      <div className="flex items-center mt-2">
                        <FiMapPin className="mr-2 h-4 w-4" />
                        <span className="font-medium">Dropoff:</span>
                      </div>
                      <div className="ml-6 text-xs">
                        {alert.booking?.dropoffAddress?.street}<br />
                        {alert.booking?.dropoffAddress?.city}, {alert.booking?.dropoffAddress?.state}
                      </div>
                    </div>
                  </div>
                </div>

                {alert.booking?.servicesRequested && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Services Requested:</h4>
                    <div className="flex flex-wrap gap-1">
                      {alert.booking.servicesRequested.map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {service.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {alert.status === 'sent' && (
                <div className="ml-4 space-y-2">
                  <button
                    onClick={() => openResponseModal(alert)}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Respond
                  </button>
                </div>
              )}
            </div>

            {alert.response && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Your Response:</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Interested:</strong> {alert.response.interested ? 'Yes' : 'No'}</p>
                  {alert.response.message && (
                    <p><strong>Message:</strong> {alert.response.message}</p>
                  )}
                  {alert.response.estimatedPrice && (
                    <p><strong>Estimated Price:</strong> {serviceUtils.formatCurrency(alert.response.estimatedPrice)}</p>
                  )}
                  {alert.response.estimatedTime && (
                    <p><strong>Estimated Time:</strong> {alert.response.estimatedTime} hours</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Respond to Job Alert</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you interested in this job?
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="interested"
                        value="true"
                        checked={responseData.interested === true}
                        onChange={(e) => setResponseData(prev => ({ ...prev, interested: e.target.value === 'true' }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="interested"
                        value="false"
                        checked={responseData.interested === false}
                        onChange={(e) => setResponseData(prev => ({ ...prev, interested: e.target.value === 'true' }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">No</span>
                    </label>
                  </div>
                </div>

                {responseData.interested && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message to Customer
                      </label>
                      <textarea
                        value={responseData.message}
                        onChange={(e) => setResponseData(prev => ({ ...prev, message: e.target.value }))}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Brief message about your availability and approach..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Price ($)
                        </label>
                        <input
                          type="number"
                          value={responseData.estimatedPrice}
                          onChange={(e) => setResponseData(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Time (hours)
                        </label>
                        <input
                          type="number"
                          value={responseData.estimatedTime}
                          onChange={(e) => setResponseData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResponse}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAlerts;
