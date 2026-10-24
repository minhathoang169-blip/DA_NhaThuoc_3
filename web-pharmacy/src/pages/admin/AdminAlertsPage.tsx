import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { QUERY_KEYS } from '../../services/queryClient';
import { ExpiringAlertBadge } from '../../components/ExpiringAlertBadge';

export const AdminAlertsPage: React.FC = () => {
  const [days, setDays] = useState(30);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.expiringBatches, days],
    queryFn: async () => {
      try {
        const res = await api.get(`/v1/inventory/expiring-batches?days=${days}`);
        return res.data;
      } catch {
        return [];
      }
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Hệ Thống Cảnh Báo Thuốc Cận Hạn (FEFO Alert)
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Kiểm soát nghiêm ngặt các lô thuốc sắp hết hạn để dược sĩ ưu tiên xuất kho hoặc làm thủ tục trả nhà cung cấp.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Khoảng thời gian cảnh báo:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600 }}
          >
            <option value={15}>15 ngày tới (Nguy cấp)</option>
            <option value={30}>30 ngày tới (Cảnh báo)</option>
            <option value={60}>60 ngày tới</option>
            <option value={90}>90 ngày tới</option>
          </select>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
            <tr>
              <th style={{ padding: '14px 18px' }}>Mã Lô</th>
              <th style={{ padding: '14px 18px' }}>Số Lô SX</th>
              <th style={{ padding: '14px 18px' }}>Tên Thuốc</th>
              <th style={{ padding: '14px 18px' }}>Tồn Lô Này</th>
              <th style={{ padding: '14px 18px' }}>Hạn Dùng</th>
              <th style={{ padding: '14px 18px' }}>Số Ngày Còn Lại</th>
              <th style={{ padding: '14px 18px' }}>Mức Độ Cảnh Báo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Đang quét kho lô thuốc cận hạn...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#16a34a' }}>
                  ✅ Tuyệt vời! Không có lô thuốc nào sắp hết hạn trong vòng {days} ngày tới.
                </td>
              </tr>
            ) : (
              batches.map((b: any) => (
                <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f766e' }}>
                    <code>{b.batchId}</code>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b' }}>
                    {b.batchNumber}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                    {b.medicineName} ({b.medicineId})
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                    {b.quantity} hộp
                  </td>
                  <td style={{ padding: '14px 18px', color: '#dc2626', fontWeight: 700 }}>
                    {b.expiryDate}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                    {b.daysRemaining} ngày
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <ExpiringAlertBadge daysRemaining={b.daysRemaining} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAlertsPage;
