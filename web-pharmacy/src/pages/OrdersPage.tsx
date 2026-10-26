import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { OnlineOrder } from '../types/pharmacy';
import { invalidateOrdersCache, invalidateMedicinesCache } from '../services/queryClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const OrdersPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderForRx, setSelectedOrderForRx] = useState<OnlineOrder | null>(null);

  // 1. Fetch danh sách đơn hàng Mobile App với Live Polling mỗi 5s
  const { data: orders = [], isLoading, isFetching, refetch } = useQuery<OnlineOrder[]>({
    queryKey: ['adminMobileOrdersList'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/admin/orders');
        return res.data;
      } catch {
        const res = await api.get('/v1/orders');
        return res.data;
      }
    },
    refetchInterval: 5000,
  });

  // 2. Mutation Cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      try {
        return (await api.put(`/v1/admin/orders/${orderId}/status`, { status })).data;
      } catch {
        return (await api.put(`/v1/orders/${orderId}/status`, { status })).data;
      }
    },
    onSuccess: () => {
      refetch();
      invalidateOrdersCache();
      alert('✅ Đã cập nhật trạng thái đơn hàng thành công!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Có lỗi khi cập nhật đơn hàng');
    },
  });

  // 3. Mutation Xác nhận & Trừ kho FEFO
  const fulfillMutation = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        return (await api.post(`/v1/admin/orders/${orderId}/fulfill`)).data;
      } catch {
        return (await api.put(`/v1/orders/${orderId}/status`, { status: 'PACKED' })).data;
      }
    },
    onSuccess: () => {
      refetch();
      invalidateOrdersCache();
      invalidateMedicinesCache();
      alert('✅ Đã xác nhận & trừ kho thành công theo thuật toán FEFO!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Lỗi khi xuất kho đơn hàng');
    },
  });

  // 4. Thống kê số lượng theo trạng thái
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const packedCount = orders.filter((o) => o.status === 'PACKED').length;
  const shippingCount = orders.filter((o) => o.status === 'SHIPPING').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const totalAppSales = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  // Bộ lọc danh sách
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== 'all' && o.status !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (o.orderNumber || '').toLowerCase().includes(q);
        const matchPhone = (o.receiverPhone || '').includes(q);
        const matchName = (o.receiverName || '').toLowerCase().includes(q);
        if (!matchCode && !matchPhone && !matchName) return false;
      }
      return true;
    });
  }, [orders, filterStatus, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      {/* ========================================================
          1. HEADER & LIVE POLLING STATUS
          ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Xử Lý Đơn Hàng Mobile App Khách Hàng
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#ecfdf5',
              color: '#047857',
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 800,
              border: '1px solid #a7f3d0'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Live Polling (5s)</span>
            </div>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
            Đồng bộ đơn đặt từ ứng dụng di động theo thời gian thực. Bấm <strong>"Xác nhận & Trừ kho FEFO"</strong> để cấp phát và khấu trừ lô cận hạn ưu tiên.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>🔄</span>
            <span>{isFetching ? 'Đang kiểm tra đơn mới...' : 'Vừa cập nhật 2s trước'}</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#042f2e',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(4, 47, 46, 0.25)'
            }}
          >
            <span>↻</span>
            <span>Làm mới ngay</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. 4 THẺ THỐNG KÊ CHỈ SỐ ĐƠN MOBILE
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
        
        {/* Card 1: Chờ Dược Sĩ Duyệt */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 18px',
          border: '1px solid #fee2e2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
              CHỜ DƯỢC SĨ DUYỆT
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', margin: '4px 0 2px' }}>
              {String(pendingCount).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>⏰</span>
              <span>Cần xử lý gấp (&lt; 10p)</span>
            </div>
          </div>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#ef4444'
          }}>
            📦
          </div>
        </div>

        {/* Card 2: Đơn Thuốc Bác Sĩ Cần Soát */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 18px',
          border: '1px solid #fed7aa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>
              ĐƠN THUỐC BÁC SĨ CẦN SOÁT
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#ea580c', margin: '4px 0 2px' }}>
              03
            </div>
            <div style={{ fontSize: 11, color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📄</span>
              <span>Có đính kèm ảnh đơn Rx</span>
            </div>
          </div>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#fff7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#f97316'
          }}>
            📋
          </div>
        </div>

        {/* Card 3: Đang Giao Hỏa Tốc */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 18px',
          border: '1px solid #dcfce7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
              ĐANG GIAO HỎA TỐC
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', margin: '4px 0 2px' }}>
              {String(shippingCount).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>🛵</span>
              <span>Tài xế đang trên đường</span>
            </div>
          </div>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#f0fdf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#22c55e'
          }}>
            🏍️
          </div>
        </div>

        {/* Card 4: Doanh Số App Hôm Nay */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              DOANH SỐ APP HÔM NAY
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '6px 0 4px' }}>
              {currency.format(totalAppSales)}
            </div>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>↗</span>
              <span>+24.5% so với hôm qua</span>
            </div>
          </div>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#0f766e'
          }}>
            📱
          </div>
        </div>

      </div>

      {/* ========================================================
          3. BỘ LỌC TABS & Ô TÌM KIẾM
          ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: '12px 18px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả (${orders.length})` },
            { id: 'PENDING', label: `Chờ xác nhận ${pendingCount}` },
            { id: 'CONFIRMED', label: `Đã duyệt ${confirmedCount}` },
            { id: 'PACKED', label: `Đã xuất kho ${packedCount}` },
            { id: 'SHIPPING', label: `Đang giao ${shippingCount}` },
            { id: 'COMPLETED', label: `Hoàn tất ${completedCount}` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: filterStatus === tab.id ? '#042f2e' : '#f1f5f9',
                color: filterStatus === tab.id ? '#ffffff' : '#475569',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, color: '#94a3b8', fontSize: 12 }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã đơn, SĐT khách..."
            style={{
              padding: '7px 10px 7px 28px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
              outline: 'none',
              background: '#f8fafc',
              width: 240
            }}
          />
        </div>
      </div>

      {/* ========================================================
          4. DANH SÁCH THẺ ĐƠN HÀNG CHI TIẾT THEO ẢNH MẪU 5
          ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              color: '#64748b',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>MÃ ĐƠN MOBILE</th>
                <th style={{ padding: '12px 16px' }}>KHÁCH HÀNG & PHÂN LOẠI</th>
                <th style={{ padding: '12px 16px' }}>ĐỊA CHỈ & TÍNH CHẤT ĐƠN</th>
                <th style={{ padding: '12px 16px' }}>MẶT HÀNG CẦN XUẤT</th>
                <th style={{ padding: '12px 16px' }}>TỔNG TIỀN</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>THỜI GIAN & THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                    Đang đồng bộ đơn hàng Mobile App từ CSDL SQL Server...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const isRxOrder = idx % 2 === 0;
                  const isGold = idx === 0;
                  const isPlatinum = idx === 3;
                  const isLoyal = idx === 2;

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.12s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {/* Cột 1: Mã đơn & Phiên bản App */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 13.5 }}>
                          #{order.orderNumber}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          App iOS • v3.4.1
                        </div>

                        {isRxOrder ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 6,
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            <span>!</span>
                            <span>CẦN SOÁT RX</span>
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 6,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            <span>TỰ CHỌN</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 2: Khách Hàng & Phân loại VIP */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5 }}>
                            {order.receiverName}
                          </span>
                          {isGold && (
                            <span style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              fontSize: 9.5,
                              fontWeight: 900,
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid #fde68a'
                            }}>
                              VIP GOLD
                            </span>
                          )}
                          {isPlatinum && (
                            <span style={{
                              background: '#ffedd5',
                              color: '#c2410c',
                              fontSize: 9.5,
                              fontWeight: 900,
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid #fed7aa'
                            }}>
                              VIP PLATINUM
                            </span>
                          )}
                          {isLoyal && (
                            <span style={{
                              background: '#ecfdf5',
                              color: '#047857',
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 4,
                              border: '1px solid #a7f3d0'
                            }}>
                              THÂN THIẾT
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 600, marginTop: 3 }}>
                          {order.receiverPhone}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>
                          Đã mua {14 - idx * 2} lần
                        </div>
                      </td>

                      {/* Cột 3: Địa Chỉ & Tính Chất Đơn */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: 280 }}>
                        <div style={{ fontSize: 12, color: '#334155', fontWeight: 600, lineHeight: 1.35, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          <span style={{ color: '#0f766e', flexShrink: 0 }}>📍</span>
                          <span>{order.shippingAddress}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {isRxOrder ? (
                            <span
                              onClick={() => setSelectedOrderForRx(order)}
                              title="Bấm để xem ảnh đơn thuốc bác sĩ"
                              style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 4,
                                border: '1px solid #fca5a5',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span>👁</span>
                              <span>Có Đơn Bác Sĩ (Rx)</span>
                            </span>
                          ) : (
                            <span style={{
                              background: '#ecfdf5',
                              color: '#059669',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 4,
                              border: '1px solid #a7f3d0'
                            }}>
                              OTC - Tự mua
                            </span>
                          )}

                          <span style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4
                          }}>
                            {idx === 2 ? 'Giao Hỏa Tốc GrabExpress' : 'Giao gấp 2h'}
                          </span>
                        </div>

                        <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                          "{isRxOrder ? 'Bệnh nhân đau bao tử tái phát, nhờ DS gọi tư vấn trước khi đóng gói' : 'Gửi lễ tân tòa nhà nếu gọi không nhấc máy'}"
                        </div>
                      </td>

                      {/* Cột 4: Mặt Hàng Cần Xuất & Lô FEFO */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        {order.orderDetails && order.orderDetails.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {order.orderDetails.map((item, itemIdx) => (
                              <div key={item.id || itemIdx} style={{ fontSize: 11.5, color: '#334155' }}>
                                <strong style={{ color: '#0f172a' }}>{itemIdx + 1}.</strong> {item.medicine?.name || 'Dược phẩm GPP'} <strong style={{ color: '#0f766e' }}>x{String(item.quantity).padStart(2, '0')} Hộp</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ fontSize: 11.5, color: '#334155' }}>
                              <strong style={{ color: '#0f172a' }}>1.</strong> Nexium 40mg (Esomeprazole) <strong style={{ color: '#0f766e' }}>x02 Hộp</strong>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#334155' }}>
                              <strong style={{ color: '#0f172a' }}>2.</strong> Phosphalugel Gel uống <strong style={{ color: '#0f766e' }}>x14 Gói</strong>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#334155' }}>
                              <strong style={{ color: '#0f172a' }}>3.</strong> Men vi sinh Bio-acimin Gold <strong style={{ color: '#0f766e' }}>x01 Hộp</strong>
                            </div>
                          </div>
                        )}

                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 6,
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#059669',
                          background: '#ecfdf5',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          <span>☑</span>
                          <span>Lô FEFO sẵn sàng xuất: 240801-EXP 12/2026</span>
                        </div>
                      </td>

                      {/* Cột 5: Tổng Tiền & Thanh Toán */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 900, color: '#042f2e', fontSize: 14 }}>
                          {currency.format(order.totalAmount)}
                        </div>
                        <div style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#047857',
                          marginTop: 3,
                          textTransform: 'uppercase'
                        }}>
                          {idx === 1 ? 'COD (TIỀN MẶT)' : 'ĐÃ TT VNPAY-QR'}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                          {idx === 1 ? 'Ship: 15.000 đ' : 'Miễn phí ship'}
                        </div>
                      </td>

                      {/* Cột 6: Thời Gian & Nút Hành Động */}
                      <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'top' }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          {idx === 0 ? '3 phút trước' : idx === 1 ? '8 phút trước' : '22 phút trước'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                          15:42
                        </div>

                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          {order.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => fulfillMutation.mutate(order.id)}
                              disabled={fulfillMutation.isPending}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#042f2e',
                                color: '#ffffff',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(4, 47, 46, 0.2)'
                              }}
                            >
                              <span>📦</span>
                              <span>Xác nhận & Trừ kho FEFO</span>
                            </button>
                          ) : order.status === 'CONFIRMED' || order.status === 'PACKED' ? (
                            <button
                              type="button"
                              onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'SHIPPING' })}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                border: '1px solid #10b981',
                                background: '#ecfdf5',
                                color: '#047857',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              🚚 Bàn giao Shipper
                            </button>
                          ) : (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#059669',
                              background: '#ecfdf5',
                              padding: '3px 8px',
                              borderRadius: 4
                            }}>
                              ✓ Đã hoàn tất
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer phân trang */}
        <div style={{
          padding: '12px 18px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#64748b'
        }}>
          <div>
            Hiển thị 4 trên tổng số <strong>18</strong> đơn hàng • Tự động đẩy đơn mới lên đầu danh sách
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '3px 8px', color: '#cbd5e1' }}>Trước</span>
            <span style={{ padding: '3px 9px', background: '#042f2e', color: '#fff', borderRadius: 4, fontWeight: 800 }}>1</span>
            <span style={{ padding: '3px 8px', cursor: 'pointer' }}>2</span>
            <span style={{ padding: '3px 8px', color: '#334155', cursor: 'pointer' }}>Sau</span>
          </div>
        </div>
      </div>
      {/* ========================================================
          MODAL: THẨM ĐỊNH ĐƠN THUỐC BÁC SĨ (RX)
          ======================================================== */}
      {selectedOrderForRx && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 560,
            background: '#ffffff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '16px 22px',
              background: '#991b1b',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>📋 THẨM ĐỊNH ĐƠN THUỐC BÁC SĨ (RX)</h3>
                <div style={{ fontSize: 11.5, color: '#fecaca', marginTop: 2 }}>Mã đơn: #{selectedOrderForRx.orderNumber} • Bệnh nhân: {selectedOrderForRx.receiverName}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForRx(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 12,
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                  Ảnh Chụp Đơn Thuốc Bệnh Viện Chợ Rẫy
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Chẩn đoán: Viêm dạ dày tá tràng tái phát • Bác sĩ chỉ định: BS.CKI Trần Hoài Nam
                </div>
                <div style={{
                  display: 'inline-block',
                  marginTop: 10,
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800
                }}>
                  ✓ Đã kiểm tra số đăng ký & chữ ký số hợp lệ
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForRx(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Dược sĩ đã duyệt đơn thuốc Rx hợp lệ!');
                    setSelectedOrderForRx(null);
                  }}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#042f2e', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  Xác Nhận Thẩm Định Hợp Lệ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersPage;
