import { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiX, FiTrash2, FiMessageSquare, FiAlertCircle, FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import { jobDistributionService, serviceUtils } from '../services';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await jobDistributionService.getNotifications({ unreadOnly: !showAll });
      setNotifications(response.data?.notifications || []);
    } catch (err) {
      setError(serviceUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await jobDistributionService.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await jobDistributionService.markNotificationRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (err) {
      setError(serviceUtils.formatError(err));
    }
  };

  const markAllAsRead = async () => {
    try {
      await jobDistributionService.markAllNotificationsRead();
      await loadNotifications();
      await loadUnreadCount();
    } catch (err) {
      setError(serviceUtils.formatError(err));
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await jobDistributionService.deleteNotification(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (err) {
      setError(serviceUtils.formatError(err));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job-alert':
        return <FiBell className="h-5 w-5 text-blue-500" />;
      case 'quote-provided':
        return <FiDollarSign className="h-5 w-5 text-green-500" />;
      case 'quote-accepted':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'job-claimed':
        return <FiMessageSquare className="h-5 w-5 text-purple-500" />;
      case 'job-completed':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'payment-received':
        return <FiDollarSign className="h-5 w-5 text-green-500" />;
      case 'subscription-expiring':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'system-alert':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FiBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'job-alert':
        return 'border-l-blue-500 bg-blue-50';
      case 'quote-provided':
        return 'border-l-green-500 bg-green-50';
      case 'quote-accepted':
        return 'border-l-green-500 bg-green-50';
      case 'job-claimed':
        return 'border-l-purple-500 bg-purple-50';
      case 'job-completed':
        return 'border-l-green-500 bg-green-50';
      case 'payment-received':
        return 'border-l-green-500 bg-green-50';
      case 'subscription-expiring':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'system-alert':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            {showAll ? 'Show Unread Only' : 'Show All'}
          </button>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <FiBell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {showAll ? 'No notifications' : 'No unread notifications'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {showAll 
              ? 'You\'ll see notifications here when there\'s activity on your account.'
              : 'You\'re all caught up!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`border-l-4 p-4 rounded-r-lg shadow-sm ${getNotificationColor(notification.type)} ${
                !notification.read ? 'ring-2 ring-primary-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{serviceUtils.formatDateTime(notification.createdAt)}</span>
                      {notification.expiresAt && (
                        <span>Expires: {serviceUtils.formatDate(notification.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Mark as read"
                    >
                      <FiCheck className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete notification"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
