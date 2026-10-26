import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import { QUERY_KEYS } from '../../services/queryClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const OrderTrackingPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCode = searchParams.get('code') || '';

  const [orderCode, setOrderCode] = useState(initialCode);
  const [submittedCode, setSubmittedCode] = useState(initialCode);

  // Polling mỗi 5s để cập nhật ngay khi Admin đổi trạng thái đơn
  const { data: order, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.orderTracking(submittedCode),
    queryFn: async () => {
      if (!submittedCode.trim()) return null;
      const res = await api.get(`/v1/orders/track/${encodeURIComponent(submittedCode.trim())}`);
      return res.data;
    },
    enabled: Boolean(submittedCode.trim()),
    refetchInterval: 5000, // Real-time Polling 5 giây
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedCode(orderCode.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>⏳ Chờ Xác Nhận</span>;
      case 'CONFIRMED':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>📋 Đã Xác Nhận Đơn</span>;
      case 'PACKED':
        return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>📦 Đã Đóng Gói FEFO</span>;
      case 'SHIPPING':
        return <span style={{ background: '#f3e8ff', color: '#7e22ce', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>🚚 Đang Giao Hàng</span>;
      case 'COMPLETED':
      case 'DELIVERED':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>✅ Giao Thành Công</span>;
      case 'CANCELLED':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>❌ Đã Hủy</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 13 }}>{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f766e', margin: '0 0 8px' }}>
          Tra Cứu Tiến Độ Đơn Hàng Thời Gian Thực
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
          Nhập mã đơn hàng bạn đã nhận (VD: <code>ORD-1001</code> hoặc <code>ONL-...</code>) để theo dõi trạng thái đóng gói và giao hàng.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            type="text"
            required
            placeholder="Nhập mã đơn hàng (VD: ORD-1001, ONL-...)"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: '1.5px solid #cbd5e1',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#0f766e',
              color: '#ffffff',
              border: 'none',
              padding: '0 24px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Tra Cứu Ngay
          </button>
        </form>

        {/* Quick Order Codes from Database */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Đơn hàng có sẵn trong CSDL:</span>
          {['ONL-20261026-153810-F9F6', 'MOB-2024-9975', 'MOB-2024-9981', 'MOB-2024-9980', 'MOB-2024-9978'].map((sampleCode) => (
            <button
              key={sampleCode}
              type="button"
              onClick={() => {
                setOrderCode(sampleCode);
                setSubmittedCode(sampleCode);
              }}
              style={{
                background: submittedCode === sampleCode ? '#0f766e' : '#f1f5f9',
                color: submittedCode === sampleCode ? '#ffffff' : '#0f766e',
                border: '1px solid #cbd5e1',
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {sampleCode}
            </button>
          ))}
        </div>

        {/* Live sync banner */}
        {submittedCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#0f766e', marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>Tự động đồng bộ thời gian thực mỗi 5 giây (Live polling enabled)</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
            Đang tìm kiếm thông tin đơn hàng...
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 16, borderRadius: 12, textAlign: 'center' }}>
            ⚠️ Không tìm thấy đơn hàng với mã: <strong>{submittedCode}</strong>. Vui lòng kiểm tra lại mã đã nhập.
          </div>
        )}

        {/* Order Details View */}
        {order && (
          <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Mã Đơn Hàng</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{order.orderNumber}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Ngày đặt: {order.orderDate}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Trạng thái hiện tại:</div>
                {getStatusBadge(order.status)}
              </div>
            </div>

            {/* Receiver Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Người nhận:</span>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.receiverName}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Số điện thoại:</span>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.receiverPhone}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#64748b' }}>Địa chỉ nhận thuốc:</span>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.shippingAddress}</div>
              </div>
            </div>

            {/* Order Items */}
            {order.orderDetails && order.orderDetails.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                  Danh Sách Thuốc Trong Đơn:
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {order.orderDetails.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <strong>{item.medicine?.name || item.medicine?.id}</strong>
                        {item.batch && (
                          <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>
                            (Lô: {item.batch.id} - Hạn: {item.batch.expiryDate})
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#0f766e', fontWeight: 700 }}>
                        {item.quantity} x {currency.format(item.price)} = {currency.format(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 14, color: '#64748b' }}>Tổng tiền đơn hàng:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#0f766e' }}>
                {currency.format(order.totalAmount)}
              </span>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/store" style={{ color: '#0f766e', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            ← Quay lại trang danh mục sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
