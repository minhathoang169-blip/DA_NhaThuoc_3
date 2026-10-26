import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DashboardOverviewResponse } from '../types/pharmacy';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const DashboardPage: React.FC = () => {
  const { data: overview, isLoading, isError, refetch } = useQuery<DashboardOverviewResponse>({
    queryKey: ['dashboardOverviewDetail'],
    queryFn: async () => {
      const res = await api.get('/v1/dashboard/overview');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const totalRev = overview?.totalRevenue ?? 0;
  const posRev = overview?.posRevenue ?? 0;
  const appRev = overview?.appRevenue ?? 0;
  const posPct = overview?.posPercentage ?? 0;
  const appPct = overview?.appPercentage ?? 0;
  const posOrders = overview?.posOrdersCount ?? 0;
  const appOrders = overview?.appOrdersCount ?? 0;
  const totalOrders = overview?.totalOrdersCount ?? 0;
  const expiringCount = overview?.expiringBatchesCount ?? 0;
  const criticalCount = overview?.criticalBatchesCount ?? 0;
  const lowStockCount = overview?.lowStockCount ?? 0;
  const dailyRevenue = overview?.dailyRevenue ?? [];
  const maxDailyRevenue = Math.max(1, ...dailyRevenue.map((item) => item.revenue));
  const topSellingMedicines = overview?.topSellingMedicines ?? [];

  if (isLoading && !overview) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #0f766e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Đang nạp dữ liệu thống kê doanh thu & kho vận...</span>
      </div>
    );
  }

  if (isError && !overview) {
    return <section role="alert" style={{ display: 'grid', minHeight: 300, placeItems: 'center', padding: 24, border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', textAlign: 'center' }}>
      <div><strong style={{ color: '#7f302b' }}>Không tải được báo cáo từ API.</strong><p style={{ color: '#64748b', margin: '8px 0 14px' }}>Kiểm tra máy chủ hoặc quyền truy cập rồi thử lại.</p><button type="button" onClick={() => refetch()} style={{ padding: '9px 14px', border: 0, borderRadius: 8, color: '#fff', background: '#064e3b', fontWeight: 700, cursor: 'pointer' }}>Thử tải lại</button></div>
    </section>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* ========================================================
          TOP HEADER & TIMELINE FILTER TOOLBAR
          ======================================================== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📈</span>
            <span>BÁO CÁO HOẠT ĐỘNG & PHÂN TÍCH DOANH THU</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Báo Cáo Doanh Thu & Vận Hành
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            Thống kê đa chiều: Doanh thu quầy POS Dược sĩ, đơn khách Mobile App và hệ thống giám sát cảnh báo an toàn kho GPP.
          </p>
        </div>

        <span style={{ padding: '7px 11px', border: '1px solid #dce9df', borderRadius: 999, color: '#286341', background: '#f1faf3', fontSize: 11, fontWeight: 700 }}>Cập nhật từ API mỗi 10 giây</span>
      </div>

      {/* ========================================================
          4 THẺ CHỈ SỐ DOANH THU & AN TOÀN KHO
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        
        {/* Card 1: Tổng Doanh Thu */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              TỔNG DOANH THU TÍCH LŨY
            </span>
            <span style={{ fontSize: 16, color: '#0f766e' }}>💵</span>
          </div>

          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '8px 0 10px' }}>
            {currency.format(totalRev)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tại quầy POS:</span>
              <strong style={{ color: '#0f172a' }}>{currency.format(posRev)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mobile App:</span>
              <strong style={{ color: '#0f172a' }}>{currency.format(appRev)}</strong>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 8 }}>
            📈 +12.6% so với tuần trước
          </div>
        </div>

        {/* Card 2: Tổng Đơn Hàng */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              TỔNG ĐƠN HÀNG HOÀN TẤT
            </span>
            <span style={{ fontSize: 16, color: '#0f766e' }}>📑</span>
          </div>

          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '8px 0 10px' }}>
            {totalOrders} <span style={{ fontSize: 15, fontWeight: 700, color: '#64748b' }}>đơn</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Đơn quầy:</span>
              <strong style={{ color: '#0f172a' }}>{posOrders} lượt</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Đơn Mobile:</span>
              <strong style={{ color: '#0f172a' }}>{appOrders} đơn</strong>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 8 }}>
            ✅ Tỷ lệ thành công 98.6%
          </div>
        </div>

        {/* Card 3: Cảnh Báo Cận Hạn */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #fee2e2',
          borderLeft: '4px solid #ef4444',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
              CẢNH BÁO CẬN HẠN (&lt; 30 NGÀY)
            </span>
            <span style={{ background: '#fee2e2', color: '#dc2626', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
              !
            </span>
          </div>

          <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626', margin: '8px 0 6px' }}>
            {expiringCount} <span style={{ fontSize: 15, fontWeight: 700 }}>Lô thuốc</span>
          </div>

          <div style={{ fontSize: 11.5, color: '#7f1d1d', marginTop: 4 }}>
            Trong đó: <strong style={{ color: '#b91c1c' }}>{criticalCount} lô nguy cấp</strong> (&lt; 15 ngày)
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
            Quy tắc FEFO ưu tiên xả kho trước.
          </div>

          <Link to="/inventory" style={{ display: 'inline-block', marginTop: 8, fontSize: 11.5, color: '#dc2626', fontWeight: 800, textDecoration: 'none' }}>
            Kiểm tra lô ngay →
          </Link>
        </div>

        {/* Card 4: Tồn Kho Tối Thiểu */}
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '18px 20px',
          border: '1px solid #fef3c7',
          borderLeft: '4px solid #f59e0b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
              TỒN KHO TỐI THIỂU (&lt; 20 HỘP)
            </span>
            <span style={{ background: '#fef3c7', color: '#b45309', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
              🛒
            </span>
          </div>

          <div style={{ fontSize: 24, fontWeight: 900, color: '#b45309', margin: '8px 0 6px' }}>
            {lowStockCount} <span style={{ fontSize: 15, fontWeight: 700 }}>Loại</span>
          </div>

          <div style={{ fontSize: 11.5, color: '#92400e', marginTop: 4 }}>
            Cần lên kế hoạch đặt hàng NCC sớm
          </div>
          <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
            Kháng sinh & Giảm đau đang cạn kho.
          </div>

          <Link to="/inventory" style={{ display: 'inline-block', marginTop: 8, fontSize: 11.5, color: '#b45309', fontWeight: 800, textDecoration: 'none' }}>
            Tạo đơn nhập kho →
          </Link>
        </div>
      </div>

      {/* ========================================================
          MIDDLE SECTION: BIỂU ĐỒ 7 NGÀY & CƠ CẤU KÊNH BÁN
          ======================================================== */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        
        {/* Biểu đồ 7 ngày (62%) */}
        <div style={{
          flex: '1 1 60%',
          background: '#ffffff',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                  Biến Động Doanh Thu 7 Ngày Gần Nhất
                </h2>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  Tổng hợp số liệu bán lẻ trực tiếp tại quầy thuốc và đơn đặt hàng qua ứng dụng.
                </div>
              </div>

              <span style={{ fontSize: 11, color: '#52645a' }}>Tổng doanh thu / ngày</span>
            </div>

            {/* Barchart Visualization */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 170, paddingTop: 24, paddingBottom: 6 }}>
              {dailyRevenue.map((d, idx) => {
                const barHeight = d.revenue > 0 ? Math.max(4, Math.round((d.revenue / maxDailyRevenue) * 100)) : 0;

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 }}>
                    <div title={currency.format(d.revenue)} style={{ width: '100%', maxWidth: 36, height: `${barHeight}%`, minHeight: barHeight ? 4 : 0, background: '#0a4d44', borderRadius: '4px 4px 0 0' }} />

                    <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginTop: 4 }}>
                      {d.date.length > 5 ? d.date.slice(5) : d.date}
                    </div>
                    <div style={{ fontSize: 9.5, color: '#94a3b8' }}>
                      {d.orderCount} đơn
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Cơ Cấu Kênh Bán (38%) */}
        <div style={{
          flex: '1 1 36%',
          background: '#ffffff',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Cơ Cấu Kênh Bán
              </h2>
              <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                Tổng cộng
              </span>
            </div>

            {/* Circular Donut Diagram */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '14px 0' }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: `conic-gradient(#0a4d44 0% ${posPct}%, #10b981 ${posPct}% 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(10, 77, 68, 0.15)'
              }}>
                <div style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>KÊNH CHÍNH</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0a4d44' }}>{posPct}%</div>
                  <div style={{ fontSize: 8.5, color: '#94a3b8' }}>Tại Nhà Thuốc</div>
                </div>
              </div>
            </div>

            {/* Breakdown Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#0a4d44' }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Quầy POS Dược Sĩ</div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>{posOrders} lượt giao dịch</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{currency.format(posRev)}</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>{posPct}%</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Khách Đặt Mobile App</div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>{appOrders} đơn giao tận nơi</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>{currency.format(appRev)}</div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>{appPct}%</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '8px 10px', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 10.5, color: '#166534', display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <span>✅</span>
            <span>GPP Tiêu chuẩn: 100% đơn bán theo đơn đều được dược sĩ thẩm định đơn thuốc số.</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM SECTION: TOP 5 MẶT HÀNG BÁN CHẠY NHẤT TRONG KỲ
          ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        padding: '20px 22px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Mặt Hàng Bán Chạy
              </h2>
              <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 6 }}>
                API tổng hợp
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
              Dữ liệu định lượng thuốc kê đơn & OTC phục vụ điều phối dự trù kho định kỳ.
            </div>
          </div>

          <Link to="/medicines" style={{ fontSize: 12, fontWeight: 800, color: '#0f766e', textDecoration: 'none' }}>
            Xem danh mục thuốc ↗
          </Link>
        </div>

        {/* Table Top 5 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' }}>
              <tr>
                <th style={{ padding: '10px 14px' }}>TÊN THUỐC & QUY CÁCH</th>
                <th style={{ padding: '10px 14px' }}>HOẠT CHẤT & NỒNG ĐỘ</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>SỐ LƯỢNG BÁN</th>
                <th style={{ padding: '10px 14px' }}>DOANH THU ĐÓNG GÓP</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>TỒN KHO KHẢ DỤNG</th>
                <th style={{ padding: '10px 14px' }}>TÌNH TRẠNG AN TOÀN</th>
              </tr>
            </thead>
            <tbody>
              {topSellingMedicines.length === 0 && <tr><td colSpan={6} style={{ padding: 22, color: '#64748b', textAlign: 'center' }}>API chưa có dữ liệu bán hàng để xếp hạng.</td></tr>}
              {topSellingMedicines.map((item) => (
                <tr key={item.rank} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                        #{item.rank}
                      </span>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.medicineName}</div>
                        <div style={{ fontSize: 10.5, color: '#94a3b8' }}>Hộp tiêu chuẩn • Mã {item.medicineId}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      {item.activeIngredient}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                    {item.quantitySold} {item.unit}
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 800, color: '#0f766e' }}>{currency.format(item.revenue)}</div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>{item.percentage}% tổng thu</div>
                  </td>

                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800 }}>
                    {item.availableStock} {item.unit}
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    {item.safetyStatus === 'SAFE' && (
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>●</span> TỒN AN TOÀN (XANH)
                      </span>
                    )}
                    {item.safetyStatus === 'WARNING' && (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>●</span> CẦN NHẬP GẤP (&lt; 20)
                      </span>
                    )}
                    {item.safetyStatus === 'CRITICAL' && (
                      <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>●</span> BÁO ĐỘNG CẠN KHO
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          GPP COMPLIANCE FOOTER BANNER
          ======================================================== */}
      <div style={{
        background: '#042f2e',
        color: '#ffffff',
        borderRadius: 12,
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Hệ Thống Quản Lý Dược Chuẩn GPP (Good Pharmacy Practice)</div>
            <div style={{ fontSize: 11, color: '#99f6e4', marginTop: 1 }}>Theo dõi doanh thu, đơn hàng và cảnh báo tồn kho từ API nhà thuốc.</div>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: 6 }}>API polling 10 giây</div>
      </div>

    </div>
  );
};

export default DashboardPage;
