import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar.jsx';

const AdminLayout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toggle button - visible on all devices */}
      

      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        {/* Top bar */}
        <div className="sticky flex top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex ml-4 z-50 my-auto">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-white rounded-md shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? "" : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
