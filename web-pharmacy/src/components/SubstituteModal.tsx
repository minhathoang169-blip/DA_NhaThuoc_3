import React from 'react';

export interface SubstituteItem {
  id: string;
  name: string;
  category: string;
  price: number;
  activeIngredientName: string;
  availableStock: number;
  nearestExpiryDate?: string;
}

export interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalMedicineName: string;
  substitutes: SubstituteItem[];
  onSelectSubstitute: (item: SubstituteItem) => void;
}

export const SubstituteModal: React.FC<SubstituteModalProps> = ({
  isOpen,
  onClose,
  originalMedicineName,
  substitutes,
  onSelectSubstitute,
}) => {
  if (!isOpen) return null;

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" data-testid="substitute-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">💊 Gợi ý thuốc cùng hoạt chất</h3>
            <p className="text-xs text-blue-100">
              Thuốc hiện tại: <strong className="underline">{originalMedicineName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="modal-close-btn"
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-lg font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
          {substitutes.length === 0 ? (
            <div className="text-center py-8 text-slate-500" data-testid="no-substitutes-msg">
              Không tìm thấy biệt dược tương đương nào còn hàng trong kho!
            </div>
          ) : (
            substitutes.map((sub) => (
              <div
                key={sub.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition"
                data-testid={`substitute-item-${sub.id}`}
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{sub.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Hoạt chất: <span className="font-medium text-blue-600">{sub.activeIngredientName}</span>
                  </div>
                  <div className="text-xs text-slate-500 flex gap-3 mt-1">
                    <span>Đơn giá: <strong className="text-slate-700">{formatVnd(sub.price)}</strong></span>
                    <span>Tồn khả dụng: <strong className="text-emerald-600">{sub.availableStock} hộp</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid={`btn-select-substitute-${sub.id}`}
                  onClick={() => {
                    onSelectSubstitute(sub);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Chọn thay thế
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
