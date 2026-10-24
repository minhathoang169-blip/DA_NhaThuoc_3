import React from 'react';
import { PosCheckoutPanel } from '../../components/PosCheckoutPanel';
import { useAuth } from '../../context/AuthContext';
import { invalidateMedicinesCache, invalidateOrdersCache } from '../../services/queryClient';

export const AdminPosPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
          Quầy Bán Hàng Tại Chỗ (Web POS)
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Thu ngân: <strong>{user?.fullName || user?.username}</strong> ({user?.role}) | Áp dụng thuật toán phân bổ đa lô FEFO tự động
        </p>
      </div>

      <PosCheckoutPanel
        pharmacistId={user?.userId || 1}
        onCheckoutSuccess={() => {
          invalidateMedicinesCache();
          invalidateOrdersCache();
        }}
      />
    </div>
  );
};

export default AdminPosPage;
