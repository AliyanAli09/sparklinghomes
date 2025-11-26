import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiCheckCircle, FiClock, FiTrash, FiEye, FiCheck, FiX, FiAlertCircle, FiTruck, FiShield, FiMail, FiPhone, FiMapPin, FiCalendar, FiDollarSign, FiFileText, FiUser } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { getApiUrl } from '../services';

const AdminMovers = () => {
  const [movers, setMovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDocuments, setFilterDocuments] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMover, setSelectedMover] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showMoverModal, setShowMoverModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMover, setDeletingMover] = useState(false);

  useEffect(() => {
    fetchMovers();
  }, [currentPage, filterStatus, filterDocuments, searchTerm]);

  const fetchMovers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });
      
      if (filterStatus !== 'all') {
        params.append('verificationStatus', filterStatus);
      }
      
      if (filterDocuments !== 'all') {
        params.append('documentFilter', filterDocuments);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(getApiUrl(`/admin/movers?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      
      // Apply document filter on frontend if backend doesn't support it
      let filteredMovers = data.data.movers;
      if (filterDocuments === 'with-documents') {
        filteredMovers = filteredMovers.filter(m => m.verificationDocuments && m.verificationDocuments.length > 0);
      } else if (filterDocuments === 'no-documents') {
        filteredMovers = filteredMovers.filter(m => !m.verificationDocuments || m.verificationDocuments.length === 0);
      }
      
      setMovers(filteredMovers);
      setTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (moverId, status, notes = '') => {
    try {
      const response = await fetch(getApiUrl(`/admin/movers/${moverId}/verify`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          verificationStatus: status,
          verificationNotes: notes
        })
      });

      if (!response.ok) throw new Error('Failed to update verification status');

      // Refresh movers list
      fetchMovers();
      setShowVerificationModal(false);
      setSelectedMover(null);
      setVerificationNotes('');
    } catch (err) {
      setError(err.message);
    }
  };
  const handleDeleteMover = async (moverId) => {
    try {
      setDeletingMover(true);
      const response = await fetch(getApiUrl(`/admin/movers/${moverId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete mover');
      fetchMovers();
      setDeletingMover(false);
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.message);
      setDeletingMover(false);
      setShowDeleteModal(false);
    }
  };

  const handleViewMover = (mover) => {
    setSelectedMover(mover);
    setShowMoverModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      suspended: { color: 'bg-orange-100 text-orange-800', text: 'Suspended' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getDocumentStatusBadge = (hasDocuments) => {
    if (hasDocuments) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Documents Uploaded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        No Documents
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cleaners...</p>
        </div>
      </div>
    );
  }
 
  const getSubscriptionBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active', icon: FiCheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive', icon: FiAlertCircle },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired', icon: FiAlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending', icon: FiClock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
        {config.text}
      </span>
    );
  };
  
  return (
    <AdminLayout
      title="Cleaner Management"
      subtitle="Manage cleaner accounts & verifications"
    >
      <div className="max-w-7xl mx-auto">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search cleaners by name or email..."
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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <select
                value={filterDocuments}
                onChange={(e) => setFilterDocuments(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Documents</option>
                <option value="with-documents">With Documents</option>
                <option value="no-documents">No Documents</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Statistics */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {movers.filter(m => m.verificationDocuments && m.verificationDocuments.length > 0).length}
              </div>
              <div className="text-sm text-blue-700">With Documents</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {movers.filter(m => !m.verificationDocuments || m.verificationDocuments.length === 0).length}
              </div>
              <div className="text-sm text-yellow-700">No Documents</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {movers.filter(m => m.status === 'approved').length}
              </div>
              <div className="text-sm text-green-700">Approved</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {movers.filter(m => m.status === 'pending').length}
              </div>
              <div className="text-sm text-red-700">Pending Review</div>
            </div>
          </div>
        </div>

        {/* Cleaners List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Cleaners ({movers.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movers.map((mover) => (
                  <tr 
                    key={mover._id} 
                    className={`hover:bg-gray-50 ${
                      (!mover.verificationDocuments || mover.verificationDocuments.length === 0) 
                        ? 'bg-yellow-50 border-l-4 border-l-yellow-400' 
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiTruck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {mover.firstName} {mover.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{mover.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {mover.businessName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mover.licenseNumber || 'No License'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(mover.status || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSubscriptionBadge(mover.subscriptionStatus || 'pending')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {mover.verificationDocuments && mover.verificationDocuments.length > 0 ? (
                          <div className="flex items-center space-x-2 group relative">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-help">
                              {mover.verificationDocuments.length} uploaded
                            </span>
                            <span className="text-xs text-gray-500">
                              {mover.verificationDocuments.length === 1 ? 'document' : 'documents'}
                            </span>
                            
                            {/* Document Type Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              {mover.verificationDocuments.map(doc => doc.documentType.replace(/-/g, ' ')).join(', ')}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No documents
                            </span>
                            <span className="text-xs text-gray-500 text-red-600">
                              Action required
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mover.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewMover(mover)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => {setShowDeleteModal(true); setSelectedMover(mover);}}
                          className="text-red-600 hover:text-red-900"
                          title="Delete cleaner"
                        >
                          <FiTrash className="h-5 w-5" />
                        </button>
                      </div>
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
      </div>

      {/* Verification Modal */}
      <AdminModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setVerificationNotes('');
        }}
        title={`Verify Cleaner - ${selectedMover?.firstName} ${selectedMover?.lastName}`}
        confirmText="Approve"
        cancelText="Reject"
        onConfirm={() => handleVerification(selectedMover._id, 'approved', verificationNotes)}
        onCancel={() => handleVerification(selectedMover._id, 'rejected', verificationNotes)}
        confirmIcon={<FiCheck className="h-5 w-5 mr-2" />}
        cancelIcon={<FiX className="h-5 w-5 mr-2" />}
        confirmColor="green"
        cancelColor="red"
      >
        {selectedMover && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiUser className="h-5 w-5 text-blue-600 mr-2" />
                  Basic Information
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedMover.firstName} {selectedMover.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedMover.email}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedMover.phone}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiTruck className="h-5 w-5 text-green-600 mr-2" />
                  Business Information
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Business Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedMover.businessName || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">License Number</p>
                    <p className="text-sm text-gray-900">
                      {selectedMover.licenseNumber || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedMover.status || 'pending')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Documents Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <FiFileText className="h-5 w-5 text-purple-600 mr-2" />
                Verification Documents
              </h4>
              
              {selectedMover.verificationDocuments && selectedMover.verificationDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMover.verificationDocuments.map((document, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 capitalize">
                            {document.documentType.replace(/-/g, ' ')}
                          </h5>
                          {document.description && (
                            <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View document"
                          >
                            <FiEye className="h-4 w-4" />
                          </a>
                          <a
                            href={document.url}
                            download
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <FiTruck className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No verification documents uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This cleaner needs to upload business documents for verification
                  </p>
                </div>
              )}
            </div>

            {/* Verification Notes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Verification Notes (Optional)
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this verification decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </AdminModal>
      {/* Delete Modal */}
      {showDeleteModal && (
        <AdminModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Cleaner"
          showActions={false}
        >
          <div className="space-y-4">
            <p className="text-gray-700">Are you sure you want to delete {selectedMover.firstName} {selectedMover.lastName} ({selectedMover.businessName})?</p>
            <p className="text-gray-700">This action cannot be undone and will permanently remove the cleaner account and all associated data.</p>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingMover}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { handleDeleteMover(selectedMover._id) }}
                disabled={deletingMover}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {deletingMover ? 'Deleting...' : 'Delete Cleaner'}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
      {/* Mover Details Modal */}
      {showMoverModal && selectedMover && (
        <AdminModal
          isOpen={showMoverModal}
          onClose={() => setShowMoverModal(false)}
          title={`Cleaner Details - ${selectedMover.firstName} ${selectedMover.lastName}`}
          showActions={false}
        >
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiUser className="h-5 w-5 text-blue-600 mr-2" />
                  Basic Information
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedMover.firstName} {selectedMover.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedMover.email}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedMover.phone}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiTruck className="h-5 w-5 text-green-600 mr-2" />
                  Business Information
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Business Name</p>
                    <p className="text-sm text-gray-900">
                      {selectedMover.businessName || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">License Number</p>
                    <p className="text-sm text-gray-900">
                      {selectedMover.licenseNumber || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedMover.status || 'pending')}</div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Document Status</p>
                    <div className="mt-1">{getDocumentStatusBadge(selectedMover.verificationDocuments && selectedMover.verificationDocuments.length > 0)}</div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Joined Date</p>
                    <p className="text-sm text-gray-900 flex items-center">
                      <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(selectedMover.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Documents Section */}
            {selectedMover.verificationDocuments && selectedMover.verificationDocuments.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiFileText className="h-5 w-5 text-purple-600 mr-2" />
                  Verification Documents
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMover.verificationDocuments.map((document, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 capitalize">
                            {document.documentType.replace(/-/g, ' ')}
                          </h5>
                          {document.description && (
                            <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View document"
                          >
                            <FiEye className="h-4 w-4" />
                          </a>
                          <a
                            href={document.url}
                            download
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Download document"
                          >
                            <FiTruck className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowMoverModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              
              {/* Show approve/deny buttons only for pending cleaners */}
              {selectedMover.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowMoverModal(false);
                      setShowVerificationModal(true);
                      setVerificationNotes('');
                    }}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center"
                  >
                    <FiCheck className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowMoverModal(false);
                      setShowVerificationModal(true);
                      setVerificationNotes('');
                    }}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center"
                  >
                    <FiX className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  );
};

export default AdminMovers;
