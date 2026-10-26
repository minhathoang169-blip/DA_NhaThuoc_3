import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DashboardOverviewResponse,
  DashboardMetricsResponse,
  BatchInventoryDto,
  OnlineOrder,
} from '../types/pharmacy';
import { 
  TrendingUp, ShoppingBag, AlertOctagon, DollarSign, 
  ArrowUpRight, Clock, ShieldAlert, CheckCircle2, 
  CalendarClock, RefreshCw, Layers, Activity, Store, Smartphone, AlertTriangle
} from 'lucide-react';

interface DashboardCombinedData {
  shiftRevenue: number;
  todayAppRevenue: number;
  totalRevenue: number;
  totalCompletedOrders: number;
  expiringBatchesCount: number;
  totalBatchesCount: number;
  recentOrders: OnlineOrder[];
  fefoBatches: BatchInventoryDto[];
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Fetch Dashboard Overview + Batches + Orders from Backend
  const { data: overview, isLoading, isError, refetch } = useQuery<DashboardCombinedData>({
    queryKey: ['dashboard-overview', user?.role],
    queryFn: async () => {
      const [ordersRes, batchesRes] = await Promise.all([
        api.get<OnlineOrder[]>('/v1/orders'),
        api.get<BatchInventoryDto[]>('/v1/inventory/batches?status=all'),
      ]);

      const ordersList = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const batchesList = Array.isArray(batchesRes.data) ? batchesRes.data : [];

      // Sort all batches by daysRemaining ascending (FEFO: First-Expired, First-Out)
      const sortedFefoBatches = [...batchesList].sort(
        (a, b) => Number(a.daysRemaining ?? 0) - Number(b.daysRemaining ?? 0)
      );

      // Count batches needing attention (<= 90 days or expired)
      const expiringUnder90Count = sortedFefoBatches.filter(
        (b) => Number(b.daysRemaining ?? 0) <= 90
      ).length;

      if (isAdmin) {
        const ovRes = await api.get<DashboardOverviewResponse>('/v1/dashboard/overview');
        const ov = ovRes.data;
        return {
          shiftRevenue: Number(ov.shiftRevenue ?? 0),
          todayAppRevenue: Number(ov.todayAppRevenue ?? 0),
          totalRevenue: Number(ov.totalRevenue ?? 0),
          totalCompletedOrders: Number(ov.totalOrdersCount ?? ordersList.length),
          expiringBatchesCount: Math.max(Number(ov.expiringBatchesCount ?? 0), expiringUnder90Count),
          totalBatchesCount: sortedFefoBatches.length,
          recentOrders: ordersList.slice(0, 6),
          fefoBatches: sortedFefoBatches.slice(0, 10),
        };
      }

      // Fallback for PHARMACIST role
      const metricsRes = await api.get<DashboardMetricsResponse>('/v1/dashboard/metrics');
      const m = metricsRes.data;
      return {
        shiftRevenue: Number(m.todayRevenue ?? 0),
        todayAppRevenue: 0,
        totalRevenue: Number(m.totalRevenue ?? 0),
        totalCompletedOrders: Number(m.totalOrders ?? ordersList.length),
        expiringBatchesCount: Math.max(Number(m.expiringBatchesCount ?? 0), expiringUnder90Count),
        totalBatchesCount: sortedFefoBatches.length,
        recentOrders: ordersList.slice(0, 6),
        fefoBatches: sortedFefoBatches.slice(0, 10),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Không thể tải dữ liệu Bảng Điều Khiển</h3>
        <p className="text-xs text-slate-500 mt-1">Vui lòng kiểm tra kết nối tới máy chủ Spring Boot</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Top Executive Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Hệ thống Quản Lý Nhà Thuốc — Cơ sở dữ liệu SQL Server (QuanLyNhaThuocDB)
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Tổng Quan Điều Hành & Kiểm Soát Tồn Kho FEFO
          </h1>
          <p className="text-xs text-slate-300">
            Số liệu thống kê trực tiếp từ các bảng <code className="font-mono">invoices</code>, <code className="font-mono">online_orders</code>, <code className="font-mono">SanPham</code> và <code className="font-mono">LoThuoc</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Cập nhật số liệu
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            Mở Quầy Thu Ngân POS
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid (100% Real Data from Backend) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Tổng Doanh Thu Hệ Thống</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {Number(overview.totalRevenue || 0).toLocaleString('vi-VN')} ₫
            </p>
            <p className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Tổng hợp hóa đơn POS + Đơn Online hoàn tất
            </p>
          </div>
        </div>

        {/* KPI 2: Today Shift POS Revenue & Online Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Doanh Thu Trong Ngày</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-emerald-600" /> Tại quầy POS:
              </span>
              <strong className="text-slate-900 font-black">
                {Number(overview.shiftRevenue || 0).toLocaleString('vi-VN')} ₫
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Đơn Online:
              </span>
              <strong className="text-indigo-600 font-black">
                {Number(overview.todayAppRevenue || 0).toLocaleString('vi-VN')} ₫
              </strong>
            </div>
          </div>
        </div>

        {/* KPI 3: Completed Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Tổng Số Đơn Giao Dịch</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {overview.totalCompletedOrders} <span className="text-xs font-semibold text-slate-500">đơn</span>
            </p>
            <p className="text-[11px] font-bold text-indigo-600 mt-1">
              Đếm trực tiếp từ bảng invoices & online_orders
            </p>
          </div>
        </div>

        {/* KPI 4: Expiring / Active Batches Alert */}
        <div 
          onClick={() => navigate('/batches')}
          className="bg-rose-50/70 hover:bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700">Theo Dõi Lô Thuốc (LoThuoc)</span>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-700">
              {overview.expiringBatchesCount} <span className="text-xs font-semibold text-rose-600">lô cận hạn (&le; 90 ngày) / {overview.totalBatchesCount} lô</span>
            </p>
            <p className="text-[11px] font-bold text-rose-600 mt-1 underline">
              Bấm để kiểm tra chi tiết bảng LoThuoc →
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: All Batches FEFO Watchlist sorted by nearest expiry (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Danh Sách Lô Thuốc & Hạn Dùng FEFO (Bảng LoThuoc)
                </h2>
                <p className="text-xs text-slate-500">
                  Sắp xếp theo thứ tự ưu tiên xuất kho FEFO (Lô có hạn sử dụng gần nhất xếp trên cùng)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/batches')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Xem toàn bộ kho ({overview.totalBatchesCount}) →
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">Mã Lô / Số Lô</th>
                  <th className="py-3 px-4">Sản Phẩm Thuốc</th>
                  <th className="py-3 px-4">Hạn Dùng</th>
                  <th className="py-3 px-4 text-center">Tồn Kho</th>
                  <th className="py-3 px-4">Trạng Thái FEFO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(overview.fefoBatches || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Chưa có lô thuốc nào trong bảng LoThuoc.
                    </td>
                  </tr>
                ) : (
                  overview.fefoBatches.map((b) => {
                    const days = Number(b.daysRemaining ?? 0);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {b.id} ({b.batchNumber})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{b.medicineName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{b.medicineId} • {b.category}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div className="flex items-center gap-1 font-bold">
                            <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                            {b.expiryDate}
                          </div>
                          <span className={`text-[10px] font-bold ${
                            days <= 15 ? 'text-rose-600' : days <= 90 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {days < 0 ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">
                          {Number(b.quantity ?? 0).toLocaleString('vi-VN')} đv
                        </td>
                        <td className="py-3 px-4">
                          {days < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold text-[10px]">
                              Quá hạn (Đã khóa)
                            </span>
                          ) : days <= 15 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px]">
                              <AlertOctagon className="w-3 h-3" /> Khẩn cấp &le; 15d (Khóa)
                            </span>
                          ) : days <= 90 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> Cận hạn &le; 90d (Ưu tiên FEFO)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> An toàn (&gt; 90 ngày)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Online Orders Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Đơn Đặt Hàng Online Gần Đây (online_orders)
                </h2>
                <p className="text-xs text-slate-500">Các đơn hàng mới nhất trong hệ thống</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Điều phối đơn →
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {(overview.recentOrders || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Chưa có đơn đặt hàng Online nào.</div>
            ) : (
              overview.recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">#{ord.orderNumber}</span>
                      <span className="text-xs font-bold text-slate-800">{ord.receiverName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[230px] mt-0.5">
                      {ord.shippingAddress}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">
                      {Number(ord.totalAmount || 0).toLocaleString('vi-VN')} ₫
                    </p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 ${
                      ord.status === 'PENDING' ? 'text-amber-600' :
                      ord.status === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {ord.status === 'PENDING' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
export default DashboardPage;
