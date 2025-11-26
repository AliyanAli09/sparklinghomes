import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiEdit, FiTrash2, FiUsers, FiAlertCircle, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield, FiUser } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { getApiUrl } from '../services';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'customer'
  });
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });
      
      // Only show customers (regular users, not movers or admins)
      params.append('role', 'customer');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(getApiUrl(`/admin/users?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      setUsers(data.data.users);
      setTotalPages(data.data.pagination.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setIsEditMode(false);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'customer'
    });
    setIsEditMode(true);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const response = await fetch(getApiUrl(`/admin/users/${selectedUser._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) throw new Error('Failed to update user');

      setShowUserModal(false);
      setIsEditMode(false);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteUser = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    try {
      const response = await fetch(getApiUrl(`/admin/users/${deleteUserId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');

      setShowDeleteConfirm(false);
      setDeleteUserId(null);
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDeleteUser = () => {
    setDeleteUserId(null);
    setShowDeleteConfirm(false);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      customer: { color: 'bg-blue-100 text-blue-800', text: 'Customer' },
      mover: { color: 'bg-green-100 text-green-800', text: 'Mover' },
      admin: { color: 'bg-purple-100 text-purple-800', text: 'Admin' }
    };

    const config = roleConfig[role] || roleConfig.customer;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Customer Management" 
      subtitle="Manage customer accounts"
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
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({users.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUsers className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="View details"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Edit user"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete user"
                        >
                          <FiTrash2 className="h-5 w-5" />
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

        {/* User Details Modal */}
        <AdminModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setIsEditMode(false);
          }}
          title={isEditMode ? `Edit User - ${selectedUser?.firstName} ${selectedUser?.lastName}` : `User Details - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-6">
              {isEditMode ? (
                // Edit Form
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        name="role"
                        value={editFormData.role}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
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
                          <p className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="text-sm text-gray-900 flex items-center">
                            <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                            {selectedUser.email}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Phone</p>
                          <p className="text-sm text-gray-900 flex items-center">
                            <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                            {selectedUser.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiShield className="h-5 w-5 text-green-600 mr-2" />
                    Account Status
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedUser.isActive)}</div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Verification</p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedUser.isVerified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Member Since</p>
                      <p className="text-sm text-gray-900 flex items-center">
                        <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {selectedUser.address && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <FiMapPin className="h-5 w-5 text-purple-600 mr-2" />
                    Address Information
                  </h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.address.street && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Street</p>
                          <p className="text-sm text-gray-900">{selectedUser.address.street}</p>
                        </div>
                      )}
                      
                      {selectedUser.address.city && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">City</p>
                          <p className="text-sm text-gray-900">{selectedUser.address.city}</p>
                        </div>
                      )}
                      
                      {selectedUser.address.state && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">State</p>
                          <p className="text-sm text-gray-900">{selectedUser.address.state}</p>
                        </div>
                      )}
                      
                      {selectedUser.address.zipCode && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">ZIP Code</p>
                          <p className="text-sm text-gray-900">{selectedUser.address.zipCode}</p>
                        </div>
                      )}
                      
                      {selectedUser.address.country && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Country</p>
                          <p className="text-sm text-gray-900">{selectedUser.address.country}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                  {/* Last Login */}
                  {selectedUser.lastLogin && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Recent Activity</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">
                          Last login: {new Date(selectedUser.lastLogin).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setIsEditMode(false);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {isEditMode ? 'Cancel' : 'Close'}
                </button>
                {isEditMode ? (
                  <button 
                    onClick={handleSaveUser}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEditUser(selectedUser)}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Edit User
                  </button>
                )}
              </div>
            </div>
          )}
        </AdminModal>

        {/* Delete Confirmation Modal */}
        <AdminModal
          isOpen={showDeleteConfirm}
          onClose={cancelDeleteUser}
          title="Delete User"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user account and all associated data.
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>This will permanently delete:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>User account and profile</li>
                      <li>All booking history</li>
                      <li>Payment records</li>
                      <li>Any associated data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={cancelDeleteUser}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </AdminModal>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
