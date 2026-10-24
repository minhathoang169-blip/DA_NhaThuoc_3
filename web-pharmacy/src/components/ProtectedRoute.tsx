import React, { useContext } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export interface UserAuth {
  token: string | null;
  role: string | null;
  username?: string;
  fullName?: string;
}

export interface ProtectedRouteProps {
  allowedRoles?: string[];
  currentUser?: UserAuth | null;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  currentUser: propUser,
  children,
}) => {
  const auth = useContext(AuthContext);
  const contextUser: UserAuth | null = auth?.user || null;
  const isLoading = auth?.isLoading || false;
  const logoutFn = auth?.logout || (() => {});

  const effectiveUser = propUser !== undefined ? propUser : contextUser;
  const location = useLocation();

  if (isLoading && propUser === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTop: '4px solid #0f766e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Đang kiểm tra quyền bảo mật hệ thống...</p>
      </div>
    );
  }

  // 1. Chưa đăng nhập -> Điều hướng bắt buộc về /login
  if (!effectiveUser || !effectiveUser.token) {
    const redirectUrl = location.pathname !== '/login' ? `${location.pathname}${location.search}` : '/';
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  // 2. Đã đăng nhập nhưng không đủ quyền RBAC
  const userRole = effectiveUser.role ? effectiveUser.role.toUpperCase() : '';
  const hasAllowedRole = allowedRoles && allowedRoles.length > 0
    ? allowedRoles.map((r) => r.toUpperCase()).includes(userRole)
    : true;

  if (allowedRoles && allowedRoles.length > 0 && !hasAllowedRole) {
    const defaultHome = userRole === 'ADMIN' ? '/dashboard' : '/pos';

    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} data-testid="forbidden-page">
        <div style={{ maxWidth: 520, background: '#fff', borderRadius: 20, border: '1px solid #fee2e2', padding: 36, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(220, 38, 38, 0.08)' }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>🚫</div>
          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
            HTTP 403 FORBIDDEN
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '16px 0 8px' }}>
            403 - Quyền truy cập bị từ chối
          </h1>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Tài khoản của bạn (<strong>{effectiveUser.fullName || effectiveUser.username}</strong> - Vai trò: <strong style={{ color: '#dc2626' }}>{effectiveUser.role}</strong>) không có quyền truy cập vào chức năng này.
            <br />
            Chức năng yêu cầu quyền: <strong>{allowedRoles.join(' hoặc ')}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              to={defaultHome}
              style={{
                background: '#0f766e',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
              }}
            >
              Về Trang Nghiệp Vụ Của Bạn
            </Link>
            <button
              type="button"
              onClick={logoutFn}
              style={{
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '10px 18px',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Hợp lệ
  return <>{children}</>;
};

export default ProtectedRoute;
