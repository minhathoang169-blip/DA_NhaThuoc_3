import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { invalidateMedicinesCache } from '../services/queryClient';
import { MedicineInventoryItem, MedicineRequest, MedicineResponse } from '../types/pharmacy';
import { 
  Search, Plus, Layers, AlertTriangle, CheckCircle2, 
  Package, RefreshCw, X, Save, Edit3, Trash2, ArrowRight, ShieldAlert
} from 'lucide-react';

const PAGE_SIZE = 10;

export function MedicinesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Create / Edit Medicine in SanPham table (/api/medicines)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<MedicineRequest>({
    id: '',
    name: '',
    category: '',
    price: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Medicines with Inventory aggregation (/api/v1/medicines/search)
  const { data: medicines = [], isLoading, isError, refetch } = useQuery<MedicineInventoryItem[]>({
    queryKey: ['medicines-catalog'],
    queryFn: async () => {
      const response = await api.get('/v1/medicines/search?q=');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // Create Medicine Mutation (POST /api/medicines -> SanPham table)
  const createMutation = useMutation({
    mutationFn: async (payload: MedicineRequest) => {
      const response = await api.post<MedicineResponse>('/medicines', payload);
      return response.data;
    },
    onSuccess: (created) => {
      invalidateMedicinesCache(queryClient);
      setIsModalOpen(false);
      setActionBanner({
        type: 'success',
        text: `Đã thêm sản phẩm "${created.name}" (${created.id}) vào bảng SanPham thành công!`,
      });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Không thể thêm sản phẩm mới. Vui lòng kiểm tra dữ liệu!');
    },
  });

  // Update Medicine Mutation (PUT /api/medicines/{id} -> SanPham table)
  const updateMutation = useMutation({
    mutationFn: async (payload: MedicineRequest) => {
      const response = await api.put<MedicineResponse>(`/medicines/${encodeURIComponent(payload.id)}`, payload);
      return response.data;
    },
    onSuccess: (updated) => {
      invalidateMedicinesCache(queryClient);
      setIsModalOpen(false);
      setActionBanner({
        type: 'success',
        text: `Đã cập nhật sản phẩm "${updated.name}" (${updated.id}) trong bảng SanPham!`,
      });
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Không thể cập nhật sản phẩm.');
    },
  });

  // Delete Medicine Mutation (DELETE /api/medicines/{id} -> SanPham table)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/medicines/${encodeURIComponent(id)}`);
      return id;
    },
    onSuccess: (deletedId) => {
      invalidateMedicinesCache(queryClient);
      setDeleteConfirmId(null);
      setActionBanner({
        type: 'success',
        text: `Đã xóa sản phẩm mã "${deletedId}" khỏi bảng SanPham!`,
      });
    },
    onError: (err: any) => {
      setDeleteConfirmId(null);
      setActionBanner({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa sản phẩm (có thể sản phẩm đang có lô thuốc trong bảng LoThuoc).',
      });
    },
  });

  // Distinct Categories from DB
  const categories = useMemo(() => {
    return Array.from(
      new Set(medicines.map((m) => m.category).filter((c): c is string => Boolean(c && c.trim())))
    );
  }, [medicines]);

  // Filtered Medicines (Safely guarding null/undefined fields)
  const filteredMedicines = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return medicines.filter((item) => {
      const idStr = String(item.id || '').toLowerCase();
      const nameStr = String(item.name || '').toLowerCase();
      const catStr = String(item.category || '').toLowerCase();
      const activeIng = String(item.activeIngredientName || '').toLowerCase();

      const matchSearch =
        !kw ||
        nameStr.includes(kw) ||
        idStr.includes(kw) ||
        catStr.includes(kw) ||
        activeIng.includes(kw);
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [medicines, searchKeyword, selectedCategory]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / PAGE_SIZE));
  const paginatedMedicines = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredMedicines.slice(start, start + PAGE_SIZE);
  }, [filteredMedicines, currentPage, totalPages]);

  // Real Summary Metrics from Database
  const totalStockUnits = useMemo(
    () => medicines.reduce((acc, m) => acc + Number(m.totalStock ?? m.stock ?? 0), 0),
    [medicines]
  );
  const lowOrOutStockCount = useMemo(
    () => medicines.filter((m) => Number(m.totalStock ?? m.stock ?? 0) < 100).length,
    [medicines]
  );

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextNum = medicines.length + 1;
    const suggestedId = `SP${String(nextNum).padStart(3, '0')}`;
    setModalMode('create');
    setFormData({
      id: suggestedId,
      name: '',
      category: categories[0] || 'Thuốc giảm đau',
      price: 0,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (med: MedicineInventoryItem) => {
    setModalMode('edit');
    setFormData({
      id: med.id,
      name: med.name || '',
      category: med.category || '',
      price: Number(med.price ?? 0),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedId = formData.id.trim();
    const trimmedName = formData.name.trim();
    const trimmedCat = formData.category.trim();

    if (!trimmedId || trimmedId.length > 50) {
      setFormError('Mã sản phẩm (MaSanPham) không được để trống và tối đa 50 ký tự.');
      return;
    }
    if (!trimmedName || trimmedName.length > 255) {
      setFormError('Tên sản phẩm (TenSanPham) không được để trống và tối đa 255 ký tự.');
      return;
    }
    if (!trimmedCat || trimmedCat.length > 20) {
      setFormError('Loại sản phẩm (LoaiSanPham) không được để trống và tối đa 20 ký tự (theo cấu trúc bảng SanPham).');
      return;
    }
    if (formData.price < 0 || isNaN(formData.price)) {
      setFormError('Giá bán (GiaBan) phải lớn hơn hoặc bằng 0.');
      return;
    }

    const payload: MedicineRequest = {
      id: trimmedId,
      name: trimmedName,
      category: trimmedCat,
      price: Number(formData.price),
    };

    if (modalMode === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Danh Mục Sản Phẩm Thuốc (Bảng SanPham)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý trực tiếp dữ liệu bảng <code className="font-mono text-slate-700">SanPham</code> và tổng hợp tồn kho thực tế từ bảng <code className="font-mono text-slate-700">LoThuoc</code>
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
            Đồng bộ CSDL
          </button>
          <button 
            onClick={() => navigate('/batches')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Quản lý Lô Thuốc (LoThuoc)
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
            actionBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionBanner.text}</span>
          </div>
          <button onClick={() => setActionBanner(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Real Database Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Sản Phẩm (SanPham)</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{medicines.length} <span className="text-xs font-semibold text-slate-500">mặt hàng</span></p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Đang lưu trong QuanLyNhaThuocDB</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Tồn Kho Khả Dụng</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {totalStockUnits.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">đơn vị</span>
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Tổng hợp từ các lô còn hạn (LoThuoc)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhóm / Loại Sản Phẩm</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{categories.length} <span className="text-xs font-semibold text-slate-500">nhóm</span></p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 truncate max-w-[180px]">
              {categories.join(', ') || 'Chưa phân loại'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sắp Hết / Hết Tồn (&lt; 100)</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{lowOrOutStockCount} <span className="text-xs font-semibold text-slate-500">sản phẩm</span></p>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Cần kiểm tra nhập thêm lô mới</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo Mã SP (SP001), Tên sản phẩm, Loại sản phẩm..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({medicines.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat} ({medicines.filter((m) => m.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Main Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã SP (MaSanPham)</th>
                <th className="py-3.5 px-4">Tên Sản Phẩm (TenSanPham)</th>
                <th className="py-3.5 px-4">Loại Sản Phẩm (LoaiSanPham)</th>
                <th className="py-3.5 px-4 text-right">Giá Bán Lẻ (GiaBan)</th>
                <th className="py-3.5 px-4 text-center">Tổng Tồn Khả Dụng</th>
                <th className="py-3.5 px-4">Hạn SD Gần Nhất (FEFO)</th>
                <th className="py-3.5 px-4 text-right">Thao tác CRUD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh mục sản phẩm từ SQL Server...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-rose-600 font-semibold">
                    Không thể tải dữ liệu từ API (/api/v1/medicines/search). Vui lòng kiểm tra kết nối Backend!
                  </td>
                </tr>
              ) : paginatedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    Không tìm thấy sản phẩm nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedMedicines.map((med) => {
                  const stockVal = Number(med.totalStock ?? med.stock ?? 0);
                  const priceVal = Number(med.price ?? 0);
                  const batchCount = Array.isArray(med.batches) ? med.batches.length : 0;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {med.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-sm">{med.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {med.activeIngredientName
                            ? `Hoạt chất: ${med.activeIngredientName}`
                            : batchCount > 0
                            ? `Đang có ${batchCount} lô khả dụng`
                            : 'Chưa có lô khả dụng'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {med.category || 'Chưa phân loại'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900">
                          {priceVal.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            stockVal <= 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : stockVal < 100
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              stockVal <= 0
                                ? 'bg-rose-500'
                                : stockVal < 100
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {stockVal.toLocaleString('vi-VN')} đv
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {med.nearestExpiry ? (
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {med.nearestExpiry}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có lô tồn</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(med)}
                            title="Sửa thông tin sản phẩm"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(med.id)}
                            title="Xóa sản phẩm"
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
        
        {/* Real Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>
            Hiển thị <strong>{paginatedMedicines.length}</strong> / Tổng số <strong>{filteredMedicines.length}</strong> sản phẩm trong CSDL
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
      {/* MODAL CREATE / EDIT MEDICINE (SanPham Table)                          */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">
                  {modalMode === 'create'
                    ? 'Thêm Sản Phẩm Mới (Bảng SanPham)'
                    : `Cập Nhật Sản Phẩm: ${formData.id}`}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Sản Phẩm (<code className="font-mono">MaSanPham</code> - Tối đa 50 ký tự) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  disabled={modalMode === 'edit'}
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="VD: SP005"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Sản Phẩm (<code className="font-mono">TenSanPham</code> - Tối đa 255 ký tự) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Thuốc hạ sốt Hapacol 650mg"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loại Sản Phẩm (<code className="font-mono">LoaiSanPham</code> &le; 20 ký tự) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    list="existing-categories"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="VD: Thuốc giảm đau"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="existing-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Đã dùng: {formData.category.length}/20 ký tự
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giá Bán Lẻ (<code className="font-mono">GiaBan</code> - VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="VD: 5000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span>Muốn nhập số lượng tồn kho và hạn sử dụng cho thuốc này?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('/batches');
                  }}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  Tới Quản lý Lô <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Đang lưu CSDL...'
                    : modalMode === 'create'
                    ? 'Tạo Sản Phẩm'
                    : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL CONFIRM DELETE MEDICINE                                         */}
      {/* ===================================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận xóa sản phẩm</h3>
                <p className="text-xs text-slate-500">
                  Mã sản phẩm: <strong className="font-mono text-slate-800">{deleteConfirmId}</strong>
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi bảng <code className="font-mono">SanPham</code>? Nếu sản phẩm đang có lô thuốc tham chiếu trong bảng <code className="font-mono">LoThuoc</code>, hệ thống sẽ từ chối xóa để bảo toàn khóa ngoại.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default MedicinesPage;
