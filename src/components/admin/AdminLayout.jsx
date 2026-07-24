import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { isAuthenticated, getLoggedUser, logout } from '../../lib/auth';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = getLoggedUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // If not authenticated, we don't render the layout to prevent flashing
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-rose-100 h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-rose-50 transition-colors lg:hidden"
            >
              <Menu size={20} className="text-rose-500" />
            </button>
            <span className="font-fashion text-2xl text-rose-500 lg:hidden">Ada Fashion</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* User Profile Info */}
            {user && (
              <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                  <User size={16} />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-gray-700 leading-none">{user.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{user.role}</p>
                </div>
              </div>
            )}

            {/* Logout */}
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
