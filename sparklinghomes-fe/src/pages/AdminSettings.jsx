import { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiAlertCircle, FiDollarSign, FiCalendar, FiPhone, FiMail } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout.jsx';
import { getApiUrl } from '../services';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformFee: 0.15,
    minimumBookingAmount: 50,
    maxBookingAdvance: 30,
    supportEmail: 'SUPPORT@BOOKANDMOVE.COM',
    supportPhone: '+1-800-BOOK-MOVE'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(getApiUrl('/admin/settings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      setSettings(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(getApiUrl('/admin/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      setSuccess('Platform settings updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Platform Settings" 
      subtitle="Configure platform parameters"
    >
      <div className="max-w-4xl mx-auto">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <FiSave className="h-5 w-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Financial Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <FiDollarSign className="h-5 w-5 mr-2 text-green-600" />
                Financial Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="platformFee" className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Fee (0.0 - 1.0)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="platformFee"
                      name="platformFee"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.platformFee}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.15"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Platform fee as a decimal (0.15 = 15%)
                  </p>
                </div>

                <div>
                  <label htmlFor="minimumBookingAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Booking Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="minimumBookingAmount"
                      name="minimumBookingAmount"
                      min="0"
                      step="0.01"
                      value={settings.minimumBookingAmount}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum amount required for a booking
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="maxBookingAdvance" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Booking Advance (Days)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="maxBookingAdvance"
                    name="maxBookingAdvance"
                    min="1"
                    max="365"
                    value={settings.maxBookingAdvance}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  How many days in advance customers can book
                </p>
              </div>
            </div>

            {/* Support Settings */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <FiMail className="h-5 w-5 mr-2 text-blue-600" />
                Support Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="supportEmail"
                      name="supportEmail"
                      value={settings.supportEmail}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SUPPORT@BOOKANDMOVE.COM"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Support Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="supportPhone"
                      name="supportPhone"
                      value={settings.supportPhone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1-800-BOOK-MOVE"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Settings Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>These settings affect the entire platform. Changes will be applied immediately and may impact user experience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
