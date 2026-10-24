import React, { useState, useMemo } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  allocatedBatchId?: string;
  expiryDate?: string;
}

export interface PosCheckoutPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (checkoutData: {
    discountAmount: number;
    finalTotal: number;
    customerPaid: number;
    changeAmount: number;
  }) => void;
  isProcessing?: boolean;
}

export const PosCheckoutPanel: React.FC<PosCheckoutPanelProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isProcessing = false,
}) => {
  const [discountType, setDiscountType] = useState<'percent' | 'cash'>('cash');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [customerPaid, setCustomerPaid] = useState<number>(0);

  // 1. Tính tổng tiền hàng (Subtotal)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  // 2. Tính số tiền chiết khấu thực tế
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percent') {
      const clampedPercent = Math.min(100, Math.max(0, discountValue));
      return (subtotal * clampedPercent) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  // 3. Tổng tiền thanh toán sau chiết khấu (Final Total)
  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - calculatedDiscount);
  }, [subtotal, calculatedDiscount]);

  // 4. Tính tiền thừa trả khách (Change Due)
  const changeAmount = useMemo(() => {
    return Math.max(0, customerPaid - finalTotal);
  }, [customerPaid, finalTotal]);

  // 5. Kiểm tra điều kiện nút Thanh toán
  const isPaidEnough = customerPaid >= finalTotal;
  const isCheckoutDisabled = items.length === 0 || !isPaidEnough || isProcessing;

  const handleQuickPay = (amount: number) => {
    setCustomerPaid(amount);
  };

  const handleExactPay = () => {
    setCustomerPaid(finalTotal);
  };

  const handleCheckoutSubmit = () => {
    if (isCheckoutDisabled) return;
    onCheckout({
      discountAmount: calculatedDiscount,
      finalTotal,
      customerPaid,
      changeAmount,
    });
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 flex flex-col h-full font-sans">
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b flex items-center justify-between">
        <span>🧾 Hóa đơn bán lẻ quầy</span>
        <span className="text-sm font-normal text-slate-500">
          {items.length} mặt hàng
        </span>
      </h2>

      {/* Danh sách thuốc trong giỏ */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-64 mb-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-slate-400" data-testid="empty-cart-message">
            Chưa có sản phẩm nào được chọn
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between" data-testid={`cart-item-${item.id}`}>
              <div className="flex-1 pr-2">
                <div className="font-semibold text-slate-800 text-sm">{item.name}</div>
                <div className="text-xs text-slate-500">
                  {formatVnd(item.price)} x {item.quantity}
                  {item.allocatedBatchId && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-mono">
                      Lô: {item.allocatedBatchId}
                    </span>
                  )}
                </div>
              </div>

              {/* Điều khiển số lượng */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  data-testid={`btn-decrease-${item.id}`}
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="w-7 h-7 rounded border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-sm" data-testid={`qty-${item.id}`}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  data-testid={`btn-increase-${item.id}`}
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="w-7 h-7 rounded border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                >
                  +
                </button>
                <button
                  type="button"
                  data-testid={`btn-remove-${item.id}`}
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-xs ml-2 font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Khối tính tiền & Chiết khấu */}
      <div className="space-y-3 pt-3 border-t border-slate-200 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Tiền hàng:</span>
          <span className="font-semibold" data-testid="subtotal-amount">
            {formatVnd(subtotal)}
          </span>
        </div>

        {/* Thiết lập chiết khấu */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-600">Chiết khấu:</span>
          <div className="flex items-center gap-1">
            <select
              data-testid="discount-type-select"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'cash')}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50"
            >
              <option value="cash">VNĐ</option>
              <option value="percent">%</option>
            </select>
            <input
              type="number"
              min="0"
              data-testid="discount-input"
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-24 border border-slate-300 rounded px-2 py-1 text-right text-xs"
            />
          </div>
        </div>

        {calculatedDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 text-xs">
            <span>Giảm trừ:</span>
            <span data-testid="discount-amount">-{formatVnd(calculatedDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-dashed">
          <span>Tổng cần thanh toán:</span>
          <span className="text-blue-600 text-lg" data-testid="final-total">
            {formatVnd(finalTotal)}
          </span>
        </div>

        {/* Ô nhập tiền khách đưa */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Tiền khách đưa (VNĐ):
          </label>
          <input
            type="number"
            data-testid="customer-paid-input"
            value={customerPaid || ''}
            onChange={(e) => setCustomerPaid(parseFloat(e.target.value) || 0)}
            placeholder="Nhập số tiền..."
            className="w-full border-2 border-blue-400 rounded-lg px-3 py-2 text-right font-bold text-slate-800 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Quick Pay Buttons */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            <button
              type="button"
              data-testid="btn-exact-pay"
              onClick={handleExactPay}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium whitespace-nowrap"
            >
              Đủ tiền
            </button>
            <button
              type="button"
              data-testid="btn-pay-100k"
              onClick={() => handleQuickPay(100000)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
            >
              100k
            </button>
            <button
              type="button"
              data-testid="btn-pay-200k"
              onClick={() => handleQuickPay(200000)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
            >
              200k
            </button>
            <button
              type="button"
              data-testid="btn-pay-500k"
              onClick={() => handleQuickPay(500000)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
            >
              500k
            </button>
          </div>
        </div>

        {/* Tiền thừa / cảnh báo thiếu tiền */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm font-medium text-slate-700">Tiền thối lại:</span>
          <span
            className={`text-base font-bold ${
              customerPaid < finalTotal && customerPaid > 0 ? 'text-red-500' : 'text-emerald-600'
            }`}
            data-testid="change-amount"
          >
            {formatVnd(changeAmount)}
          </span>
        </div>

        {customerPaid > 0 && customerPaid < finalTotal && (
          <div className="text-xs text-red-500 font-semibold" data-testid="insufficient-cash-warning">
            ⚠️ Khách đưa thiếu {formatVnd(finalTotal - customerPaid)}
          </div>
        )}
      </div>

      {/* Nút bấm Thanh toán */}
      <button
        type="button"
        data-testid="checkout-button"
        disabled={isCheckoutDisabled}
        onClick={handleCheckoutSubmit}
        className={`w-full mt-4 py-3 rounded-lg font-bold text-white shadow-md transition-all ${
          isCheckoutDisabled
            ? 'bg-slate-300 cursor-not-allowed text-slate-500'
            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
        }`}
      >
        {isProcessing ? 'Đang xuất kho FEFO...' : 'Thanh toán & In hóa đơn (F9)'}
      </button>
    </div>
  );
};
