import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';
import { 
  FaTrash, FaSignOutAlt, FaHome, FaClipboardList, 
  FaPlus, FaUsers, FaChartBar, FaTasks 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Layout = ({ children, userRole, setUserRole }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUserRole(null); // Reset userRole when signing out
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  // Ensure userRole is available before rendering the UI
  if (!userRole) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaTrash className="text-primary-600 text-2xl mr-2" />
            <h1 className="text-xl font-bold text-gray-900">CleanCity</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FaSignOutAlt className="mr-1" /> Sign Out
          </button>
        </div>
      </header>

      {/* Sidebar and Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="mt-5 px-2">
            {userRole === 'user' && (
              <div className="space-y-1">
                <Link
                  to="/"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaHome className="mr-3 text-gray-500" />
                  Dashboard
                </Link>
                <Link
                  to="/report"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaPlus className="mr-3 text-gray-500" />
                  Report Waste
                </Link>
                <Link
                  to="/my-reports"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaClipboardList className="mr-3 text-gray-500" />
                  My Reports
                </Link>
              </div>
            )}

            {userRole === 'management' && (
              <div className="space-y-1">
                <Link
                  to="/"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaHome className="mr-3 text-gray-500" />
                  Dashboard
                </Link>
                <Link
                  to="/management/reports"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaClipboardList className="mr-3 text-gray-500" />
                  Waste Reports
                </Link>
                <Link
                  to="/management/workers"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaUsers className="mr-3 text-gray-500" />
                  Workers
                </Link>
                <Link
                  to="/management/analytics"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaChartBar className="mr-3 text-gray-500" />
                  Analytics
                </Link>
              </div>
            )}

            {userRole === 'worker' && (
              <div className="space-y-1">
                <Link
                  to="/"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaHome className="mr-3 text-gray-500" />
                  Dashboard
                </Link>
                <Link
                  to="/worker/tasks"
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <FaTasks className="mr-3 text-gray-500" />
                  My Tasks
                </Link>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
