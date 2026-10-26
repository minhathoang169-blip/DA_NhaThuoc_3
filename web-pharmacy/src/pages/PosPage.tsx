import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, AlertTriangle, 
  Printer, User, CreditCard, Banknote, QrCode, Tag, FileText, ArrowRight,
  ShieldAlert, PackageCheck, Pill, RefreshCw, Sparkles, UserPlus
} from 'lucide-react';
import api from '../services/api';
import { invalidateMedicinesCache } from '../services/queryClient';
import { MedicineInventoryItem, PosCheckoutRequest, PosCheckoutResponse, CustomerResponse, CustomerRequest } from '../types/pharmacy';

interface CartItem {
  medicine: MedicineInventoryItem;
  quantity: number;
}

const PosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Khách Lẻ Vãng Lai');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_TRANSFER' | 'CARD'>('CASH');
  const [customerPaid, setCustomerPaid] = useState<string>('');
  const [discountAmountInput, setDiscountAmountInput] = useState<string>('0');
  const [completedInvoice, setCompletedInvoice] = useState<PosCheckoutResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Quick customer creation modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<CustomerRequest>({
    id: '',
    name: '',
    phone: '',
    address: '',
  });
  const [customerModalError, setCustomerModalError] = useState<string | null>(null);

  // Auto focus search input on mount or F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Fetch Medicines Inventory from Backend (/api/v1/medicines/search)
  const { data: medicines = [], isLoading, isError, refetch } = useQuery<MedicineInventoryItem[]>({
    queryKey: ['pos-medicines'],
    queryFn: async () => {
      const response = await api.get('/v1/medicines/search?q=');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // 2. Fetch Customers from KhachHang table (/api/customers)
  const { data: customers = [] } = useQuery<CustomerResponse[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  // Create new customer in KhachHang table
  const createCustomerMutation = useMutation({
    mutationFn: async (payload: CustomerRequest) => {
      const response = await api.post<CustomerResponse>('/customers', payload);
      return response.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomerId(created.id);
      setCustomerName(created.name);
      setCustomerPhone(created.phone || '');
      setIsNewCustomerModalOpen(false);
      setNewCustomerForm({ id: '', name: '', phone: '', address: '' });
      setCustomerModalError(null);
    },
    onError: (err: any) => {
      setCustomerModalError(err.response?.data?.message || 'Không thể thêm khách hàng mới.');
    },
  });

  // Dynamic categories from database SanPham.LoaiSanPham
  const categories = useMemo(() => {
    const uniqueCats = Array.from(
      new Set(medicines.map((m) => m.category).filter((c): c is string => Boolean(c && c.trim())))
    );
    return uniqueCats;
  }, [medicines]);

  // Filtered list based on search & dynamic category (Safe null/undefined checks)
  const filteredMedicines = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return medicines.filter((item) => {
      const idStr = String(item.id || '').toLowerCase();
      const nameStr = String(item.name || '').toLowerCase();
      const catStr = String(item.category || '').toLowerCase();
      const activeIng = String(item.activeIngredientName || '').toLowerCase();

      const matchesSearch =
        !kw ||
        nameStr.includes(kw) ||
        idStr.includes(kw) ||
        catStr.includes(kw) ||
        activeIng.includes(kw);

      if (selectedCategory === 'ALL') return matchesSearch;
      if (selectedCategory === 'IN_STOCK') return matchesSearch && Number(item.totalStock ?? 0) > 0;
      return matchesSearch && item.category === selectedCategory;
    });
  }, [medicines, searchKeyword, selectedCategory]);

  // Handle customer selection from dropdown
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName('Khách Lẻ Vãng Lai');
      setCustomerPhone('');
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
    }
  };

  // Cart Operations
  const addToCart = (medicine: MedicineInventoryItem) => {
    setCheckoutError(null);
    const availStock = Number(medicine.totalStock ?? 0);
    if (availStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id);
      if (existing) {
        if (existing.quantity >= availStock) {
          setCheckoutError(`Thuốc "${medicine.name}" chỉ còn tối đa ${availStock} đơn vị khả dụng trong kho!`);
          return prev;
        }
        return prev.map((item) =>
          item.medicine.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine, quantity: 1 }];
    });
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCheckoutError(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id !== medicineId) return item;
          const availStock = Number(item.medicine.totalStock ?? 0);
          const newQty = item.quantity + delta;
          if (newQty > availStock) {
            setCheckoutError(`Vượt quá số lượng tồn kho khả dụng (${availStock} đơn vị)!`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setDirectQuantity = (medicineId: string, qtyStr: string) => {
    setCheckoutError(null);
    const parsed = parseInt(qtyStr, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.medicine.id !== medicineId) return item;
        const availStock = Number(item.medicine.totalStock ?? 0);
        if (parsed > availStock) {
          setCheckoutError(`Chỉ còn ${availStock} đơn vị trong kho!`);
          return { ...item, quantity: availStock };
        }
        return { ...item, quantity: parsed };
      })
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicine.id !== medicineId));
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutError(null);
    setCustomerPaid('');
    setDiscountAmountInput('0');
  };

  // Calculations
  const subTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.medicine.price ?? 0) * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const parsed = parseFloat(discountAmountInput) || 0;
    return Math.min(Math.max(0, parsed), subTotal);
  }, [discountAmountInput, subTotal]);

  const finalTotal = Math.max(0, subTotal - discountAmount);

  const paidAmountNum = useMemo(() => {
    const num = parseFloat(customerPaid.replace(/,/g, ''));
    return isNaN(num) ? finalTotal : num;
  }, [customerPaid, finalTotal]);

  const changeDue = Math.max(0, paidAmountNum - finalTotal);

  // Quick Cash Suggestions
  const quickCashAmounts = useMemo(() => {
    if (finalTotal === 0) return [];
    const base = finalTotal;
    const round50k = Math.ceil(base / 50000) * 50000;
    const round100k = Math.ceil(base / 100000) * 100000;
    const round200k = Math.ceil(base / 200000) * 200000;
    const round500k = Math.ceil(base / 500000) * 500000;
    return Array.from(new Set([base, round50k, round100k, round200k, round500k])).slice(0, 4);
  }, [finalTotal]);

  // 3. Checkout Mutation (Calls FEFO PosService on Backend: POST /api/v1/pos/checkout)
  const checkoutMutation = useMutation({
    mutationFn: async (payload: PosCheckoutRequest) => {
      const response = await api.post<PosCheckoutResponse>('/v1/pos/checkout', payload);
      return response.data;
    },
    onSuccess: (data) => {
      setCompletedInvoice(data);
      clearCart();
      invalidateMedicinesCache(queryClient);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán và phân bổ lô thuốc FEFO!';
      setCheckoutError(msg);
    },
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && paidAmountNum < finalTotal) {
      setCheckoutError('Số tiền khách đưa chưa đủ để thanh toán đơn hàng!');
      return;
    }

    const payload: PosCheckoutRequest = {
      customerName: customerName.trim() || 'Khách Lẻ Vãng Lai',
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      discountAmount,
      customerPaid: paymentMethod === 'CASH' ? paidAmountNum : finalTotal,
      items: cart.map((c) => ({
        medicineId: c.medicine.id,
        quantity: c.quantity,
      })),
    };

    checkoutMutation.mutate(payload);
  };

  const openQuickNewCustomerModal = () => {
    const nextNum = customers.length + 1;
    const suggestedId = `KH${String(nextNum).padStart(3, '0')}`;
    setNewCustomerForm({
      id: suggestedId,
      name: customerName !== 'Khách Lẻ Vãng Lai' ? customerName : '',
      phone: customerPhone,
      address: '',
    });
    setCustomerModalError(null);
    setIsNewCustomerModalOpen(true);
  };

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.id.trim() || !newCustomerForm.name.trim()) {
      setCustomerModalError('Vui lòng nhập đầy đủ Mã KH và Họ tên khách hàng.');
      return;
    }
    createCustomerMutation.mutate({
      id: newCustomerForm.id.trim(),
      name: newCustomerForm.name.trim(),
      phone: newCustomerForm.phone.trim(),
      address: newCustomerForm.address.trim(),
    });
  };

  // Format currency
  const formatVND = (val: number) => new Intl.NumberFormat('vi-VN').format(Number(val || 0)) + ' ₫';

  // Extract allocations safely from PosCheckoutResponse
  const receiptAllocations = completedInvoice?.allocations || [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4 bg-slate-100 overflow-hidden select-none">
      
      {/* ===================================================================== */}
      {/* LEFT PANEL: MEDICINE SEARCH & INVENTORY CATALOG (60% width)           */}
      {/* ===================================================================== */}
      <div className="lg:w-7/12 xl:w-8/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Search Header & Dynamic Filter Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                data-testid="pos-search-input"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm tên thuốc, mã SP (SP001...), loại sản phẩm... [Nhấn F2]"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                >
                  Xóa
                </button>
              )}
            </div>

            <button
              onClick={() => refetch()}
              title="Làm mới tồn kho từ CSDL"
              className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Dynamic Category Pills from Database */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({medicines.length})
            </button>
            <button
              onClick={() => setSelectedCategory('IN_STOCK')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'IN_STOCK'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Còn tồn kho ({medicines.filter((m) => Number(m.totalStock ?? 0) > 0).length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({medicines.filter((m) => m.category === cat).length})
              </button>
            ))}
          </div>
        </div>

        {/* Medicine Grid List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-xl p-4 border border-slate-200/60" />
              ))}
            </div>
          ) : isError ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
              <p className="text-slate-700 font-semibold">Không thể tải danh mục thuốc từ máy chủ</p>
              <p className="text-slate-400 text-sm mt-1">Vui lòng kiểm tra kết nối Backend Spring Boot</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Thử lại ngay
              </button>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Pill className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-slate-600 font-medium">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-slate-400 text-xs mt-1">Thử tìm kiếm bằng mã sản phẩm (VD: SP001) hoặc tên thuốc</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredMedicines.map((med) => {
                const availStock = Number(med.totalStock ?? 0);
                const isOutOfStock = availStock <= 0;
                const inCartItem = cart.find((c) => c.medicine.id === med.id);

                return (
                  <div
                    key={med.id}
                    data-testid={`medicine-item-${med.id}`}
                    onClick={() => !isOutOfStock && addToCart(med)}
                    className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : inCartItem
                        ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/15 cursor-pointer shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Top Row: Code + Category Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {med.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {med.category || 'Chưa phân loại'}
                        </span>
                      </div>

                      {/* Medicine Name */}
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {med.name}
                      </h3>

                      {/* Nearest Expiry info from LoThuoc */}
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        HSD gần nhất: <span className="font-medium text-slate-600">{med.nearestExpiry || 'Chưa có lô'}</span>
                      </p>
                    </div>

                    {/* Bottom Row: Price & Stock Status */}
                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Giá bán lẻ</span>
                        <span className="text-base font-extrabold text-blue-600">
                          {formatVND(med.price)}
                        </span>
                      </div>

                      <div className="text-right flex items-center gap-1.5">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                            Hết hàng
                          </span>
                        ) : (
                          <>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                                availStock < 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Tồn: <strong>{availStock}</strong> đv
                            </span>
                            <button
                              type="button"
                              data-testid={`btn-add-${med.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(med);
                              }}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                              title="Thêm vào đơn"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Active Cart Quantity Badge */}
                    {inCartItem && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                        {inCartItem.quantity}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              Thuật toán <strong>FEFO (First Expired, First Out)</strong> tự động xuất lô có hạn sử dụng gần nhất trong bảng <code className="font-mono text-slate-700">LoThuoc</code>.
            </span>
          </div>
          <span className="font-medium text-slate-600">
            Hiển thị {filteredMedicines.length} / {medicines.length} sản phẩm
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT PANEL: CART & FEFO CHECKOUT BILLING (40% width)                 */}
      {/* ===================================================================== */}
      <div className="lg:w-5/12 xl:w-4/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Customer Header (Integrated with KhachHang /api/customers) */}
        <div className="p-4 bg-slate-900 text-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-base tracking-tight">Hóa Đơn Bán Lẻ (POS)</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1 px-2 py-1 rounded bg-rose-950/50 hover:bg-rose-900/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hủy giỏ ({cart.length})
              </button>
            )}
          </div>

          {/* Select existing customer from KhachHang DB or add new */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
            >
              <option value="">-- Khách Lẻ Vãng Lai (Hoặc chọn khách hàng) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.id}] {c.name} {c.phone ? `- ${c.phone}` : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openQuickNewCustomerModal}
              title="Lưu khách hàng mới vào bảng KhachHang"
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" /> +KH
            </button>
          </div>

          {/* Customer Quick Input */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tên khách hàng..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Số điện thoại khách..."
              className="w-full px-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Error Alert Banner */}
        {checkoutError && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{checkoutError}</div>
            <button onClick={() => setCheckoutError(null)} className="text-rose-400 hover:text-rose-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div data-testid="empty-cart-message" className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Chưa có thuốc trong hóa đơn</p>
              <p className="text-xs mt-1 max-w-[220px]">
                Chọn sản phẩm ở danh mục bên trái để thêm vào đơn
              </p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.medicine.id} data-testid={`cart-item-${item.medicine.id}`} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.medicine.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>{formatVND(item.medicine.price)} / đv</span>
                    <span className="text-emerald-600 font-medium">
                      • HSD: {item.medicine.nearestExpiry || 'FEFO'}
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    data-testid={`btn-decrease-${item.medicine.id}`}
                    onClick={() => updateQuantity(item.medicine.id, -1)}
                    className="w-6 h-6 rounded bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={item.medicine.totalStock}
                    value={item.quantity}
                    onChange={(e) => setDirectQuantity(item.medicine.id, e.target.value)}
                    className="w-10 text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    data-testid={`btn-increase-${item.medicine.id}`}
                    onClick={() => updateQuantity(item.medicine.id, 1)}
                    className="w-6 h-6 rounded bg-white text-slate-600 hover:bg-slate-200 flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total & Remove */}
                <div className="text-right min-w-[85px]">
                  <div className="text-xs font-bold text-slate-900">
                    {formatVND(Number(item.medicine.price ?? 0) * item.quantity)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.medicine.id)}
                    className="text-[10px] text-rose-500 hover:underline mt-0.5 cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Billing Summary & Payment Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Subtotals & Discount Input */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tổng tiền hàng ({cart.reduce((s, i) => s + i.quantity, 0)} đơn vị):</span>
              <span className="font-semibold text-slate-800">{formatVND(subTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Chiết khấu / Giảm giá (VNĐ):
              </span>
              <input
                type="number"
                min={0}
                step={1000}
                value={discountAmountInput}
                onChange={(e) => setDiscountAmountInput(e.target.value)}
                className="w-28 px-2 py-1 text-right bg-white border border-slate-300 rounded-md text-xs font-semibold text-emerald-700 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-800">KHÁCH CẦN TRẢ:</span>
              <span data-testid="final-total" className="text-xl font-black text-blue-600 tracking-tight">
                {formatVND(finalTotal)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', label: 'Tiền mặt', icon: Banknote },
              { id: 'QR_TRANSFER', label: 'Chuyển khoản QR', icon: QrCode },
              { id: 'CARD', label: 'Thẻ ATM/Visa', icon: CreditCard },
            ].map((pm) => {
              const Icon = pm.icon;
              const active = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Tendered Input (Only if CASH) */}
          {paymentMethod === 'CASH' && cart.length > 0 && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600">Tiền khách đưa:</span>
                <input
                  type="number"
                  data-testid="customer-paid-input"
                  value={customerPaid}
                  onChange={(e) => setCustomerPaid(e.target.value)}
                  placeholder={finalTotal.toString()}
                  className="w-36 text-right px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quick denominations */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickCashAmounts.map((amt, index) => (
                  <button
                    key={amt}
                    type="button"
                    data-testid={index === 0 ? 'btn-exact-pay' : `btn-quick-cash-${amt}`}
                    onClick={() => setCustomerPaid(amt.toString())}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    {amt === finalTotal ? 'Đủ tiền' : formatVND(amt)}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Tiền thừa trả khách:</span>
                <span className="font-bold text-emerald-600 text-sm">{formatVND(changeDue)}</span>
              </div>
            </div>
          )}

          {/* Submit Checkout Button */}
          <button
            data-testid="checkout-button"
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutMutation.isPending}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              cart.length === 0 || checkoutMutation.isPending
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25 active:scale-[0.99]'
            }`}
          >
            {checkoutMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang phân bổ lô FEFO & Tạo Hóa Đơn...</span>
              </>
            ) : (
              <>
                <span>THANH TOÁN & XUẤT KHO FEFO</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: QUICK CREATE CUSTOMER IN KHACHHANG TABLE                     */}
      {/* ===================================================================== */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Thêm Khách Hàng Mới (Bảng KhachHang)</h3>
              </div>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCustomerSubmit} className="p-5 space-y-4">
              {customerModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {customerModalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã Khách Hàng (MaKhachHang) *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newCustomerForm.id}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, id: e.target.value })}
                  placeholder="VD: KH004"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên Khách Hàng (TenKhachHang) *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="Nhập họ tên khách hàng..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại (SoDienThoai)</label>
                <input
                  type="text"
                  maxLength={20}
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="VD: 0912345678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ (DiaChi)</label>
                <input
                  type="text"
                  maxLength={50}
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  placeholder="Nhập địa chỉ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {createCustomerMutation.isPending ? 'Đang lưu...' : 'Lưu Khách Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: FEFO RECEIPT & BATCH ALLOCATION RESULT                       */}
      {/* ===================================================================== */}
      {completedInvoice && (
        <div data-testid="receipt-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-emerald-600 p-5 text-white text-center relative">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-extrabold">Thanh Toán Thành Công!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Mã hóa đơn: <span className="font-mono font-bold underline">{completedInvoice.invoiceNumber}</span>
              </p>
            </div>

            {/* Receipt Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block">Khách hàng:</span>
                  <strong className="text-slate-800">{completedInvoice.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Phương thức:</span>
                  <strong className="text-slate-800">{completedInvoice.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Thời gian:</span>
                  <strong className="text-slate-800">
                    {completedInvoice.saleDate ? new Date(completedInvoice.saleDate).toLocaleString('vi-VN') : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Trạng thái kho:</span>
                  <strong className="text-emerald-600 flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5" /> Đã trừ tồn FEFO
                  </strong>
                </div>
              </div>

              {/* FEFO Batch Allocations Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Chi tiết Lô Thuốc Đã Xuất (FEFO Automatic Allocation)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <th className="py-2 px-3 font-semibold">Tên thuốc</th>
                        <th className="py-2 px-2 font-semibold">Mã Lô / Số Lô</th>
                        <th className="py-2 px-2 font-semibold">Hạn SD</th>
                        <th className="py-2 px-2 font-semibold text-center">SL</th>
                        <th className="py-2 px-3 font-semibold text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptAllocations.map((alloc, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{alloc.medicineName}</td>
                          <td className="py-2 px-2">
                            <span className="font-mono text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold border border-blue-200">
                              {alloc.batchId} ({alloc.batchNumber})
                            </span>
                          </td>
                          <td className="py-2 px-2 text-slate-600 font-mono text-[11px]">
                            {alloc.expiryDate}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-slate-800">
                            {alloc.quantityAllocated}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">
                            {formatVND(alloc.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Tổng tiền hàng:</span>
                  <span>{formatVND(completedInvoice.subtotal)}</span>
                </div>
                {completedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Chiết khấu:</span>
                    <span>-{formatVND(completedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-slate-700">
                  <span>TỔNG THANH TOÁN:</span>
                  <span className="text-amber-400 text-base">{formatVND(completedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Khách thanh toán:</span>
                  <span>{formatVND(completedInvoice.customerPaid)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Tiền thừa trả khách:</span>
                  <span>{formatVND(completedInvoice.changeAmount)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In Hóa Đơn Nhiệt (K80)
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Đơn Hàng Mới (Tiếp tục)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPage;
