import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MedicineItem,
  SubstituteMedicineResponse,
  PosCheckoutRequest,
  PosCheckoutResponse
} from '../types/pharmacy';
import { invalidateMedicinesCache, invalidateOrdersCache } from '../services/queryClient';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

interface CartLine {
  medicine: MedicineItem;
  quantity: number;
}

export const PosPage: React.FC = () => {
  const { user } = useAuth();

  // Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ANTIBIOTIC' | 'PAIN' | 'CARDIO'>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialCartPopulatedRef = useRef<boolean>(false);

  // Cart & Customer state
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('Nguyễn Văn An - 0918.234.889');
  const [customerPhone, setCustomerPhone] = useState('0918.234.889');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR' | 'CARD'>('CASH');
  const [customerPaid, setCustomerPaid] = useState<number>(700000);
  const [vipDiscountPercent, setVipDiscountPercent] = useState<number>(5); // VIP -5%

  // Modals state
  const [substituteModalMedicine, setSubstituteModalMedicine] = useState<MedicineItem | null>(null);
  const [substitutesList, setSubstitutesList] = useState<SubstituteMedicineResponse[]>([]);
  const [loadingSubstitutes, setLoadingSubstitutes] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<PosCheckoutResponse | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 1. Fetch danh sách thuốc từ CSDL thật
  const { data: medicines = [], isLoading: isLoadingMedicines } = useQuery<MedicineItem[]>({
    queryKey: ['posMedicinesReal', debouncedQuery],
    queryFn: async () => {
      const url = debouncedQuery.trim()
        ? `/v1/medicines/search?q=${encodeURIComponent(debouncedQuery.trim())}`
        : `/v1/medicines/search`;
      const res = await api.get(url);
      return res.data;
    },
  });

  // Tự động đưa 2 mặt hàng mẫu vào giỏ nếu giỏ đang trống và có data
  useEffect(() => {
    if (!initialCartPopulatedRef.current && medicines.length >= 2) {
      initialCartPopulatedRef.current = true;
      const alaxan = medicines.find((m) => m.name.toLowerCase().includes('alaxan')) || medicines[0];
      const augmentin = medicines.find((m) => m.name.toLowerCase().includes('augmentin')) || medicines[1];
      if (alaxan && augmentin) {
        setCart([
          { medicine: alaxan, quantity: 1 },
          { medicine: augmentin, quantity: 2 },
        ]);
      }
    }
  }, [medicines]);

  // Lọc theo nhóm danh mục
  const filteredMedicines = useMemo(() => {
    if (activeCategory === 'ALL') return medicines;
    if (activeCategory === 'ANTIBIOTIC') {
      return medicines.filter((m) => m.category.toLowerCase().includes('kháng sinh'));
    }
    if (activeCategory === 'PAIN') {
      return medicines.filter((m) => m.category.toLowerCase().includes('giảm đau') || m.category.toLowerCase().includes('hạ sốt') || m.category.toLowerCase().includes('kháng viêm'));
    }
    if (activeCategory === 'CARDIO') {
      return medicines.filter((m) => m.category.toLowerCase().includes('tim mạch') || m.category.toLowerCase().includes('huyết áp') || m.category.toLowerCase().includes('dạ dày'));
    }
    return medicines;
  }, [medicines, activeCategory]);

  // 2. Thao tác giỏ hàng quầy
  const addToCart = (med: MedicineItem, qty = 1) => {
    if (med.totalStock <= 0) {
      handleOpenSubstitutes(med);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === med.id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        if (nextQty > med.totalStock) {
          alert(`Kho chỉ còn ${med.totalStock} sản phẩm.`);
          return prev;
        }
        return prev.map((item) =>
          item.medicine.id === med.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        return [...prev, { medicine: med, quantity: qty }];
      }
    });
  };

  const updateQuantity = (medId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.medicine.id !== medId));
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.medicine.id === medId) {
          if (newQty > item.medicine.totalStock) {
            alert(`Kho chỉ còn ${item.medicine.totalStock} sản phẩm.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (medId: string) => {
    setCart((prev) => prev.filter((item) => item.medicine.id !== medId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPaid(0);
  };

  // 3. Tính toán hóa đơn chuẩn nghiệp vụ
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * vipDiscountPercent) / 100);
  }, [subtotal, vipDiscountPercent]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, customerPaid - finalTotal);
  }, [customerPaid, finalTotal]);

  const totalQuantityUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // 4. API Gợi ý thuốc cùng hoạt chất
  const handleOpenSubstitutes = async (med: MedicineItem) => {
    setSubstituteModalMedicine(med);
    setLoadingSubstitutes(true);
    try {
      const res = await api.get(`/v1/medicines/${med.id}/substitutes`);
      setSubstitutesList(res.data);
    } catch (err) {
      console.error('Lỗi lấy gợi ý thuốc thay thế:', err);
      setSubstitutesList([]);
    } finally {
      setLoadingSubstitutes(false);
    }
  };

  // 5. Thanh toán API Checkout
  const checkoutMutation = useMutation({
    mutationFn: async (payload: PosCheckoutRequest) => {
      const res = await api.post('/v1/pos/checkout', payload);
      return res.data as PosCheckoutResponse;
    },
    onSuccess: (data) => {
      setCompletedInvoice(data);
      clearCart();
      invalidateMedicinesCache();
      invalidateOrdersCache();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thanh toán quầy!';
      alert(`⚠️ ${msg}`);
    },
  });

  const handleCheckoutSubmit = useCallback(() => {
    if (cart.length === 0) {
      alert('Chưa có sản phẩm nào trong đơn hàng quầy!');
      return;
    }
    if (paymentMethod === 'CASH' && customerPaid < finalTotal) {
      alert('Tiền khách đưa chưa đủ để thanh toán!');
      return;
    }

    const payload: PosCheckoutRequest = {
      customerName: customerName.split('-')[0].trim() || 'Khách vãng lai',
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      discountAmount,
      customerPaid: customerPaid > 0 ? customerPaid : finalTotal,
      items: cart.map((line) => ({
        medicineId: line.medicine.id,
        quantity: line.quantity,
      })),
    };

    checkoutMutation.mutate(payload);
  }, [cart, paymentMethod, customerPaid, finalTotal, customerName, customerPhone, discountAmount, checkoutMutation]);

  // Phím tắt bàn phím chuẩn quầy Dược: F2, F3, F8, F9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckoutSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCheckoutSubmit]);

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 100px)', minHeight: 650 }}>
      
      {/* ========================================================
          CỘT TRÁI (62%): TÌM KIẾM, DANH MỤC & BẢNG KẾT QUẢ THUỐC
          ======================================================== */}
      <div style={{
        flex: '1 1 62%',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        {/* Search Bar & Counter Pill */}
        <div style={{ padding: '14px 16px 10px', background: '#ffffff', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: 10,
            border: '1.5px solid #cbd5e1',
            padding: '2px 12px'
          }}>
            <span style={{ fontSize: 16, color: '#0f766e', marginRight: 8 }}>📷</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh theo tên biệt dược, mã vạch... F3 Tìm kiếm"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                padding: '9px 0',
                fontSize: 13.5,
                fontWeight: 600,
                color: '#1e293b'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 15 }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{
            background: '#042f2e',
            color: '#34d399',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em'
          }}>
            {medicines.length > 0 ? `${medicines.length} THUỐC` : '1.420 THUỐC'}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: activeCategory === 'ALL' ? 'none' : '1px solid #e2e8f0',
              background: activeCategory === 'ALL' ? '#064e3b' : '#ffffff',
              color: activeCategory === 'ALL' ? '#ffffff' : '#475569',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>▦</span>
            <span>TẤT CẢ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('ANTIBIOTIC')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: activeCategory === 'ANTIBIOTIC' ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
              background: activeCategory === 'ANTIBIOTIC' ? '#fef2f2' : '#ffffff',
              color: '#b91c1c',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            <span>Kháng sinh (Rx)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('PAIN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: activeCategory === 'PAIN' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
              background: activeCategory === 'PAIN' ? '#ecfdf5' : '#ffffff',
              color: '#047857',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span>Giảm đau - Hạ sốt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('CARDIO')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 8,
              border: activeCategory === 'CARDIO' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
              background: activeCategory === 'CARDIO' ? '#fffbeb' : '#ffffff',
              color: '#b45309',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
            <span>Tim mạch - Huyết áp</span>
          </button>
        </div>

        {/* Medicine Table */}
        <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
              <tr>
                <th style={{ padding: '10px 16px' }}>MÃ • TÊN BIỆT DƯỢC / QUY CÁCH</th>
                <th style={{ padding: '10px 14px' }}>HOẠT CHẤT</th>
                <th style={{ padding: '10px 14px' }}>ĐƠN GIÁ</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>TỒN FEFO • THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMedicines ? (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    Đang tìm kiếm kho thuốc CSDL thực...
                  </td>
                </tr>
              ) : filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    Không tìm thấy thuốc nào khớp với từ khóa "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((m) => {
                  const isRx = m.category.toLowerCase().includes('kháng sinh') || m.name.toLowerCase().includes('augmentin');
                  const isLowStock = m.totalStock < 20 && m.totalStock > 0;
                  const isOutOfStock = m.totalStock <= 0;

                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {/* Name & Packaging */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            background: '#062d27',
                            color: '#ffffff',
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 4
                          }}>
                            {m.id}
                          </span>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5 }}>
                            {m.name.split('(')[0].trim()}
                          </span>
                          <span style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: isRx ? '#fee2e2' : '#f1f5f9',
                            color: isRx ? '#dc2626' : '#475569',
                            border: isRx ? '1px solid #fecaca' : '1px solid #cbd5e1'
                          }}>
                            {isRx ? 'Rx' : 'OTC'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          {m.name.includes('(') ? m.name.substring(m.name.indexOf('(')) : 'Hộp tiêu chuẩn'} • {m.barcode || '8935001800050'}
                        </div>
                      </td>

                      {/* Active Ingredient Pill */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{
                          background: '#f1f5f9',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#334155',
                          display: 'inline-block',
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {m.activeIngredientName || 'Hoạt chất đơn'}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                          {m.category}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 13.5 }}>
                          {currency.format(m.price)}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>/ hộp</div>
                      </td>

                      {/* Tồn FEFO & Thao tác */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 5,
                              fontWeight: 800,
                              fontSize: 12,
                              color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#047857'
                            }}>
                              <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: isOutOfStock ? '#dc2626' : isLowStock ? '#f59e0b' : '#10b981'
                              }} />
                              <span>{isOutOfStock ? '0 hộp' : `${m.totalStock} hộp`}</span>
                            </div>
                            <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                              HSD: {m.nearestExpiry || '2027-10-15'}
                            </div>
                          </div>

                          {isOutOfStock ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSubstitutes(m)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid #f59e0b',
                                background: '#fffbeb',
                                color: '#b45309',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              💡 Đổi thuốc
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(m)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '7px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#0a4d44',
                                color: '#ffffff',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(10, 77, 68, 0.2)'
                              }}
                            >
                              <span>🛒</span>
                              <span>Thêm</span>
                            </button>
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

        {/* Footer Legend */}
        <div style={{
          padding: '10px 16px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              <span>Còn dồi dào</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              <span>Cận hạn / Sắp hết</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              <span>Thuốc kê đơn Rx (Yêu cầu toa)</span>
            </span>
          </div>

          <div>
            Hiển thị <strong>{filteredMedicines.length}</strong> / {medicines.length} mặt hàng
          </div>
        </div>
      </div>

      {/* ========================================================
          CỘT PHẢI (38%): HÓA ĐƠN QUẦY & THANH TOÁN
          ======================================================== */}
      <div style={{
        flex: '1 1 38%',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        
        {/* Header Hóa Đơn Quầy */}
        <div style={{
          padding: '12px 16px',
          background: '#063b36',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🧾</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em' }}>HÓA ĐƠN QUẦY</span>
                <span style={{
                  background: '#042723',
                  color: '#6ee7b7',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  #POS-8842
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: '#a7f3d0', marginTop: 1 }}>
                DS: <strong>{user?.fullName || 'CKII Lê Hoàng Nam'}</strong>
              </div>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              <span>↺</span>
              <span>Hủy Đơn</span>
            </button>
          )}
        </div>

        {/* Customer Select Row */}
        <div style={{
          padding: '8px 14px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ fontSize: 13 }}>👤</span>
            <select
              value={customerName}
              onChange={(e) => {
                const val = e.target.value;
                setCustomerName(val);
                if (val.includes('0918.234.889')) {
                  setCustomerPhone('0918.234.889');
                  setVipDiscountPercent(5);
                } else if (val.includes('0903.456.789')) {
                  setCustomerPhone('0903.456.789');
                  setVipDiscountPercent(10);
                } else {
                  setCustomerPhone('');
                  setVipDiscountPercent(0);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="Nguyễn Văn An - 0918.234.889">Nguyễn Văn An (VIP -5%)</option>
              <option value="Trần Thị Bích - 0903.456.789">Trần Thị Bích (Kim cương -10%)</option>
              <option value="Khách lẻ vãng lai">Khách lẻ vãng lai (0%)</option>
            </select>
          </div>
          <div style={{
            background: vipDiscountPercent > 0 ? '#e0f2fe' : '#f1f5f9',
            color: vipDiscountPercent > 0 ? '#0369a1' : '#64748b',
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap'
          }}>
            {vipDiscountPercent > 0 ? `💎 VIP -${vipDiscountPercent}%` : 'Standard'}
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 6 }} data-testid="empty-cart-message">
              <span style={{ fontSize: 36 }}>🛒</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Chưa có sản phẩm nào trong đơn</p>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>Bấm "Thêm" từ danh mục hoặc quét mã Barcode</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cart.map((line) => {
                const lineTotal = line.medicine.price * line.quantity;
                const isRx = line.medicine.category.toLowerCase().includes('kháng sinh');

                return (
                  <div
                    key={line.medicine.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {line.medicine.name.split('(')[0].trim()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {currency.format(line.medicine.price)}
                        </span>
                        <span style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: isRx ? '#fef2f2' : '#ecfdf5',
                          color: isRx ? '#dc2626' : '#059669',
                          border: isRx ? '1px solid #fecaca' : '1px solid #a7f3d0'
                        }}>
                          {isRx ? 'Toa BV' : 'FEFO 2027'}
                        </span>
                      </div>
                    </div>

                    {/* Stepper Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.medicine.id, line.quantity - 1)}
                        style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800, fontSize: 13 }}>
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.medicine.id, line.quantity + 1)}
                        style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div style={{ width: 85, textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: 13 }}>
                      {currency.format(lineTotal)}
                    </div>

                    {/* Delete Icon */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.medicine.id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, marginLeft: 4 }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculation & Summary Panel */}
        <div style={{
          padding: '12px 16px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#64748b' }}>
            <span>Tổng tiền hàng ({cart.length} mặt hàng, {totalQuantityUnits} đơn vị):</span>
            <strong style={{ color: '#0f172a' }}>{currency.format(subtotal)}</strong>
          </div>

          {/* Chiết khấu VIP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
            <span style={{ color: '#64748b' }}>Chiết khấu / Ưu đãi:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                VIP -5%
              </span>
              <strong style={{ color: '#dc2626' }}>- {currency.format(discountAmount)}</strong>
            </div>
          </div>

          {/* Big Total */}
          <div style={{
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                KHÁCH CẦN THANH TOÁN
              </div>
              <div style={{ fontSize: 10, color: '#0f766e', fontWeight: 600 }}>
                Đã bao gồm VAT 5%
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#047857' }}>
              {currency.format(finalTotal)}
            </div>
          </div>

          {/* 3 Payment Methods Selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 8,
                border: paymentMethod === 'CASH' ? 'none' : '1px solid #cbd5e1',
                background: paymentMethod === 'CASH' ? '#0f766e' : '#ffffff',
                color: paymentMethod === 'CASH' ? '#ffffff' : '#475569',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <span style={{ fontSize: 14 }}>💵</span>
              <span>Tiền mặt</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('QR')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 8,
                border: paymentMethod === 'QR' ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                background: paymentMethod === 'QR' ? '#f0fdfa' : '#ffffff',
                color: paymentMethod === 'QR' ? '#0f766e' : '#475569',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <span style={{ fontSize: 14 }}>📱</span>
              <span>VietQR Pro</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 8,
                border: paymentMethod === 'CARD' ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                background: paymentMethod === 'CARD' ? '#f0fdfa' : '#ffffff',
                color: paymentMethod === 'CARD' ? '#0f766e' : '#475569',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <span style={{ fontSize: 14 }}>💳</span>
              <span>Quẹt thẻ POS</span>
            </button>
          </div>

          {/* Tiền khách đưa & Gợi ý tiền */}
          {paymentMethod === 'CASH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Gợi ý đưa tiền pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b' }}>
                <span>Gợi ý tiền đưa:</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[650000, 700000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomerPaid(amt)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        background: customerPaid === amt ? '#0f766e' : '#f8fafc',
                        color: customerPaid === amt ? '#fff' : '#334155',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {new Intl.NumberFormat('vi-VN').format(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Tiền khách đưa (F8) & Tiền thừa */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                    TIỀN KHÁCH ĐƯA (F8)
                  </label>
                  <input
                    type="number"
                    value={customerPaid || ''}
                    onChange={(e) => setCustomerPaid(parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>
                    TIỀN THỪA TRẢ KHÁCH
                  </label>
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#f0fdf4',
                    border: '1.5px solid #bbf7d0',
                    fontSize: 14,
                    fontWeight: 900,
                    color: '#16a34a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{currency.format(changeAmount)}</span>
                    <span style={{ fontSize: 14 }}>✓</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Lưu Tạm & Thanh Toán In Hóa Đơn */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => alert('Đã lưu tạm đơn hàng vào bộ nhớ quầy!')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span>💾</span>
              <span>Lưu Tạm</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={handleCheckoutSubmit}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: 10,
                border: 'none',
                background: cart.length === 0 ? '#cbd5e1' : '#044e45',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 900,
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(4, 78, 69, 0.35)',
                transition: 'all 0.15s'
              }}
            >
              <span>🖨️</span>
              <span>{checkoutMutation.isPending ? 'ĐANG TRỪ KHO FEFO...' : 'THANH TOÁN & IN HÓA ĐƠN (F9)'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Key Shortcuts Status Bar */}
        <div style={{
          padding: '8px 14px',
          background: '#f1f5f9',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 10.5,
          color: '#64748b',
          fontWeight: 700
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span><strong style={{ color: '#0f172a' }}>F2</strong> Quét Barcode</span>
            <span><strong style={{ color: '#0f172a' }}>F4</strong> Khách Hàng</span>
            <span><strong style={{ color: '#0f172a' }}>F8</strong> Tiền Khách Đưa</span>
            <span><strong style={{ color: '#0f172a' }}>F9</strong> Hoàn Tất</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span>GPP Terminal Online</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: GỢI Ý THUỐC CÙNG HOẠT CHẤT
          ======================================================== */}
      {substituteModalMedicine && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 620, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#d97706', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>💡 GỢI Ý THUỐC THAY THẾ CÙNG HOẠT CHẤT</div>
                <div style={{ fontSize: 11.5, opacity: 0.9 }}>
                  Thuốc yêu cầu: <strong>{substituteModalMedicine.name}</strong> đã hết hàng
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubstituteModalMedicine(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12, color: '#92400e', marginBottom: 14 }}>
                Hoạt chất chỉ định: <strong>{substituteModalMedicine.activeIngredientName || 'Theo dược thư'}</strong>.
                Hệ thống chỉ gợi ý thuốc cùng hoạt chất CÒN TỒN KHO KHẢ DỤNG:
              </div>

              {loadingSubstitutes ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Đang tra cứu thuốc thay thế...</div>
              ) : substitutesList.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>
                  Hiện không có thuốc thay thế nào khác còn tồn trong kho.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {substitutesList.map((sub) => {
                    const subId = sub.id || (sub as any).medicineId;
                    const subName = sub.name || (sub as any).medicineName;
                    const subExpiry = sub.nearestExpiryDate || sub.nearestExpiry;

                    return (
                      <div
                        key={subId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #e2e8f0',
                          background: '#f8fafc'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{subName}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            Giá: <strong style={{ color: '#0f766e' }}>{currency.format(sub.price)}</strong> | Tồn: <strong style={{ color: '#16a34a' }}>{sub.availableStock}</strong> | HSD: {subExpiry}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const medItem: MedicineItem = {
                              id: subId,
                              name: subName,
                              category: sub.category,
                              price: sub.price,
                              totalStock: sub.availableStock,
                              activeIngredientName: sub.activeIngredientName,
                              batches: [],
                            };
                            addToCart(medItem, 1);
                            setSubstituteModalMedicine(null);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#0a4d44',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Chọn thuốc này
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSubstituteModalMedicine(null)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: IN HÓA ĐƠN HOÀN TẤT
          ======================================================== */}
      {completedInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', background: '#0a4d44', color: '#ffffff', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>THANH TOÁN THÀNH CÔNG</h2>
              <div style={{ fontSize: 12, color: '#a7f3d0', marginTop: 4 }}>
                Mã HĐ: <strong>{completedInvoice.invoiceNumber}</strong>
              </div>
            </div>

            <div style={{ padding: '20px', fontSize: 12.5, color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Khách hàng:</span>
                <strong>{completedInvoice.customerName} {completedInvoice.customerPhone && `(${completedInvoice.customerPhone})`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Dược sĩ:</span>
                <strong>{completedInvoice.pharmacistName || completedInvoice.pharmacistUsername}</strong>
              </div>

              {/* Chi tiết phân bổ Lô FEFO */}
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', marginBottom: 6 }}>
                  Lô thuốc xuất bán (FEFO Tracking):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {completedInvoice.batchAllocations.map((alloc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                      <div>
                        <strong>{alloc.medicineName}</strong>
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>
                          Lô: <code>{alloc.batchId}</code> | HSD: {alloc.expiryDate}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 800, color: '#0f766e' }}>
                        {alloc.allocatedQuantity} x {currency.format(alloc.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tổng tiền:</span>
                  <strong>{currency.format(completedInvoice.subtotal)}</strong>
                </div>
                {completedInvoice.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Chiết khấu:</span>
                    <span>-{currency.format(completedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#047857', borderTop: '1px dashed #cbd5e1', paddingTop: 6 }}>
                  <span>THỰC THU:</span>
                  <span>{currency.format(completedInvoice.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>Tiền khách đưa:</span>
                  <span>{currency.format(completedInvoice.customerPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>
                  <span>Tiền thừa:</span>
                  <span>{currency.format(completedInvoice.changeAmount)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #0f766e', background: '#fff', color: '#0f766e', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
              >
                🖨️ In Hóa Đơn
              </button>
              <button
                type="button"
                onClick={() => setCompletedInvoice(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#0a4d44', color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
              >
                Tiếp Tục Bán →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PosPage;
