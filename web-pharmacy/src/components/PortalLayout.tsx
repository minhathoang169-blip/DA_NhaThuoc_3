import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Layers, 
  ShoppingBag, 
  LogOut, 
  Activity,
  ShieldCheck,
  Users,
  UserCog,
  Building2,
  Store
} from 'lucide-react';

export function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Tổng quan (Dashboard)',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'PHARMACIST'],
    },
    {
      name: 'Bán hàng tại quầy (POS)',
      path: '/pos',
      icon: ShoppingCart,
      roles: ['ADMIN', 'PHARMACIST'],
    },
    {
      name: 'Đơn đặt hàng Online',
      path: '/orders',
      icon: ShoppingBag,
      roles: ['ADMIN', 'PHARMACIST'],
    },
    {
      name: 'Quản lý Lô & Hạn dùng (LoThuoc)',
      path: '/batches',
      icon: Layers,
      roles: ['ADMIN', 'PHARMACIST'],
    },
    {
      name: 'Danh mục Sản phẩm (SanPham)',
      path: '/medicines',
      icon: Package,
      roles: ['ADMIN', 'PHARMACIST'],
    },
    {
      name: 'Khách hàng (KhachHang)',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'PHARMACIST'],
    },
    {
      name: 'Nhà cung cấp (NhaCungCap)',
      path: '/suppliers',
      icon: Building2,
      roles: ['ADMIN'],
    },
    {
      name: 'Nhân viên (NhanVien)',
      path: '/employees',
      icon: UserCog,
      roles: ['ADMIN'],
    },
  ];

  const allowedNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight tracking-tight">Nhà Thuốc Chuẩn GPP</h1>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> SQL Server • FEFO Ready
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Phân hệ nghiệp vụ
          </div>
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between gap-2 mb-3 px-2">
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || user?.username}
              </p>
              <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user?.role === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Dược sĩ bán hàng'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất ca trực</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
export default PortalLayout;
