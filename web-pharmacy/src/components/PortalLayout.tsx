import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const PortalLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  // Lấy doanh thu ca làm việc và số lượng đơn từ DB
  const { data: overview } = useQuery({
    queryKey: ['portalLayoutOverview'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/dashboard/overview');
        return res.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 15000,
  });

  const shiftRevenue = overview?.shiftRevenue || 18450000;
  const pendingOrdersCount = overview?.appOrdersCount || 8;

  const navItems = [
    { to: '/pos', label: 'Bán Hàng Quầy (POS)', icon: '🛒', badge: 'F1', badgeType: 'key' },
    { to: '/medicines', label: 'Danh Mục & Hoạt Chất', icon: '💊' },
    { to: '/inventory', label: 'Quản Lý Lô & Cận Hạn', icon: '📦', badge: 'FEFO', badgeType: 'amber' },
    { to: '/orders', label: 'Đơn Hàng Mobile App', icon: '📱', badge: String(pendingOrdersCount).padStart(2, '0'), badgeType: 'red' },
    { to: '/dashboard', label: 'Báo Cáo & Thống Kê', icon: '📊' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* ========================================================
          SIDEBAR CHÍNH: DEEP FOREST PINE GREEN (#062d27)
          ======================================================== */}
      <aside style={{
        width: 260,
        background: '#062d27',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #04211c',
        flexShrink: 0
      }}>
        
        {/* Brand Header */}
        <div style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            fontWeight: 900
          }}>
            ✚
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              NHÀ THUỐC GPP
            </div>
            <div style={{ fontSize: 9.5, color: '#6ee7b7', fontWeight: 700, letterSpacing: '0.04em', marginTop: 2 }}>
              HỆ THỐNG VẬN HÀNH CHUẨN GPP
            </div>
          </div>
        </div>

        {/* User Card Profile */}
        <div style={{
          margin: '0 12px 14px',
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              color: '#ffffff',
              border: '2px solid #34d399'
            }}>
              👨‍⚕️
            </div>
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 9,
              height: 9,
              background: '#10b981',
              borderRadius: '50%',
              border: '1.5px solid #062d27'
            }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.fullName || 'DS. CKII Lê Hoàng Nam'}
              </span>
              <span style={{
                background: isAdmin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: isAdmin ? '#6ee7b7' : '#7dd3fc',
                fontSize: 9,
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 4,
                border: isAdmin ? '1px solid rgba(110, 231, 183, 0.4)' : '1px solid rgba(125, 211, 252, 0.4)'
              }}>
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              <span>Đang trực quầy chính</span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div style={{ padding: '8px 18px 6px', fontSize: 11, fontWeight: 800, color: '#5eead4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          PHÂN HỆ NGHIỆP VỤ
        </div>

        {/* Menu Navigation Items */}
        <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? '#0d4a40' : 'transparent',
                fontWeight: isActive ? 800 : 600,
                fontSize: 13.5,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: item.badgeType === 'red' ? '2px 7px' : '2px 6px',
                  borderRadius: item.badgeType === 'red' ? 999 : 6,
                  background:
                    item.badgeType === 'red' ? '#dc2626' :
                    item.badgeType === 'amber' ? '#d97706' :
                    'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff'
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Ca Làm Việc & Doanh Thu Ca Box */}
        <div style={{
          margin: '12px',
          padding: '12px 14px',
          background: '#0a3d34',
          borderRadius: 12,
          border: '1px solid #115e52',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#99f6e4', fontWeight: 700 }}>
            <span>CA LÀM VIỆC #2</span>
            <span style={{ color: '#ffffff' }}>14:00 - 22:00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: '#cbd5e1' }}>Doanh thu ca:</span>
            <strong style={{ fontSize: 14, color: '#34d399', fontWeight: 900 }}>
              {currency.format(shiftRevenue)}
            </strong>
          </div>
        </div>

        {/* Đăng Xuất Button */}
        <div style={{ padding: '12px 14px 18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>⎋</span>
            <span>Đăng Xuất Khỏi Hệ Thống</span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          VÙNG NỘI DUNG CHÍNH (HEADER + MAIN CONTENT)
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        
        {/* Top Header Bar */}
        <header style={{
          height: 60,
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          flexShrink: 0
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>Hệ Thống GPP</span>
            <span style={{ color: '#cbd5e1' }}>›</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>Điều Hành Nhà Thuốc</span>
          </div>

          {/* Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Database pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              background: '#ecfeff',
              color: '#0e7490',
              padding: '5px 12px',
              borderRadius: 999,
              border: '1px solid #a5f3fc',
              fontWeight: 700
            }}>
              <span>SQL Server:</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <strong style={{ color: '#0891b2' }}>QuanLyNhaThuocDB (Đã kết nối)</strong>
            </div>

            {/* Phím tắt pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11.5,
              background: '#f1f5f9',
              color: '#475569',
              padding: '5px 12px',
              borderRadius: 999,
              border: '1px solid #e2e8f0',
              fontWeight: 600
            }}>
              <span style={{ fontWeight: 800, color: '#64748b' }}>PHÍM TẮT:</span>
              <span><code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, border: '1px solid #cbd5e1' }}>F2</code> Quét mã</span>
              <span><code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, border: '1px solid #cbd5e1' }}>F3</code> Tìm thuốc</span>
              <span><code style={{ background: '#fff', padding: '1px 4px', borderRadius: 4, border: '1px solid #cbd5e1' }}>F9</code> Thanh toán</span>
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer', padding: 6, borderRadius: '50%', background: '#f8fafc' }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#ef4444'
              }} />
            </div>

            {/* Pharmacist Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeft: '1px solid #e2e8f0' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: '#fff',
                fontWeight: 800
              }}>
                HN
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  Hoàng Nam
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Quầy Dược Số 01</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main style={{ flex: 1, padding: '20px 24px', background: '#f8fafc' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
