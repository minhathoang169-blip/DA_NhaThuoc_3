import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Tổng Quan & Doanh Thu', icon: '📊', end: true },
    { to: '/admin/products', label: 'Quản Lý Thuốc & Giá Bán', icon: '💊' },
    { to: '/admin/orders', label: 'Quản Lý Đơn Hàng Online', icon: '📦' },
    { to: '/admin/pos', label: 'Bán Hàng Tại Quầy (POS)', icon: '🛒' },
    { to: '/admin/alerts', label: 'Cảnh Báo Cận Hạn', icon: '⚠️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Sidebar riêng biệt của Quản Trị */}
      <aside style={{ width: 260, background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        
        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
              +
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>DƯỢC AN</div>
              <div style={{ fontSize: 10, color: '#14b8a6', fontWeight: 700, letterSpacing: '0.05em' }}>ADMIN PORTAL</div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div style={{ padding: '16px 20px', background: '#1e293b', margin: '16px 12px', borderRadius: 12, border: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Đang đăng nhập</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.fullName || user?.username}
          </div>
          <div style={{ display: 'inline-block', marginTop: 6, background: '#0f766e', color: '#ccfbf1', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>
            {user?.role}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 10,
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? '#0f766e' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 8,
              background: '#1e293b',
              color: '#38bdf8',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>🌐</span>
            <span>Mở Trang Storefront</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid #334155',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span>🚪</span>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{ height: 64, background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            <span>HỆ THỐNG DƯỢC</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0f766e' }}>QUẢN TRỊ TRUNG TÂM</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: 999, border: '1px solid #a7f3d0' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <strong>Đồng bộ CSDL thực</strong>
            </div>
            <span style={{ fontSize: 13, color: '#334155' }}>
              Xin chào, <strong>{user?.fullName}</strong>
            </span>
          </div>
        </header>

        {/* Nested Admin Content */}
        <main style={{ flex: 1, padding: '28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
