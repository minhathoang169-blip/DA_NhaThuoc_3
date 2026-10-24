import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/PortalLayout';

// Internal Management Portal Pages
import { LoginPage } from './pages/auth/LoginPage';
import { PosPage } from './pages/PosPage';
import { BatchManagementPage } from './pages/BatchManagementPage';
import { OrdersPage } from './pages/OrdersPage';
import { DashboardPage } from './pages/DashboardPage';
import { MedicinesPage } from './pages/MedicinesPage';

/**
 * Root Index Redirector:
 * - Chưa đăng nhập -> Chuyển hướng bắt buộc vào /login
 * - Dược sĩ (PHARMACIST) -> Chuyển hướng thẳng vào /pos (Trọng tâm bán lẻ)
 * - Quản lý (ADMIN) -> Chuyển hướng vào /dashboard (Báo cáo điều hành)
 */
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 44, height: 44, border: '4px solid #e2e8f0', borderTop: '4px solid #0f766e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Đang xác thực quyền truy cập hệ thống...</span>
      </div>
    );
  }

  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/pos" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Trang Đăng Nhập Duy Nhất Của Hệ Thống */}
            <Route path="/login" element={<LoginPage />} />

            {/* 2. Root Redirect theo Phân Quyền */}
            <Route path="/" element={<RootRedirect />} />

            {/* 3. Toàn bộ Portal Quản Trị & Vận Hành Nội Bộ */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              {/* Bán Hàng Tại Quầy (POS Screen) */}
              <Route path="/pos" element={<PosPage />} />

              {/* Quản Lý Danh Mục Thuốc & Hoạt Chất */}
              <Route path="/medicines" element={<MedicinesPage />} />

              {/* Quản Lý Lô, Nhập Kho & Cảnh Báo Hạn Dùng (FEFO) */}
              <Route path="/inventory" element={<BatchManagementPage />} />

              {/* Xử Lý Đơn Hàng Mobile App Khách Hàng */}
              <Route path="/orders" element={<OrdersPage />} />

              {/* Dashboard Báo Cáo Doanh Thu & Kho (CHỈ DÀNH CHO ADMIN) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 4. Tương Thích Ngược Với Đường Dẫn Cũ */}
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/pos" element={<Navigate to="/pos" replace />} />
            <Route path="/admin/products" element={<Navigate to="/medicines" replace />} />
            <Route path="/admin/orders" element={<Navigate to="/orders" replace />} />
            <Route path="/admin/alerts" element={<Navigate to="/inventory" replace />} />

            {/* 5. Mọi đường dẫn không hợp lệ đều chuyển về Root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
