import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { QUERY_KEYS } from '../../services/queryClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const AdminDashboardPage: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: QUERY_KEYS.dashboardMetrics,
    queryFn: async () => {
      try {
        const res = await api.get('/v1/dashboard/metrics');
        return res.data;
      } catch {
        const res = await api.get('/dashboard/metrics');
        return res.data;
      }
    },
    refetchInterval: 10000,
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
          Tổng Quan Hoạt Động & Doanh Thu Nhà Thuốc
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Số liệu thống kê thời gian thực từ hoạt động bán hàng POS và đơn đặt trực tuyến Storefront.
        </p>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tổng Doanh Thu</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f766e', marginTop: 8 }}>
            {isLoading ? '...' : currency.format(metrics?.totalRevenue || 0)}
          </div>
          <div style={{ fontSize: 12, color: '#10b981', marginTop: 6, fontWeight: 600 }}>
            Doanh thu thực tế tích lũy
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tổng Đơn Hàng</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
            {isLoading ? '...' : `${metrics?.totalOrders || 0} đơn`}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Bao gồm POS & Online
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cảnh Báo Cận Hạn (&lt; 30 ngày)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626', marginTop: 8 }}>
            {isLoading ? '...' : `${metrics?.expiringBatchesCount || 0} lô`}
          </div>
          <Link to="/admin/alerts" style={{ fontSize: 12, color: '#dc2626', marginTop: 6, display: 'inline-block', fontWeight: 600, textDecoration: 'none' }}>
            Xem chi tiết cảnh báo →
          </Link>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Thuốc Sắp Hết Tồn (&lt; 20)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginTop: 8 }}>
            {isLoading ? '...' : `${metrics?.lowStockCount || 0} loại`}
          </div>
          <Link to="/admin/products" style={{ fontSize: 12, color: '#d97706', marginTop: 6, display: 'inline-block', fontWeight: 600, textDecoration: 'none' }}>
            Kiểm tra kho ngay →
          </Link>
        </div>
      </div>

      {/* 7-Day Revenue Table / Chart representation */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
          Doanh Thu 7 Ngày Gần Nhất
        </h2>

        {metrics?.revenueChart && metrics.revenueChart.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metrics.revenueChart.length}, 1fr)`, gap: 12, alignItems: 'flex-end', height: 180, padding: '20px 0 10px', borderBottom: '1px solid #e2e8f0' }}>
            {metrics.revenueChart.map((d: any) => {
              const maxRev = Math.max(...metrics.revenueChart.map((item: any) => item.revenue), 100000);
              const heightPercent = Math.max(12, Math.round((d.revenue / maxRev) * 100));

              return (
                <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e', marginBottom: 6 }}>
                    {d.revenue > 0 ? currency.format(d.revenue) : '0đ'}
                  </div>
                  <div
                    style={{
                      width: '60%',
                      maxWidth: 48,
                      height: `${heightPercent}%`,
                      background: d.revenue > 0 ? 'linear-gradient(180deg, #14b8a6 0%, #0f766e 100%)' : '#e2e8f0',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, whiteSpace: 'nowrap' }}>
                    {d.date.substring(5)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontSize: 13 }}>Đang tải biểu đồ doanh thu...</p>
        )}
      </div>

      {/* Quick Action Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0f766e' }}>
            🛒 Bán Hàng Tại Quầy POS
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569' }}>
            Giao diện thu ngân quầy thuốc với tìm kiếm mã vạch, tự động trừ đa lô theo FEFO và in hóa đơn.
          </p>
          <Link
            to="/admin/pos"
            style={{
              background: '#0f766e',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Mở Quầy POS →
          </Link>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            📦 Xử Lý Đơn Hàng Storefront
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569' }}>
            Xem các đơn đặt trực tuyến của khách và cập nhật trạng thái giao hàng tức thì.
          </p>
          <Link
            to="/admin/orders"
            style={{
              background: '#1e293b',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Mở Danh Sách Đơn →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
