import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiEdit, FiTrash2, FiShield, FiAlertCircle, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout.jsx';
import { adminService, serviceUtils } from '../services';

const AdminAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    adminPermissions: {
      canManageUsers: true,
      canManageMovers: true,
      canViewAnalytics: true,
      canManageBookings: true,
      canManageContent: true,
      canManageSettings: true
    }
  });

  useEffect(() => {
    fetchAdmins();
  }, [currentPage, searchTerm]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const response = await adminService.getAllUsers({
        page: currentPage,
        limit: 20,
        role: 'admin', // Only fetch admin users
        search: searchTerm
      });
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        throw new Error('Invalid response structure from server');
      }
      
      if (!response.data.users) {
        throw new Error('No users data in response');
      }
      
      // Filter out the current logged-in admin
      const filteredAdmins = response.data.users.filter(admin => admin._id !== user?.id);
      setAdmins(filteredAdmins);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setCreating(true);
      
      await adminService.createAdmin(newAdmin);

      // Reset form and refresh list
      setNewAdmin({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        adminPermissions: {
          canManageUsers: true,
          canManageMovers: true,
          canViewAnalytics: true,
          canManageBookings: true,
          canManageContent: true,
          canManageSettings: true
        }
      });
      setShowCreateForm(false);
      setSuccess('Admin created successfully!');
      fetchAdmins();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to create admin:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleViewAdmin = (admin) => {
    setViewingAdmin(admin);
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
  };

  const handleDeleteClick = (admin) => {
    setDeletingAdmin(admin);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    try {
      setError('');
      setSuccess('');
      setUpdating(true);
      
      const updateData = {
        firstName: editingAdmin.firstName,
        lastName: editingAdmin.lastName,
        email: editingAdmin.email,
        phone: editingAdmin.phone,
        adminPermissions: editingAdmin.adminPermissions
      };

      await adminService.updateUser(editingAdmin._id, updateData);
      
      setEditingAdmin(null);
      setSuccess('Admin updated successfully!');
      fetchAdmins();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to update admin:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;

    try {
      setDeleting(true);
      setError('');
      setSuccess('');
      
      await adminService.deleteUser(deletingAdmin._id);
      setDeletingAdmin(null);
      setSuccess('Admin deleted successfully!');
      fetchAdmins();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(serviceUtils.formatError(err));
      console.error('Failed to delete admin:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getPermissionBadge = (permissions) => {
    if (!permissions) return <span className="text-gray-500 text-xs">No permissions</span>;
    
    const permissionCount = Object.values(permissions).filter(Boolean).length;
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        {permissionCount} permissions
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Admin Management" 
      subtitle="Manage platform administrators"
    >
      <div className="max-w-7xl mx-auto">
        {/* Add Admin Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Admin</span>
          </button>
        </div>
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <FiCheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Create Admin Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Admin</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAdmin({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    phone: '',
                    adminPermissions: {
                      canManageUsers: true,
                      canManageMovers: true,
                      canViewAnalytics: true,
                      canManageBookings: true,
                      canManageContent: true,
                      canManageSettings: true
                    }
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.firstName}
                    onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.lastName}
                    onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Admin Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Admin Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(newAdmin.adminPermissions).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNewAdmin({
                          ...newAdmin,
                          adminPermissions: {
                            ...newAdmin.adminPermissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAdmin({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      phone: '',
                      adminPermissions: {
                        canManageUsers: true,
                        canManageMovers: true,
                        canViewAnalytics: true,
                        canManageBookings: true,
                        canManageContent: true,
                        canManageSettings: true
                      }
                    });
                  }}
                  disabled={creating}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {creating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{creating ? 'Creating...' : 'Create Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Admin Modal */}
        {editingAdmin && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Admin</h3>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.firstName}
                    onChange={(e) => setEditingAdmin({...editingAdmin, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.lastName}
                    onChange={(e) => setEditingAdmin({...editingAdmin, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingAdmin.email}
                    onChange={(e) => setEditingAdmin({...editingAdmin, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingAdmin.phone}
                    onChange={(e) => setEditingAdmin({...editingAdmin, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Admin Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Admin Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(editingAdmin.adminPermissions || {}).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setEditingAdmin({
                          ...editingAdmin,
                          adminPermissions: {
                            ...editingAdmin.adminPermissions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  disabled={updating}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{updating ? 'Updating...' : 'Update Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* View Admin Modal */}
        {viewingAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Admin Details</h3>
                <button
                  onClick={() => setViewingAdmin(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Admin Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <FiShield className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      {viewingAdmin.firstName} {viewingAdmin.lastName}
                    </h4>
                    <p className="text-gray-600">{viewingAdmin.email}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Contact Information</h5>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="text-gray-900">{viewingAdmin.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p className="text-gray-900">{viewingAdmin.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">Account Information</h5>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                          viewingAdmin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingAdmin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Role:</span>
                        <p className="text-gray-900 capitalize">{viewingAdmin.role}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Joined:</span>
                        <p className="text-gray-900">{new Date(viewingAdmin.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Admin Permissions</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {viewingAdmin.adminPermissions && Object.entries(viewingAdmin.adminPermissions).map(([permission, hasPermission]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${hasPermission ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700">
                          {permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setViewingAdmin(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingAdmin(null);
                    handleEditAdmin(viewingAdmin);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Edit Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FiAlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Admin</h3>
                    <p className="text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete <strong>{deletingAdmin.firstName} {deletingAdmin.lastName}</strong>?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    This will permanently remove their admin access and all associated data.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeletingAdmin(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAdmin}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {deleting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <FiTrash2 className="h-4 w-4" />
                    <span>{deleting ? 'Deleting...' : 'Delete Admin'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admins List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Administrators ({admins.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
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
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <FiShield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPermissionBadge(admin.adminPermissions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewAdmin(admin)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View Admin Details"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEditAdmin(admin)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit Admin"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(admin)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete Admin"
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
      </div>
    </AdminLayout>
  );
};

export default AdminAdmins;
