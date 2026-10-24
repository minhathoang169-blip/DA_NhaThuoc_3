import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export interface CartItem {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  availableStock: number;
  category?: string;
}

export const StorefrontLayout: React.FC<{ cartCount?: number; onOpenCart?: () => void }> = ({
  cartCount = 0,
  onOpenCart,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Top Banner */}
      <div style={{ background: '#0f766e', color: '#ccfbf1', padding: '6px 20px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🏥 Hệ Thống Nhà Thuốc Chuẩn GPP - Cam Kết 100% Thuốc Chính Hãng</span>
        <span>📞 Dược Sĩ Tư Vấn 24/7: <strong>1800 6868</strong> (Miễn cước)</span>
      </div>

      {/* Main Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800 }}>
              +
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f766e', letterSpacing: '-0.02em', lineHeight: 1.1 }}>DƯỢC AN</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em' }}>NHÀ THUỐC TIÊU CHUẨN GPP</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link to="/" style={{ color: '#1e293b', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Danh Mục Thuốc
            </Link>
            <Link to="/track-order" style={{ color: '#0f766e', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              🔍 Tra Cứu Đơn Hàng
            </Link>
          </nav>

          {/* User Controls & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Shortcut for Admin / Pharmacist */}
            {user && (user.role === 'ADMIN' || user.role === 'PHARMACIST') && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ⚙️ Vào Trang Quản Trị ({user.role})
              </button>
            )}

            {/* Cart Button */}
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                style={{
                  background: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(15,118,110,0.2)',
                }}
              >
                <span>🛒 Giỏ Hàng</span>
                <span style={{ background: '#ffffff', color: '#0f766e', borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>
                  {cartCount}
                </span>
              </button>
            )}

            {/* Auth / Account state */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#334155' }}>
                  Chào, <strong>{user.fullName || user.username}</strong>
                </span>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                style={{
                  background: '#f1f5f9',
                  color: '#1e293b',
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid #cbd5e1',
                }}
              >
                Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Storefront Body */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: '#042f2e', color: '#99f6e4', padding: '40px 20px', marginTop: 40, borderTop: '3px solid #0d9488' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
          <div>
            <h3 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: 16 }}>DƯỢC AN PHARMACY</h3>
            <p style={{ fontSize: 13, color: '#ccfbf1', lineHeight: 1.6, margin: 0 }}>
              Hệ thống bán lẻ Dược phẩm đạt chuẩn GPP số 01/SYT. Cung cấp thuốc kê đơn, không kê đơn và thực phẩm chức năng chính hãng.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: 14 }}>Chính Sách & Cam Kết</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>✓ 100% Thuốc chính hãng, nguồn gốc rõ ràng</li>
              <li>✓ Kiểm soát hạn sử dụng minh bạch theo lô (FEFO)</li>
              <li>✓ Đổi trả trong 30 ngày nếu có lỗi bao bì</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#ffffff', margin: '0 0 12px', fontSize: 14 }}>Liên Hệ Hỗ Trợ</h4>
            <p style={{ fontSize: 13, margin: '0 0 6px' }}>📍 Địa chỉ: 128 Hai Bà Trưng, Phường Tân Định, TP. HCM</p>
            <p style={{ fontSize: 13, margin: '0 0 6px' }}>☎️ Tổng đài miễn phí: <strong>1800 6868</strong></p>
            <p style={{ fontSize: 13, margin: 0 }}>✉️ Email: contact@nhathuocduocan.vn</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StorefrontLayout;
