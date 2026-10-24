import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { QUERY_KEYS, invalidateMedicinesCache } from '../../services/queryClient';
import { MedicineDto } from '../storefront/StorefrontPage';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const AdminProductsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [editingMedicine, setEditingMedicine] = useState<MedicineDto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Thêm thuốc mới
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Thuốc giảm đau');
  const [newPrice, setNewPrice] = useState<number>(50000);

  // 1. Fetch danh sách thuốc thời gian thực (TanStack Query)
  const { data: medicines = [], isLoading, isFetching } = useQuery<MedicineDto[]>({
    queryKey: QUERY_KEYS.medicines,
    queryFn: async () => {
      try {
        const res = await api.get('/v1/medicines/search');
        return res.data;
      } catch {
        const res = await api.get('/medicines');
        return res.data.map((m: any) => ({
          ...m,
          totalStock: m.stock !== undefined ? m.stock : (m.totalStock || 0),
        }));
      }
    },
  });

  // 2. Mutation Thêm thuốc mới
  const addMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; category: string; price: number }) => {
      return (await api.post('/medicines', payload)).data;
    },
    onSuccess: () => {
      invalidateMedicinesCache();
      setIsAddModalOpen(false);
      setNewId('');
      setNewName('');
      alert('Thêm thuốc mới thành công! Dữ liệu đã đồng bộ tức thì sang Storefront.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Lỗi khi thêm sản phẩm');
    },
  });

  // 3. Mutation Cập nhật thuốc & giá bán
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; category?: string; price: number } }) => {
      return (await api.put(`/medicines/${id}`, data)).data;
    },
    onSuccess: () => {
      // Invalidate cache: Ngay lập tức Storefront cập nhật giá mới
      invalidateMedicinesCache();
      setEditingMedicine(null);
      alert('Cập nhật thông tin và giá bán thành công! Storefront đã nhận giá mới.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật sản phẩm');
    },
  });

  // 4. Mutation Xóa thuốc
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/medicines/${id}`)).data;
    },
    onSuccess: () => {
      invalidateMedicinesCache();
      alert('Đã xóa thuốc thành công! Storefront đã đồng bộ loại bỏ sản phẩm.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Không thể xóa thuốc (đang có lô hoặc hóa đơn tham chiếu)');
    },
  });

  // 5. Cập nhật tồn kho nhanh (Bật/Tắt trạng thái Hết Hàng để test đồng bộ nút Thêm Vào Giỏ)
  const toggleStockMutation = useMutation({
    mutationFn: async ({ medicineId, targetStock }: { medicineId: string; targetStock: number }) => {
      // Cập nhật lô đầu tiên của thuốc hoặc thêm lô thử nghiệm
      const batchesRes = await api.get('/batches');
      const batch = batchesRes.data.find((b: any) => b.medicineId === medicineId);
      if (batch) {
        return (await api.put(`/batches/${batch.id}`, { ...batch, quantity: targetStock })).data;
      }
      return null;
    },
    onSuccess: () => {
      invalidateMedicinesCache();
      alert('Đã cập nhật tồn kho! Nút "Thêm vào giỏ" ở Storefront đã được đồng bộ trạng thái.');
    },
  });

  const filtered = medicines.filter((m) =>
    `${m.name} ${m.id} ${m.category || ''}`.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Quản Lý Sản Phẩm, Giá Bán & Tồn Kho
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Tất cả thay đổi tại đây được Invalidate Cache và đồng bộ thời gian thực sang trang Storefront của khách hàng.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: '#0f766e',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(15,118,110,0.25)',
            }}
          >
            + Thêm Thuốc Mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Tìm theo mã thuốc hoặc tên thuốc..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 340, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
        />
        <div style={{ fontSize: 13, color: '#64748b' }}>
          {isFetching ? '🔄 Đang đồng bộ CSDL...' : `Hiển thị ${filtered.length} sản phẩm`}
        </div>
      </div>

      {/* Medicines Table */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
            <tr>
              <th style={{ padding: '14px 18px' }}>Mã Thuốc</th>
              <th style={{ padding: '14px 18px' }}>Tên Sản Phẩm</th>
              <th style={{ padding: '14px 18px' }}>Phân Loại</th>
              <th style={{ padding: '14px 18px' }}>Giá Bán (VND)</th>
              <th style={{ padding: '14px 18px' }}>Tồn Khả Dụng</th>
              <th style={{ padding: '14px 18px' }}>Trạng Thái</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Đang tải danh sách thuốc...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Không tìm thấy thuốc nào phù hợp.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const isOutOfStock = m.totalStock <= 0;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f766e' }}>
                      <code>{m.id}</code>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                      {m.activeIngredientName && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          🧪 {m.activeIngredientName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      {m.category || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f766e', fontSize: 14 }}>
                      {currency.format(m.price)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isOutOfStock ? '#dc2626' : m.totalStock <= 20 ? '#d97706' : '#16a34a',
                        }}
                      >
                        {m.totalStock} hộp
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {isOutOfStock ? (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          HẾT HÀNG
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          KINH DOANH
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setEditingMedicine(m)}
                          style={{
                            padding: '6px 10px',
                            background: '#f0fdfa',
                            border: '1px solid #ccfbf1',
                            color: '#0f766e',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Sửa giá
                        </button>

                        {/* Nút chuyển trạng thái nhanh */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleStockMutation.mutate({
                              medicineId: m.id,
                              targetStock: isOutOfStock ? 50 : 0,
                            })
                          }
                          style={{
                            padding: '6px 10px',
                            background: isOutOfStock ? '#ecfdf5' : '#fffbeb',
                            border: isOutOfStock ? '1px solid #a7f3d0' : '1px solid #fde68a',
                            color: isOutOfStock ? '#047857' : '#b45309',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {isOutOfStock ? '⚡ Bật Còn Hàng' : '⚡ Set Hết Hàng'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xóa thuốc ${m.name} (${m.id})?`)) {
                              deleteMutation.mutate(m.id);
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            color: '#b91c1c',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          🗑️
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

      {/* Edit Medicine Modal */}
      {editingMedicine && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
              Sửa Thuốc & Đổi Giá Bán ({editingMedicine.id})
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: editingMedicine.id,
                  data: {
                    name: editingMedicine.name,
                    category: editingMedicine.category,
                    price: Number(editingMedicine.price),
                  },
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Tên thuốc
                </label>
                <input
                  type="text"
                  required
                  value={editingMedicine.name}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Phân loại
                </label>
                <input
                  type="text"
                  value={editingMedicine.category || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, category: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Giá bán lẻ (VND) - Sẽ đổi giá ngay tại Storefront
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={editingMedicine.price}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, price: Number(e.target.value) })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, color: '#0f766e', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingMedicine(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  style={{ padding: '9px 18px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                >
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px', color: '#0f172a' }}>
              Thêm Thuốc Mới Vào CSDL
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate({
                  id: newId.trim(),
                  name: newName.trim(),
                  category: newCategory.trim(),
                  price: Number(newPrice),
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Mã thuốc (ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: SP016"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Tên thuốc & quy cách *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hapacol Extra (Hộp 100 viên)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Phân loại
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Giá bán lẻ (VND) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, color: '#0f766e', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  style={{ padding: '9px 18px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                >
                  {addMutation.isPending ? 'Đang thêm...' : 'Thêm Sản Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
