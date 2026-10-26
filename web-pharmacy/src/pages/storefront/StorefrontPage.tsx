import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { QUERY_KEYS, invalidateOrdersCache } from '../../services/queryClient';
import { CartItem } from './StorefrontLayout';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export interface MedicineDto {
  id: string;
  name: string;
  category?: string;
  price: number;
  barcode?: string;
  activeIngredientName?: string;
  totalStock: number;
  nearestExpiry?: string;
  batches?: Array<{ id: string; batchNumber: number; quantity: number; expiryDate: string }>;
}

export const StorefrontPage: React.FC<{
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}> = ({ cart, setCart, isCartOpen, setIsCartOpen }) => {
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [checkoutSuccess, setCheckoutSuccess] = useState<any | null>(null);

  // Form thanh toán online
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  // 1. Lấy danh mục sản phẩm theo thời gian thực (TanStack Query)
  const { data: medicines = [], isLoading, isError, refetch } = useQuery<MedicineDto[]>({
    queryKey: QUERY_KEYS.medicines,
    queryFn: async () => {
      try {
        const res = await api.get('/v1/medicines/search');
        return res.data;
      } catch {
        // Fallback sang endpoint /api/medicines
        const res = await api.get('/medicines');
        return res.data.map((m: any) => ({
          ...m,
          totalStock: m.stock !== undefined ? m.stock : (m.totalStock || 0),
        }));
      }
    },
  });

  // 2. Mutation Đặt hàng online
  const checkoutMutation = useMutation({
    mutationFn: async (orderPayload: any) => {
      const res = await api.post('/v1/orders/online-checkout', orderPayload);
      return res.data;
    },
    onSuccess: (data) => {
      // Đặt hàng thành công:
      // Invalidate cache toàn hệ thống: Tồn kho tự trừ, đơn hàng gửi sang Admin
      invalidateOrdersCache();
      setCart([]);
      setIsCartOpen(false);
      setCheckoutSuccess(data);
      setCheckoutError('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại số lượng tồn kho.';
      setCheckoutError(msg);
    },
  });

  // Lọc sản phẩm
  const categories = ['all', ...Array.from(new Set(medicines.map((m) => m.category).filter(Boolean)))];

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch = `${m.name} ${m.activeIngredientName || ''} ${m.barcode || ''}`
      .toLowerCase()
      .includes(keyword.toLowerCase().trim());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Thêm vào giỏ
  const handleAddToCart = (med: MedicineDto) => {
    if (med.totalStock <= 0) return; // Sản phẩm hết hàng thì chặn thêm

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.totalStock) {
          alert(`Số lượng đã đạt giới hạn tồn kho khả dụng (${med.totalStock} hộp)!`);
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          medicineId: med.id,
          name: med.name,
          price: med.price,
          quantity: 1,
          availableStock: med.totalStock,
          category: med.category,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicineId === medicineId) {
            const newQty = item.quantity + delta;
            if (newQty > item.availableStock) {
              alert(`Chỉ còn ${item.availableStock} sản phẩm trong kho!`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!receiverName.trim() || !receiverPhone.trim() || !shippingAddress.trim()) {
      setCheckoutError('Vui lòng điền đầy đủ thông tin nhận hàng.');
      return;
    }

    checkoutMutation.mutate({
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      items: cart.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
      })),
    });
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px' }}>
      {/* Hero Showcase */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #042f2e 100%)',
          borderRadius: 20,
          padding: '36px 32px',
          color: '#ffffff',
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.2)',
        }}
      >
        <span style={{ background: 'rgba(255,255,255,0.15)', color: '#99f6e4', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
          🌿 NHÀ THUỐC ĐẠT CHUẨN GPP
        </span>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
          Chăm Sóc Sức Khỏe Gia Đình Bạn Với Thuốc Chính Hãng 100%
        </h1>
        <p style={{ margin: 0, color: '#ccfbf1', fontSize: 15, maxWidth: 650, lineHeight: 1.6 }}>
          Kiểm soát hạn dùng minh bạch theo nguyên tắc FEFO. Giao hàng nhanh toàn quốc, hỗ trợ dược sĩ tư vấn tận tình.
        </p>

        {/* Search Bar in Hero */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, maxWidth: 600 }}>
          <input
            type="text"
            placeholder="Tìm theo tên thuốc (Panadol, Augmentin...), hoạt chất hoặc mã barcode..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: 12,
              border: 'none',
              fontSize: 14,
              outline: 'none',
              color: '#0f172a',
              background: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              style={{
                background: '#134e4a',
                color: '#ccfbf1',
                border: 'none',
                borderRadius: 12,
                padding: '0 16px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat as string)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: selectedCategory === cat ? '1px solid #0f766e' : '1px solid #e2e8f0',
              background: selectedCategory === cat ? '#0f766e' : '#ffffff',
              color: selectedCategory === cat ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {cat === 'all' ? 'Tất cả sản phẩm' : cat}
          </button>
        ))}
      </div>

      {/* Product List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Danh Sách Thuốc ({filteredMedicines.length})
        </h2>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          Đồng bộ tồn kho trực tiếp từ CSDL Nhà thuốc
        </span>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          Đang nạp danh mục thuốc từ máy chủ...
        </div>
      )}

      {isError && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#b91c1c' }}>
          ⚠️ Không thể nạp dữ liệu thuốc từ Backend. Vui lòng đảm bảo Spring Boot backend đang hoạt động.
          <br />
          <button
            type="button"
            onClick={() => refetch()}
            style={{ marginTop: 12, background: '#0f766e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {filteredMedicines.map((med) => {
          const isOutOfStock = med.totalStock <= 0;

          return (
            <div
              key={med.id}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
                opacity: isOutOfStock ? 0.75 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <div>
                {/* Badges: Category & Stock Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                    {med.category || 'Thuốc'}
                  </span>

                  {/* Stock status indicator */}
                  {isOutOfStock ? (
                    <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      Hết Hàng
                    </span>
                  ) : med.totalStock <= 20 ? (
                    <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      Còn {med.totalStock} hộp
                    </span>
                  ) : (
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      Còn hàng ({med.totalStock})
                    </span>
                  )}
                </div>

                {/* Medicine Title */}
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.4 }}>
                  {med.name}
                </h3>

                {/* Active Ingredient */}
                {med.activeIngredientName && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#0f766e', fontWeight: 600 }}>
                    🧪 {med.activeIngredientName}
                  </p>
                )}

                {/* Barcode & Expiry */}
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                  {med.barcode && <span>Mã vạch: <code>{med.barcode}</code></span>}
                  {med.nearestExpiry && <span>Hạn gần nhất: <strong>{med.nearestExpiry}</strong></span>}
                </div>
              </div>

              {/* Price & Action */}
              <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f766e', marginBottom: 12 }}>
                  {currency.format(med.price)}
                </div>

                {/* NÚT THÊM VÀO GIỎ */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(med)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: isOutOfStock ? '#cbd5e1' : '#0f766e',
                    color: isOutOfStock ? '#64748b' : '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isOutOfStock ? 'Tạm Hết Hàng' : '🛒 Thêm Vào Giỏ'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 50,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              height: '100%',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Giỏ Hàng Mua Sắm ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Xóa tất cả
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <p style={{ margin: 0 }}>Giỏ hàng của bạn đang trống.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {cart.map((item) => (
                    <div
                      key={item.medicineId}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
                          {item.name}
                        </div>
                        <div style={{ color: '#0f766e', fontWeight: 600, fontSize: 13 }}>
                          {currency.format(item.price)}
                        </div>
                      </div>

                      {/* Quantity control */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.medicineId, -1)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.medicineId, 1)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form */}
              {cart.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
                    Thông Tin Nhận Hàng
                  </h3>

                  {checkoutError && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Họ và tên người nhận *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn An"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="VD: 0912345678"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Địa chỉ nhận thuốc tận nơi *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutMutation.isPending}
                      style={{
                        marginTop: 10,
                        background: checkoutMutation.isPending ? '#94a3b8' : '#0f766e',
                        color: '#fff',
                        border: 'none',
                        padding: 14,
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: checkoutMutation.isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {checkoutMutation.isPending ? 'Đang Xử Lý Đơn Hàng...' : `Xác Nhận Đặt Thuốc (${currency.format(cartSubtotal)})`}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#64748b' }}>Tổng thanh toán:</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#0f766e' }}>
                  {currency.format(cartSubtotal)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Success Modal with Order Tracking Code */}
      {checkoutSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', margin: '0 0 8px' }}>
              Đặt Hàng Thành Công!
            </h2>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
              Cảm ơn bạn đã đặt thuốc tại Dược An. Đơn hàng đã được ghi nhận ở trạng thái <strong>Chờ xác nhận (PENDING)</strong> và giữ chỗ kho theo thuật toán FEFO.
            </p>

            <div style={{ background: '#f0fdfa', border: '1.5px dashed #0f766e', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>
                MÃ TRA CỨU ĐƠN HÀNG CỦA BẠN
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#042f2e', margin: '6px 0', letterSpacing: '0.05em' }}>
                {checkoutSuccess.orderNumber}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Tổng thanh toán: <strong>{currency.format(checkoutSuccess.totalAmount)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link
                to={`/track-order?code=${encodeURIComponent(checkoutSuccess.orderNumber)}`}
                onClick={() => setCheckoutSuccess(null)}
                style={{
                  background: '#0f766e',
                  color: '#ffffff',
                  padding: '10px 18px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                🔍 Xem Trạng Thái Đơn Hàng
              </Link>
              <button
                type="button"
                onClick={() => setCheckoutSuccess(null)}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '10px 18px',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Tiếp tục mua thuốc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontPage;
