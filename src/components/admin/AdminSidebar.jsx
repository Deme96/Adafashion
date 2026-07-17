// ========== Ada Fashion Admin Sidebar ==========
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, DollarSign,
  ClipboardList, Settings, Store, X, LogOut, Warehouse, CalendarClock
} from 'lucide-react';
import { logout, getLoggedUser, canAccessMenu } from '../../lib/auth';
import { useLanguage } from '../../hooks/useLanguage';

const AdminSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const user = getLoggedUser() || { role: 'Admin' };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t('dashboard'), menuKey: 'dashboard', end: true },
    { to: '/admin/controle-estoque', icon: Warehouse, label: t('inventory'), menuKey: 'inventory' },
    { to: '/admin/compras', icon: ShoppingCart, label: t('purchases'), menuKey: 'purchases' },
    { to: '/admin/vendas', icon: BarChart3, label: t('sales'), menuKey: 'sales' },
    { to: '/admin/reservas', icon: CalendarClock, label: 'Reservas', menuKey: 'reservations' },
    { to: '/admin/financas', icon: DollarSign, label: t('finances'), menuKey: 'finances' },
    { to: '/admin/configuracoes', icon: Settings, label: t('settings'), menuKey: 'settings' },
  ].filter((item) => canAccessMenu(item.menuKey, user?.role));

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-rose-400 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/5">
          <Link to="/admin" className="flex flex-col leading-none">
            <span className="font-fashion text-xl font-bold italic text-white tracking-tight">Ada Fashion</span>
            <span className="text-[8px] tracking-[0.2em] uppercase text-white/60 font-medium">Casa de Bideras</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/20 text-white/80"
          >
            <X size={18} />
          </button>
        </div>

        {/* Back to store */}
        <Link
          to="/"
          className="flex items-center gap-2 mx-4 mt-4 px-3 py-2.5 rounded-xl bg-white/15 text-white/80 hover:text-white hover:bg-white/25 transition-colors text-sm"
        >
          <Store size={16} />
          {t('backToStore')}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/20'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
