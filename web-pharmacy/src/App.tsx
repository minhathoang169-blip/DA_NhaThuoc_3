import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PortalLayout } from './components/PortalLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { BatchManagementPage } from './pages/BatchManagementPage';
import { OrdersPage } from './pages/OrdersPage';
import { CatalogManagementPage } from './pages/CatalogManagementPage';

// Customer Storefront Pages
import { StorefrontLayout, CartItem } from './pages/storefront/StorefrontLayout';
import { StorefrontPage } from './pages/storefront/StorefrontPage';
import { OrderTrackingPage } from './pages/storefront/OrderTrackingPage';

/**
 * Smart Home Redirector based on user role:
 * - ADMIN -> /dashboard
 * - PHARMACIST -> /pos
 * - CUSTOMER -> /store
 */
function RoleBasedHomeRedirect() {
  const { user } = useAuth();

  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role === 'CUSTOMER') {
    return <Navigate to="/store" replace />;
  }

  return <Navigate to="/pos" replace />;
}

/**
 * If a CUSTOMER visits /customers, redirect them to /store (Customer Storefront)
 * instead of showing a 403 Forbidden error.
 */
function CustomersRouteGuard() {
  const { user } = useAuth();
  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/store" replace />;
  }
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
      <PortalLayout />
    </ProtectedRoute>
  );
}

/**
 * Guard for Customer Storefront:
 * Only CUSTOMER (or unauthenticated guest) uses the Customer Storefront (/store).
 * If ADMIN or PHARMACIST navigates to /store, redirect them to their internal portal.
 */
function StorefrontRouteGuard({
  cartCount,
  onOpenCart,
}: {
  cartCount: number;
  onOpenCart: () => void;
}) {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.role === 'PHARMACIST') {
    return <Navigate to="/pos" replace />;
  }
  return <StorefrontLayout cartCount={cartCount} onOpenCart={onOpenCart} />;
}

/**
 * Inner Router that resets cart state automatically per user session (keyed by username)
 */
function AppRoutes() {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Routes key={user?.username || 'guest'}>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Customer Online Storefront & Order Tracking Routes (Only for CUSTOMER / Guest) */}
      <Route
        element={
          <StorefrontRouteGuard
            cartCount={totalCartItems}
            onOpenCart={() => setIsCartOpen(true)}
          />
        }
      >
        <Route
          path="/store"
          element={
            <StorefrontPage
              cart={cart}
              setCart={setCart}
              isCartOpen={isCartOpen}
              setIsCartOpen={setIsCartOpen}
            />
          }
        />
        <Route path="/track-order" element={<OrderTrackingPage />} />
      </Route>

      {/* Special handling for /customers so CUSTOMER role goes to /store */}
      <Route element={<CustomersRouteGuard />}>
        <Route path="/customers" element={<CatalogManagementPage />} />
      </Route>

      {/* Protected Enterprise Portal Routes (ADMIN & PHARMACIST) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard (Accessible to ADMIN and PHARMACIST) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Operations (Accessible to both ADMIN and PHARMACIST) */}
        <Route path="/pos" element={<PosPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/batches" element={<BatchManagementPage />} />
        <Route path="/medicines" element={<MedicinesPage />} />

        {/* Admin-only Catalog Management Routes */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CatalogManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CatalogManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Default index & Fallback Catch-all based on Role */}
      <Route index element={<RoleBasedHomeRedirect />} />
      <Route path="*" element={<RoleBasedHomeRedirect />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
