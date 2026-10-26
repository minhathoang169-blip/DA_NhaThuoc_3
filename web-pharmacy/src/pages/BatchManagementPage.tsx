import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { invalidateMedicinesCache } from '../services/queryClient';
import { 
  BatchInventoryDto, 
  MedicineInventoryItem, 
  ImportBatchRequest, 
  MedicineBatchRequest, 
  MedicineBatchResponse,
} from '../types/pharmacy';
import { 
  Layers, AlertOctagon, AlertTriangle, CheckCircle2, Search, 
  Plus, RefreshCw, ShieldAlert, CalendarClock, Lock, 
  X, PackagePlus, Edit3, Trash2, Save
} from 'lucide-react';

const PAGE_SIZE = 10;

export function BatchManagementPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Import Modal State (/api/v1/inventory/import)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importForm, setImportForm] = useState<ImportBatchRequest>({
    medicineId: '',
    batchNumber: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantity: 100,
    costPrice: 1000,
  });
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Edit Batch Modal State (PUT /api/batches/{id})
  const [editingBatch, setEditingBatch] = useState<MedicineBatchRequest | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Batch Confirm State (DELETE /api/batches/{id})
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  // 1. Fetch ALL Batches from Backend (/api/v1/inventory/batches?status=all)
  const { data: batches = [], isLoading, isError, refetch } = useQuery<BatchInventoryDto[]>({
    queryKey: ['inventory-batches'],
    queryFn: async () => {
      const response = await api.get('/v1/inventory/batches?status=all');
      return Array.isArray(response.data) ? response.data : [];
    }
  });

  // 2. Fetch Medicines list for dropdown (/api/v1/medicines/search)
  const { data: medicines = [] } = useQuery<MedicineInventoryItem[]>({
    queryKey: ['pos-medicines'],
    queryFn: async () => {
      const response = await api.get('/v1/medicines/search?q=');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 3. Import Batch Mutation (POST /api/v1/inventory/import)
  const importBatchMutation = useMutation({
    mutationFn: async (payload: ImportBatchRequest) => {
      const response = await api.post<BatchInventoryDto>('/v1/inventory/import', payload);
      return response.data;
    },
    onSuccess: (newBatch) => {
      setImportSuccessMsg(
        `Đã nhập kho thành công lô "${newBatch.id}" (Số lô: ${newBatch.batchNumber}) cho thuốc "${newBatch.medicineName}" (+${newBatch.quantity} đơn vị)!`
      );
      setIsImportModalOpen(false);
      setImportError(null);
      setImportForm({
        medicineId: '',
        batchNumber: '',
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        quantity: 100,
        costPrice: 1000,
      });
      invalidateMedicinesCache(queryClient);
    },
    onError: (err: any) => {
      setImportError(err.response?.data?.message || 'Lỗi khi nhập lô thuốc mới. Vui lòng kiểm tra thông tin (Hạn sử dụng phải lớn hơn ngày hiện tại)!');
    },
  });

  // 4. Update Batch Mutation (PUT /api/batches/{id} -> LoThuoc table)
  const updateBatchMutation = useMutation({
    mutationFn: async (payload: MedicineBatchRequest) => {
      const response = await api.put<MedicineBatchResponse>(
        `/batches/${encodeURIComponent(payload.id)}`,
        payload
      );
      return response.data;
    },
    onSuccess: (updated) => {
      setImportSuccessMsg(
        `Đã cập nhật lô thuốc "${updated.id}" (Số lô: ${updated.batchNumber}) trong bảng LoThuoc!`
      );
      setEditingBatch(null);
      setEditError(null);
      invalidateMedicinesCache(queryClient);
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.message || 'Không thể cập nhật lô thuốc.');
    },
  });

  // 5. Delete Batch Mutation (DELETE /api/batches/{id} -> LoThuoc table)
  const deleteBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/batches/${encodeURIComponent(id)}`);
      return id;
    },
    onSuccess: (deletedId) => {
      setImportSuccessMsg(`Đã xóa lô thuốc "${deletedId}" khỏi bảng LoThuoc!`);
      setDeletingBatchId(null);
      invalidateMedicinesCache(queryClient);
    },
    onError: (err: any) => {
      setDeletingBatchId(null);
      setImportError(err.response?.data?.message || 'Không thể xóa lô thuốc này (có thể lô đang được hóa đơn hoặc đơn hàng tham chiếu).');
    },
  });

  const handleOpenImportModal = () => {
    const nextLotNum = batches.length + 1;
    const suggestedLotId = `LOT${String(nextLotNum).padStart(3, '0')}`;
    setImportForm({
      medicineId: medicines[0]?.id || '',
      batchNumber: suggestedLotId,
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      quantity: 100,
      costPrice: 1000,
    });
    setImportError(null);
    setImportSuccessMsg(null);
    setIsImportModalOpen(true);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    if (!importForm.medicineId) {
      setImportError('Vui lòng chọn sản phẩm thuốc cần nhập lô!');
      return;
    }
    if (!importForm.expiryDate) {
      setImportError('Vui lòng chọn Ngày hết hạn (HanSuDung)!');
      return;
    }

    importBatchMutation.mutate({
      medicineId: importForm.medicineId,
      batchNumber: importForm.batchNumber ? importForm.batchNumber.trim().toUpperCase() : undefined,
      manufacturingDate: importForm.manufacturingDate,
      expiryDate: importForm.expiryDate,
      quantity: Number(importForm.quantity),
      costPrice: Number(importForm.costPrice),
    });
  };

  const handleOpenEditBatch = (batch: BatchInventoryDto) => {
    setEditingBatch({
      id: batch.id,
      medicineId: batch.medicineId,
      batchNumber: Number(batch.batchNumber),
      expiryDate: batch.expiryDate,
      quantity: Number(batch.quantity),
      purchasePrice: Number(batch.costPrice),
    });
    setEditError(null);
  };

  const handleEditBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setEditError(null);

    if (!editingBatch.batchNumber || isNaN(Number(editingBatch.batchNumber))) {
      setEditError('Số lô (SoLo) phải là một số nguyên hợp lệ.');
      return;
    }
    if (!editingBatch.expiryDate) {
      setEditError('Hạn sử dụng (HanSuDung) không được để trống.');
      return;
    }
    if (editingBatch.quantity < 0) {
      setEditError('Số lượng tồn (SoLuongTon) không được âm.');
      return;
    }
    if (editingBatch.purchasePrice < 0) {
      setEditError('Giá nhập (GiaNhap) không được âm.');
      return;
    }

    updateBatchMutation.mutate({
      id: editingBatch.id,
      medicineId: editingBatch.medicineId,
      batchNumber: Number(editingBatch.batchNumber),
      expiryDate: editingBatch.expiryDate,
      quantity: Number(editingBatch.quantity),
      purchasePrice: Number(editingBatch.purchasePrice),
    });
  };

  // Helper to classify FEFO alert level based on daysRemaining
  // <= 0: EXPIRED, <= 30: CRITICAL, 31-90: WARNING (e.g. 47 days), > 90: SAFE
  const getBatchLevel = (b: BatchInventoryDto): 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'SAFE' => {
    const days = Number(b.daysRemaining ?? 0);
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'CRITICAL';
    if (days <= 90) return 'WARNING';
    return 'SAFE';
  };

  // Accurate Summary Counts across ALL batches in LoThuoc
  const criticalCount = useMemo(() => batches.filter((b) => getBatchLevel(b) === 'CRITICAL').length, [batches]);
  const warningCount = useMemo(() => batches.filter((b) => getBatchLevel(b) === 'WARNING').length, [batches]);
  const safeCount = useMemo(() => batches.filter((b) => getBatchLevel(b) === 'SAFE').length, [batches]);
  const expiredCount = useMemo(() => batches.filter((b) => getBatchLevel(b) === 'EXPIRED').length, [batches]);

  // Client-side filter by status and search keyword (Safely converting numbers/nulls to String)
  const filteredBatches = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return batches.filter((b) => {
      const level = getBatchLevel(b).toLowerCase();
      const matchesStatus =
        filterStatus === 'all' || level === filterStatus.toLowerCase();

      const idStr = String(b.id || '').toLowerCase();
      const batchNumStr = String(b.batchNumber ?? '').toLowerCase();
      const medNameStr = String(b.medicineName || '').toLowerCase();
      const medIdStr = String(b.medicineId || '').toLowerCase();
      const catStr = String(b.category || '').toLowerCase();

      const matchesSearch =
        !kw ||
        idStr.includes(kw) ||
        batchNumStr.includes(kw) ||
        medNameStr.includes(kw) ||
        medIdStr.includes(kw) ||
        catStr.includes(kw);

      return matchesStatus && matchesSearch;
    });
  }, [batches, filterStatus, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE));
  const paginatedBatches = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredBatches.slice(start, start + PAGE_SIZE);
  }, [filteredBatches, currentPage, totalPages]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Quản Lý Lô Thuốc & Kiểm Soát Hạn Dùng FEFO (Bảng LoThuoc)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Dữ liệu thực tế từ bảng <code className="font-mono text-slate-700">LoThuoc</code> — Tự động khóa xuất bán các lô hết hạn hoặc cận hạn (&le; 15 ngày)
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
            Làm mới dữ liệu
          </button>
          <button 
            data-testid="btn-open-import-modal"
            onClick={handleOpenImportModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nhập Kho Lô Mới
          </button>
        </div>
      </div>

      {/* Success Toast Banner */}
      {importSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
          <button onClick={() => setImportSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* FEFO Status Cards (Always accurate from full LoThuoc query) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => {
            setFilterStatus('critical');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'critical' 
              ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200/80 hover:border-rose-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">Báo Động Đỏ (&le; 30 Ngày)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{criticalCount} <span className="text-xs font-semibold text-slate-500">lô thuốc</span></p>
          <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Cảnh báo khẩn cấp tại quầy
          </p>
        </div>

        <div 
          onClick={() => {
            setFilterStatus('warning');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'warning' 
              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200/80 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Cảnh Báo Vàng (31 - 90 Ngày)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{warningCount} <span className="text-xs font-semibold text-slate-500">lô thuốc</span></p>
          <p className="text-[11px] font-semibold text-amber-700 mt-1">
            Được ưu tiên đẩy xuất trước theo FEFO
          </p>
        </div>

        <div 
          onClick={() => {
            setFilterStatus('safe');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'safe' 
              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">An Toàn (&gt; 90 Ngày)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{safeCount} <span className="text-xs font-semibold text-slate-500">lô thuốc</span></p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-1">
            Đủ điều kiện lưu hành tiêu chuẩn
          </p>
        </div>

        <div 
          onClick={() => {
            setFilterStatus('expired');
            setCurrentPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'expired' 
              ? 'bg-slate-800 text-white border-slate-900 ring-2 ring-slate-500/20' 
              : 'bg-white border-slate-200/80 hover:border-slate-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${filterStatus === 'expired' ? 'text-rose-300' : 'text-slate-500'}`}>
              Đã Quá Hạn Sử Dụng
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-black mt-2 ${filterStatus === 'expired' ? 'text-white' : 'text-slate-900'}`}>
            {expiredCount} <span className="text-xs font-semibold text-slate-400">lô thuốc</span>
          </p>
          <p className={`text-[11px] font-semibold mt-1 ${filterStatus === 'expired' ? 'text-slate-300' : 'text-slate-500'}`}>
            Cần xuất hủy khỏi kho
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã lô (LOT001), Số lô (202601), Tên thuốc, Mã SP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: `Tất cả lô (${batches.length})` },
            { id: 'critical', label: `Khẩn cấp <=30d (${criticalCount})` },
            { id: 'warning', label: `Cận date 31-90d (${warningCount})` },
            { id: 'safe', label: `An toàn >90d (${safeCount})` },
            { id: 'expired', label: `Đã hết hạn (${expiredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterStatus(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Batches Table (Matching LoThuoc schema) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã Lô (MaLo)</th>
                <th className="py-3.5 px-4">Số Lô SX (SoLo)</th>
                <th className="py-3.5 px-4">Sản Phẩm Thuốc (SanPham)</th>
                <th className="py-3.5 px-4 text-center">Tồn Kho (SoLuongTon)</th>
                <th className="py-3.5 px-4 text-right">Giá Nhập (GiaNhap)</th>
                <th className="py-3.5 px-4 text-right">Tổng Giá Vốn</th>
                <th className="py-3.5 px-4">Hạn Dùng (HanSuDung)</th>
                <th className="py-3.5 px-4">Trạng Thái FEFO</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách lô thuốc từ bảng LoThuoc...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-rose-600 font-medium">
                    Không thể tải dữ liệu lô thuốc từ máy chủ Backend!
                  </td>
                </tr>
              ) : paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    Không có lô thuốc nào nằm trong nhóm bộ lọc này.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((batch) => {
                  const qty = Number(batch.quantity ?? 0);
                  const cost = Number(batch.costPrice ?? 0);
                  const totalCostValue = qty * cost;
                  const level = getBatchLevel(batch);

                  return (
                    <tr 
                      key={batch.id} 
                      className={`transition-colors ${
                        level === 'CRITICAL' || level === 'EXPIRED'
                          ? 'bg-rose-50/30 hover:bg-rose-50/60'
                          : level === 'WARNING'
                          ? 'bg-amber-50/20 hover:bg-amber-50/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {batch.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          {batch.batchNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{batch.medicineName}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-blue-600">{batch.medicineId}</span>
                          <span>•</span>
                          <span>{batch.category || 'Chưa phân loại'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sm font-black text-slate-900">
                          {qty.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">đv</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {cost.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {totalCostValue.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                          <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                          {batch.expiryDate}
                        </div>
                        <span className={`text-[11px] font-bold ${
                          batch.daysRemaining <= 30 ? 'text-rose-600' : batch.daysRemaining <= 90 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {batch.daysRemaining < 0 
                            ? `Quá hạn ${Math.abs(batch.daysRemaining)} ngày` 
                            : `Còn ${batch.daysRemaining} ngày`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {level === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                            <Lock className="w-3 h-3 text-rose-400" />
                            Đã Hết Hạn (Khóa)
                          </span>
                        )}
                        {level === 'CRITICAL' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            Khẩn Cấp &le; 30 Ngày
                          </span>
                        )}
                        {level === 'WARNING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Cận Hạn 31-90 Ngày (Ưu tiên FEFO)
                          </span>
                        )}
                        {level === 'SAFE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            An Toàn Lưu Hành (&gt; 90d)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditBatch(batch)}
                            title="Sửa thông tin lô thuốc"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingBatchId(batch.id)}
                            title="Xóa lô thuốc"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Real Table Footer & Pagination */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>
            Hiển thị <strong>{paginatedBatches.length}</strong> / Tổng số <strong>{filteredBatches.length}</strong> lô thuốc trong bảng <code className="font-mono">LoThuoc</code>
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                Tiếp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: NHẬP KHO LÔ THUỐC MỚI (POST /api/v1/inventory/import)        */}
      {/* ===================================================================== */}
      {isImportModalOpen && (
        <div data-testid="import-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Nhập Kho Lô Thuốc Mới (FEFO)</h3>
                  <p className="text-[11px] text-slate-400">Thêm trực tiếp vào bảng LoThuoc & cập nhật tồn kho POS</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Medicine Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn sản phẩm thuốc cần nhập lô (<code className="font-mono">MaSanPham</code>) <span className="text-rose-500">*</span>
                </label>
                <select
                  data-testid="select-medicine"
                  value={importForm.medicineId}
                  onChange={(e) => setImportForm({ ...importForm, medicineId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Chọn thuốc trong danh mục SanPham ({medicines.length} thuốc) --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.id}] {m.name} (Tồn hiện tại: {m.totalStock ?? m.stock ?? 0} đv)
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Code & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã Lô (<code className="font-mono">MaLo</code> - Để trống tự sinh)
                  </label>
                  <input
                    data-testid="input-batch-number"
                    type="text"
                    maxLength={50}
                    placeholder="VD: LOT005"
                    value={importForm.batchNumber || ''}
                    onChange={(e) => setImportForm({ ...importForm, batchNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày Hết Hạn (<code className="font-mono">HanSuDung</code>) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    data-testid="input-expiry-date"
                    type="date"
                    value={importForm.expiryDate}
                    onChange={(e) => setImportForm({ ...importForm, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:bg-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Quantity & Import Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số Lượng Nhập (<code className="font-mono">SoLuongTon</code>) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    data-testid="input-quantity"
                    type="number"
                    min={1}
                    value={importForm.quantity}
                    onChange={(e) => setImportForm({ ...importForm, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giá Vốn Nhập (<code className="font-mono">GiaNhap</code> - VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    data-testid="input-import-price"
                    type="number"
                    min={0}
                    step="any"
                    value={importForm.costPrice}
                    onChange={(e) => setImportForm({ ...importForm, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  data-testid="btn-submit-import"
                  type="submit"
                  disabled={importBatchMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {importBatchMutation.isPending ? 'Đang lưu vào kho...' : 'Xác Nhận Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CHỈNH SỬA LÔ THUỐC (PUT /api/batches/{id})                    */}
      {/* ===================================================================== */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Cập Nhật Lô Thuốc: {editingBatch.id}</h3>
              </div>
              <button onClick={() => setEditingBatch(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditBatchSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sản Phẩm Thuốc (<code className="font-mono">MaSanPham</code>) *
                </label>
                <select
                  value={editingBatch.medicineId}
                  onChange={(e) => setEditingBatch({ ...editingBatch, medicineId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  required
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.id}] {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Lô SX (<code className="font-mono">SoLo</code> - Số nguyên) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingBatch.batchNumber}
                    onChange={(e) => setEditingBatch({ ...editingBatch, batchNumber: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn Sử Dụng (<code className="font-mono">HanSuDung</code>) *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingBatch.expiryDate}
                    onChange={(e) => setEditingBatch({ ...editingBatch, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Lượng Tồn (<code className="font-mono">SoLuongTon</code>) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingBatch.quantity}
                    onChange={(e) => setEditingBatch({ ...editingBatch, quantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giá Nhập (<code className="font-mono">GiaNhap</code> - VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={editingBatch.purchasePrice}
                    onChange={(e) => setEditingBatch({ ...editingBatch, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateBatchMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateBatchMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: XÁC NHẬN XÓA LÔ THUỐC (DELETE /api/batches/{id})              */}
      {/* ===================================================================== */}
      {deletingBatchId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận xóa lô thuốc</h3>
                <p className="text-xs text-slate-500">
                  Mã lô: <strong className="font-mono text-slate-800">{deletingBatchId}</strong>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa lô thuốc này khỏi bảng <code className="font-mono">LoThuoc</code>? Tổng tồn kho khả dụng của sản phẩm sẽ được tính toán lại ngay lập tức.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingBatchId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                disabled={deleteBatchMutation.isPending}
                onClick={() => deleteBatchMutation.mutate(deletingBatchId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteBatchMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default BatchManagementPage;
