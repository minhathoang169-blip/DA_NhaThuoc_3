import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, UserAuth } from '../components/ProtectedRoute';

describe('ProtectedRoute Component RBAC & Authentication Tests', () => {
  const DummyDashboard = () => <div data-testid="dashboard-content">Trang Dược Sĩ POS</div>;
  const DummyLogin = () => <div data-testid="login-page">Trang Đăng Nhập</div>;

  const renderWithRouter = (currentUser: UserAuth | null, allowedRoles?: string[]) => {
    return render(
      <MemoryRouter initialEntries={['/pos']}>
        <Routes>
          <Route path="/login" element={<DummyLogin />} />
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={allowedRoles} currentUser={currentUser}>
                <DummyDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  test('1. Chặn và chuyển hướng sang /login khi chưa đăng nhập (không có token)', () => {
    // currentUser = null
    renderWithRouter(null, ['PHARMACIST', 'ADMIN']);

    // Kỳ vọng chuyển hướng sang trang login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
  });

  test('2. Hiển thị trang 403 Forbidden khi đăng nhập với sai Role (CUSTOMER cố vào POS)', () => {
    const customerUser: UserAuth = {
      token: 'jwt-mock-token-xyz',
      role: 'CUSTOMER',
      username: 'khachhang01',
    };

    renderWithRouter(customerUser, ['PHARMACIST', 'ADMIN']);

    // Kỳ vọng hiển thị màn hình 403
    expect(screen.getByTestId('forbidden-page')).toBeInTheDocument();
    expect(screen.getByText(/403 - Quyền truy cập bị từ chối/i)).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
  });

  test('3. Cho phép truy cập thành công khi đăng nhập đúng Role (PHARMACIST)', () => {
    const pharmacistUser: UserAuth = {
      token: 'jwt-valid-token-123',
      role: 'PHARMACIST',
      username: 'duocsi_nga',
    };

    renderWithRouter(pharmacistUser, ['PHARMACIST', 'ADMIN']);

    // Kỳ vọng render đúng nội dung được bảo vệ
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forbidden-page')).not.toBeInTheDocument();
  });

  test('4. Cho phép truy cập thành công khi đăng nhập với vai trò ADMIN', () => {
    const adminUser: UserAuth = {
      token: 'jwt-admin-token-789',
      role: 'ADMIN',
      username: 'admin_root',
    };

    renderWithRouter(adminUser, ['PHARMACIST', 'ADMIN']);

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
  });
});
