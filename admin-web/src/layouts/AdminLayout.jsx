import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, ShoppingBag, Bike, Users, Ticket, Receipt, LogOut, Map, Boxes,
} from 'lucide-react';
import { useAuth } from '../store/auth';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/delivery', label: 'Delivery Partners', icon: Bike },
  { to: '/live-map', label: 'Live Map', icon: Map },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/coupons', label: 'Coupons', icon: Ticket },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">D</div>
            <div>
              <div className="font-bold text-slate-900">Dailyzo</div>
              <div className="text-xs text-slate-500">Admin Console</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center font-semibold text-brand-700">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full justify-start text-sm text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
