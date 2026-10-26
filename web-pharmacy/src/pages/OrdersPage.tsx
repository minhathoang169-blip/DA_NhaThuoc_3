import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { invalidateOrdersCache, invalidateMedicinesCache } from '../services/queryClient';
import { useAuth } from '../context/AuthContext';
import { 
  OnlineOrder, 
  MedicineInventoryItem, 
  OnlineCheckoutRequest, 
  OnlineCheckoutResponse 
} from '../types/pharmacy';
import { 
  ShoppingBag, Search, CheckCircle2, Truck, Clock, XCircle, 
  Phone, MapPin, PackageCheck, RefreshCw, Plus, Trash2, X, ShieldAlert, FileCheck2
} from 'lucide-react';

export function OrdersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManageOrders = user?.role === 'ADMIN' || user?.role === 'PHARMACIST';

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Track Order Lookup Modal / Bar (/api/v1/orders/track/{orderNumber})
  const [trackCode, setTrackCode] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<OnlineOrder | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // Create Online Order Modal (POST /api/v1/orders/online-checkout)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ medicineId: string; quantity: number }>>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [createError, setCreateError] = useState<string | null>(null);

  // 1. Fetch Online Orders from SQL Server (online_orders + order_details)
  const { data: orders = [], isLoading, isError, refetch } = useQuery<OnlineOrder[]>({
    queryKey: ['online-orders'],
    queryFn: async () => {
      const response = await api.get('/v1/orders');
      return response.data;
    },
  });

  // 2. Fetch Medicines for creating new Online Order with FEFO
  const { data: medicines = [] } = useQuery<MedicineInventoryItem[]>({
    queryKey: ['pos-medicines'],
    queryFn: async () => {
      const response = await api.get('/v1/medicines/search?q=');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 3. Fulfill Order Mutation (POST /api/v1/admin/orders/{id}/fulfill -> PACKED, fallback PUT /api/v1/orders/{id}/status)
  const fulfillMutation = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        const response = await api.post(`/v1/admin/orders/${orderId}/fulfill`);
        return response.data;
      } catch {
        const response = await api.put(`/v1/orders/${orderId}/status`, { status: 'PACKED' });
        return response.data;
      }
    },
    onSuccess: (data) => {
      invalidateOrdersCache(queryClient);
      setActionFeedback({
        type: 'success',
        text: data?.message || 'Đã duyệt xuất kho và đóng gói đơn hàng thành công (PACKED)!',
      });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Không thể duyệt đóng gói đơn hàng.',
      });
    },
  });

  // 4. Update Order Status Mutation (PUT /api/v1/orders/{id}/status)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      try {
        const response = await api.put(`/v1/orders/${orderId}/status`, { status });
        return response.data;
      } catch {
        const response = await api.put(`/v1/admin/orders/${orderId}/status`, { status });
        return response.data;
      }
    },
    onSuccess: (data, variables) => {
      invalidateOrdersCache(queryClient);
      setActionFeedback({
        type: 'success',
        text: `Đã cập nhật trạng thái đơn #${data?.orderNumber || ''} sang ${data?.status || data?.newStatus || variables.status}!`,
      });
    },
    onError: (err: any) => {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.',
      });
    },
  });

  // 5. Create Online Order Mutation (POST /api/v1/orders/online-checkout)
  const createOrderMutation = useMutation({
    mutationFn: async (payload: OnlineCheckoutRequest) => {
      const response = await api.post<OnlineCheckoutResponse>('/v1/orders/online-checkout', payload);
      return response.data;
    },
    onSuccess: (res) => {
      invalidateOrdersCache(queryClient);
      invalidateMedicinesCache(queryClient);
      setIsCreateModalOpen(false);
      setReceiverName('');
      setReceiverPhone('');
      setShippingAddress('');
      setOrderItems([]);
      setCreateError(null);
      setActionFeedback({
        type: 'success',
        text: `${res.message} — Mã đơn: #${res.orderNumber} (${res.totalAmount.toLocaleString('vi-VN')} ₫)`,
      });
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || 'Lỗi khi tạo đơn hàng Online và phân bổ lô FEFO.');
    },
  });

  // Track Order by OrderNumber (/api/v1/orders/track/{orderNumber})
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackCode.trim().replace(/^#/, '');
    if (!trimmed) return;
    setIsTracking(true);
    setTrackError(null);
    setTrackedOrder(null);
    try {
      const response = await api.get<OnlineOrder>(`/v1/orders/track/${encodeURIComponent(trimmed)}`);
      setTrackedOrder(response.data);
    } catch (err: any) {
      setTrackError(
        err.response?.status === 404
          ? `Không tìm thấy đơn hàng có mã "${trimmed}" trong bảng online_orders.`
          : 'Lỗi khi tra cứu mã đơn hàng.'
      );
    } finally {
      setIsTracking(false);
    }
  };

  // Add item to new online order form
  const handleAddOrderItem = () => {
    setCreateError(null);
    const med = medicines.find((m) => String(m.id) === String(selectedMedicineId));
    if (!med) {
      setCreateError('Vui lòng chọn một sản phẩm thuốc khả dụng.');
      return;
    }
    if (selectedQty <= 0) {
      setCreateError('Số lượng phải lớn hơn 0.');
      return;
    }
    const availStock = Number(med.totalStock ?? 0);
    if (selectedQty > availStock) {
      setCreateError(`Thuốc "${med.name}" chỉ còn ${availStock} đơn vị khả dụng.`);
      return;
    }

    setOrderItems((prev) => {
      const existing = prev.find((i) => i.medicineId === med.id);
      if (existing) {
        const nextQty = Math.min(availStock, existing.quantity + selectedQty);
        return prev.map((i) => (i.medicineId === med.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { medicineId: med.id, quantity: selectedQty }];
    });
    setSelectedQty(1);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!receiverName.trim() || !receiverPhone.trim() || !shippingAddress.trim()) {
      setCreateError('Vui lòng nhập đầy đủ Tên người nhận, Số điện thoại và Địa chỉ giao hàng.');
      return;
    }
    if (orderItems.length === 0) {
      setCreateError('Vui lòng thêm ít nhất 1 sản phẩm thuốc vào đơn hàng.');
      return;
    }

    createOrderMutation.mutate({
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      items: orderItems,
    });
  };

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        order.receiverName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        order.receiverPhone.includes(searchKeyword) ||
        order.shippingAddress.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, selectedStatus, searchKeyword]);

  // Status Counts from real DB
  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'PENDING').length, [orders]);
  const confirmedOrPackedCount = useMemo(
    () => orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PACKED').length,
    [orders]
  );
  const shippingCount = useMemo(() => orders.filter((o) => o.status === 'SHIPPING').length, [orders]);
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'COMPLETED').length, [orders]);
  const cancelledCount = useMemo(() => orders.filter((o) => o.status === 'CANCELLED').length, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chờ xác nhận (PENDING)
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <PackageCheck className="w-3.5 h-3.5" /> Đã xác nhận (CONFIRMED)
          </span>
        );
      case 'PACKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <FileCheck2 className="w-3.5 h-3.5" /> Đã đóng gói FEFO (PACKED)
          </span>
        );
      case 'SHIPPING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Truck className="w-3.5 h-3.5" /> Đang giao hàng (SHIPPING)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành (COMPLETED)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Đã hủy (CANCELLED)
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100">{status}</span>;
    }
  };

  const formatOrderDate = (dateStr?: string) => {
    if (!dateStr) return 'Không rõ';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN');
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Đơn Đặt Hàng Online & Điều Phối FEFO (Bảng online_orders)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Dữ liệu thực tế từ bảng <code className="font-mono text-slate-700">online_orders</code> và <code className="font-mono text-slate-700">order_details</code> trong SQL Server
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            Làm mới đơn
          </button>
          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Đơn Hàng Online (FEFO)
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionFeedback.text}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Order Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedStatus('PENDING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'PENDING' ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Chờ Duyệt (PENDING)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{pendingCount} <span className="text-xs font-semibold text-slate-500">đơn</span></p>
          <p className="text-[11px] font-semibold text-amber-700 mt-1">Đang chờ xác nhận & xuất kho</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('CONFIRMED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'CONFIRMED' || selectedStatus === 'PACKED'
              ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Đã Xác Nhận / Đóng Gói</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{confirmedOrPackedCount} <span className="text-xs font-semibold text-slate-500">đơn</span></p>
          <p className="text-[11px] font-semibold text-blue-700 mt-1">CONFIRMED / PACKED</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('SHIPPING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'SHIPPING' ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700">Đang Vận Chuyển</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{shippingCount} <span className="text-xs font-semibold text-slate-500">đơn</span></p>
          <p className="text-[11px] font-semibold text-purple-700 mt-1">Đang giao đến địa chỉ khách hàng</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('COMPLETED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'COMPLETED' ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Đã Hoàn Tất</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{completedCount} <span className="text-xs font-semibold text-slate-500">đơn</span></p>
          <p className="text-[11px] font-semibold text-emerald-700 mt-1">Đã giao và đối soát thành công</p>
        </div>
      </div>

      {/* Filter, Search & Order Tracking Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Lọc theo Mã đơn (MOB-2024...), Tên khách, SĐT, Địa chỉ..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Direct Order Tracking API Lookup (/api/v1/orders/track/{orderNumber}) */}
          <form onSubmit={handleTrackOrder} className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              placeholder="Tra cứu nhanh mã đơn (VD: MOB-2024-9981)..."
              className="flex-1 lg:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isTracking}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
            >
              {isTracking ? 'Đang tìm...' : 'Tra cứu API'}
            </button>
          </form>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          {[
            { id: 'ALL', label: `Tất cả (${orders.length})` },
            { id: 'PENDING', label: `PENDING (${pendingCount})` },
            { id: 'CONFIRMED', label: `CONFIRMED (${orders.filter((o) => o.status === 'CONFIRMED').length})` },
            { id: 'PACKED', label: `PACKED (${orders.filter((o) => o.status === 'PACKED').length})` },
            { id: 'SHIPPING', label: `SHIPPING (${shippingCount})` },
            { id: 'COMPLETED', label: `COMPLETED (${completedCount})` },
            { id: 'CANCELLED', label: `CANCELLED (${cancelledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tracked Order Result Box */}
        {(trackedOrder || trackError) && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
            {trackError ? (
              <span className="text-rose-700 font-bold">{trackError}</span>
            ) : trackedOrder ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-black text-blue-700">#{trackedOrder.orderNumber}</span>
                <span className="font-bold text-slate-800">{trackedOrder.receiverName} ({trackedOrder.receiverPhone})</span>
                <span className="text-slate-600">Đ/c: {trackedOrder.shippingAddress}</span>
                <span className="font-black text-blue-700">{trackedOrder.totalAmount.toLocaleString('vi-VN')} ₫</span>
                {getStatusBadge(trackedOrder.status)}
              </div>
            ) : null}
            <button
              onClick={() => {
                setTrackedOrder(null);
                setTrackError(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Đang tải danh sách đơn hàng từ bảng online_orders...
          </div>
        ) : isError ? (
          <div className="bg-white p-12 rounded-2xl border border-rose-200 text-center text-rose-600 font-semibold">
            Không thể tải dữ liệu đơn hàng từ Backend (/api/v1/orders)!
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            Không có đơn đặt hàng nào trong danh mục này.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
            >
              {/* Order Card Header */}
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    #{order.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    ID: <strong className="font-mono text-slate-700">{order.id}</strong> • Ngày tạo: <strong className="text-slate-700">{formatOrderDate(order.orderDate)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Order Card Body */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Customer & Shipping Info */}
                <div className="lg:col-span-4 space-y-2.5 border-b lg:border-b-0 lg:border-r border-slate-200/80 pb-4 lg:pb-0 lg:pr-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thông tin người nhận</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-base">{order.receiverName}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      <Phone className="w-3 h-3" /> {order.receiverPhone}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    {order.shippingAddress}
                  </p>
                </div>

                {/* Order Items & FEFO Batch Allocation (Real order_details only) */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Chi tiết sản phẩm & Lô xuất FEFO (Bảng order_details)
                    </p>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {(order.orderDetails || []).length} dòng sản phẩm
                    </span>
                  </div>

                  {order.orderDetails && order.orderDetails.length > 0 ? (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-2">
                      {order.orderDetails.map((detail: any, idx: number) => {
                        const medName = detail.medicine?.name || detail.batch?.medicine?.name || detail.medicine?.id || 'Sản phẩm thuốc';
                        const batchCode = detail.batch?.id || detail.batch?.batchNumber;
                        const unitPrice = Number(detail.price ?? detail.unitPrice ?? 0);
                        const lineTotal = Number(detail.totalPrice ?? unitPrice * detail.quantity);
                        return (
                          <div key={detail.id ?? idx} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800">
                                {medName}
                              </span>
                              {batchCode && (
                                <span className="ml-2 font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                                  Lô: {batchCode}
                                </span>
                              )}
                              {detail.batch?.expiryDate && (
                                <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                                  (HSD: {detail.batch.expiryDate})
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">
                              x{detail.quantity} • {lineTotal.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-dashed border-slate-200 text-xs text-slate-500 italic">
                      Đơn hàng này chưa có bản ghi chi tiết trong bảng <code className="font-mono text-slate-700">order_details</code>. (Các đơn tạo mới qua chức năng <strong>Tạo Đơn Hàng Online (FEFO)</strong> sẽ tự động phân bổ lô và lưu chi tiết vào <code className="font-mono text-slate-700">order_details</code>).
                    </div>
                  )}
                </div>

                {/* Total & Fulfillment Actions */}
                <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-left lg:text-right w-full">
                    <span className="text-xs text-slate-400 font-medium block">Tổng giá trị đơn hàng</span>
                    <span className="text-2xl font-black text-blue-600">
                      {order.totalAmount.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>

                  {canManageOrders ? (
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'CONFIRMED' })}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Xác Nhận Đơn
                          </button>
                          <button
                            disabled={fulfillMutation.isPending}
                            onClick={() => fulfillMutation.mutate(order.id)}
                            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Đóng Gói (PACKED)
                          </button>
                          <button
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'CANCELLED' })}
                            className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <>
                          <button
                            disabled={fulfillMutation.isPending}
                            onClick={() => fulfillMutation.mutate(order.id)}
                            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Đóng Gói (PACKED)
                          </button>
                          <button
                            disabled={updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'SHIPPING' })}
                            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Giao Shipper
                          </button>
                        </>
                      )}

                      {order.status === 'PACKED' && (
                        <button
                          disabled={updateStatusMutation.isPending}
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'SHIPPING' })}
                          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Bàn Giao Đơn Vị Vận Chuyển (SHIPPING)
                        </button>
                      )}

                      {order.status === 'SHIPPING' && (
                        <button
                          disabled={updateStatusMutation.isPending}
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'COMPLETED' })}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Xác Nhận Giao Thành Công (COMPLETED)
                        </button>
                      )}

                      {order.status === 'COMPLETED' && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất giao nhận
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Đăng nhập quyền Quản trị (ADMIN) để đổi trạng thái đơn
                    </span>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: TẠO ĐƠN HÀNG ONLINE MỚI (POST /api/v1/orders/online-checkout)  */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-base">Tạo Đơn Đặt Hàng Online Mới (FEFO)</h3>
                  <p className="text-[11px] text-slate-400">
                    Tự động phân bổ lô thuốc FEFO và lưu vào bảng <code className="font-mono">online_orders</code> + <code className="font-mono">order_details</code>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Người Nhận (receiver_name) *</label>
                  <input
                    type="text"
                    required
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại Nhận (receiver_phone) *</label>
                  <input
                    type="text"
                    required
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="VD: 0909123456"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Giao Hàng (shipping_address) *</label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhận thuốc chi tiết..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Add Medicine Items */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Chọn sản phẩm thuốc cần đặt (Xuất kho theo FEFO)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedMedicineId}
                    onChange={(e) => setSelectedMedicineId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- Chọn thuốc khả dụng --</option>
                    {medicines
                      .filter((m) => Number(m.totalStock ?? 0) > 0)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.id}] {m.name} — {Number(m.price ?? 0).toLocaleString('vi-VN')} ₫ (Tồn: {m.totalStock ?? 0})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    + Thêm thuốc
                  </button>
                </div>

                {/* Selected Items List */}
                {orderItems.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mt-2">
                    {orderItems.map((item) => {
                      const med = medicines.find((m) => m.id === item.medicineId);
                      if (!med) return null;
                      const unitPrice = Number(med.price ?? 0);
                      return (
                        <div key={item.medicineId} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-blue-600 mr-2">{med.id}</span>
                            <span className="font-bold text-slate-800">{med.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-600">
                              {item.quantity} x {unitPrice.toLocaleString('vi-VN')} ₫ ={' '}
                              <strong className="text-slate-900">
                                {(item.quantity * unitPrice).toLocaleString('vi-VN')} ₫
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setOrderItems((prev) => prev.filter((i) => i.medicineId !== item.medicineId))
                              }
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs">
                  Tổng cộng dự kiến:{' '}
                  <strong className="text-base font-black text-blue-600">
                    {orderItems
                      .reduce((sum, item) => {
                        const med = medicines.find((m) => m.id === item.medicineId);
                        return sum + (med ? Number(med.price ?? 0) * item.quantity : 0);
                      }, 0)
                      .toLocaleString('vi-VN')}{' '}
                    ₫
                  </strong>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {createOrderMutation.isPending ? 'Đang tạo đơn FEFO...' : 'Tạo Đơn & Phân Bổ Lô'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
export default OrdersPage;
