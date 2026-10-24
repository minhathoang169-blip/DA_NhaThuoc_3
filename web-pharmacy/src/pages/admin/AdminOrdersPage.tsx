import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { QUERY_KEYS, invalidateOrdersCache } from '../../services/queryClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const AdminOrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 1. Fetch danh sách đơn hàng online với Polling mỗi 5s
  const { data: orders = [], isLoading, isFetching } = useQuery({
    queryKey: QUERY_KEYS.adminOrders,
    queryFn: async () => {
      const res = await api.get('/v1/orders');
      return res.data;
    },
    refetchInterval: 5000, // Live Polling: Nhận đơn mới từ Storefront ngay lập tức
  });

  // 2. Mutation Cập nhật trạng thái đơn hàng
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return (await api.put(`/v1/orders/${orderId}/status`, { status })).data;
    },
    onSuccess: (updated) => {
      invalidateOrdersCache();
      alert(`Đã cập nhật đơn hàng ${updated.orderNumber} sang trạng thái: ${updated.status}. Khách tra cứu sẽ thấy ngay.`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn hàng');
    },
  });

  const filteredOrders = orders.filter((o: any) => {
    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>⏳ Chờ duyệt</span>;
      case 'CONFIRMED':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>📋 Đã xác nhận</span>;
      case 'SHIPPING':
        return <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>🚚 Đang giao</span>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>✅ Đã giao</span>;
      case 'CANCELLED':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>❌ Đã hủy</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Quản Lý Đơn Hàng Online (Storefront)
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Tự động cập nhật đơn mới từ Storefront qua cơ chế Live Polling (5s). Thay đổi trạng thái tại đây sẽ đồng bộ tức thì sang trang Tra cứu của khách.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: '#ecfdf5', color: '#047857', padding: '6px 12px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>{isFetching ? 'Đang kiểm tra đơn mới...' : 'Polling hoạt động (5s)'}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'Tất cả đơn' },
          { key: 'PENDING', label: 'Chờ xác nhận' },
          { key: 'CONFIRMED', label: 'Đã xác nhận' },
          { key: 'SHIPPING', label: 'Đang giao' },
          { key: 'DELIVERED', label: 'Đã giao' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: filterStatus === tab.key ? '1px solid #0f766e' : '1px solid #cbd5e1',
              background: filterStatus === tab.key ? '#0f766e' : '#fff',
              color: filterStatus === tab.key ? '#fff' : '#475569',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
            <tr>
              <th style={{ padding: '14px 18px' }}>Mã Đơn</th>
              <th style={{ padding: '14px 18px' }}>Người Nhận & SĐT</th>
              <th style={{ padding: '14px 18px' }}>Địa Chỉ Nhận</th>
              <th style={{ padding: '14px 18px' }}>Tổng Tiền</th>
              <th style={{ padding: '14px 18px' }}>Ngày Đặt</th>
              <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Cập Nhật Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Đang nạp danh sách đơn hàng...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Chưa có đơn hàng nào trong mục này. Khách đặt tại Storefront sẽ hiển thị ngay tại đây.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o: any) => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f766e' }}>
                    <code>{o.orderNumber}</code>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{o.receiverName}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>📞 {o.receiverPhone}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {o.shippingAddress}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f766e' }}>
                    {currency.format(o.totalAmount)}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>
                    {o.orderDate?.replace('T', ' ').substring(0, 16)}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {getStatusBadge(o.status)}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <select
                      value={o.status}
                      disabled={updateStatusMutation.isPending}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          orderId: o.id,
                          status: e.target.value,
                        })
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        fontWeight: 600,
                        background: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CONFIRMED">Đã xác nhận</option>
                      <option value="SHIPPING">Đang giao hàng</option>
                      <option value="DELIVERED">Đã giao thành công</option>
                      <option value="COMPLETED">Hoàn tất</option>
                      <option value="CANCELLED">Hủy đơn</option>
                    </select>
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

export default AdminOrdersPage;
