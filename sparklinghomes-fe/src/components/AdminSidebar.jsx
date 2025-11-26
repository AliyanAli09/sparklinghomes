import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiShield,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const AdminSidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: FiHome,
      current: location.pathname === '/admin/dashboard'
    },
    /* {
      name: 'Users',
      href: '/admin/users',
      icon: FiUsers,
      current: location.pathname === '/admin/users'
    }, */
    {
      name: 'Cleaners',
      href: '/admin/movers',
      icon: FiUsers,
      current: location.pathname === '/admin/movers'
    },
    {
      name: 'Bookings',
      href: '/admin/bookings',
      icon: FiCalendar,
      current: location.pathname === '/admin/bookings'
    },
    {
      name: 'Payments',
      href: '/admin/payments',
      icon: FiDollarSign,
      current: location.pathname === '/admin/payments'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: FiBarChart2,
      current: location.pathname === '/admin/analytics'
    },
   /*  {
      name: 'Settings',
      href: '/admin/settings',
      icon: FiSettings,
      current: location.pathname === '/admin/settings'
    }, */
    {
      name: 'Admins',
      href: '/admin/admins',
      icon: FiShield,
      current: location.pathname === '/admin/admins'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavigation = (href) => {
    navigate(href);
    // Close sidebar after navigation on all devices
    onToggle();
  };

  return (
    <>
      {/* Backdrop - visible on all devices when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiShield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sparkling Homes</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* User profile section */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUser className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${item.current
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${item.current ? 'text-blue-600' : 'text-gray-400'}
                `} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout section */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
