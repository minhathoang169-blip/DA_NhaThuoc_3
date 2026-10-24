import React from 'react';

export interface ExpiringBatchItem {
  batchId: string;
  batchNumber: number;
  medicineName: string;
  quantity: number;
  expiryDate: string;
  daysRemaining: number;
  alertLevel: 'CRITICAL' | 'WARNING' | 'OK';
}

export interface ExpiringAlertBadgeProps {
  expiringBatches: ExpiringBatchItem[];
  onClick?: () => void;
}

export const ExpiringAlertBadge: React.FC<ExpiringAlertBadgeProps> = ({
  expiringBatches,
  onClick,
}) => {
  const count = expiringBatches.length;

  if (count === 0) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
        data-testid="badge-normal"
      >
        <span>✅ Date an toàn</span>
      </div>
    );
  }

  // Đánh giá mức độ nghiêm trọng: có ít nhất 1 lô cận hạn <= 15 ngày thì gắn cờ CRITICAL (Màu đỏ)
  const hasCritical = expiringBatches.some((b) => b.daysRemaining <= 15 || b.alertLevel === 'CRITICAL');

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="expiring-badge"
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
        hasCritical
          ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 animate-pulse'
          : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
      }`}
    >
      <span className="text-sm">⚠️</span>
      <span data-testid="badge-label">
        {hasCritical ? 'Cận hạn khẩn cấp (<15 ngày):' : 'Cận date (<30 ngày):'}
      </span>
      <span
        className={`px-1.5 py-0.5 rounded-full text-[11px] text-white ${
          hasCritical ? 'bg-red-600' : 'bg-amber-600'
        }`}
        data-testid="badge-count"
      >
        {count}
      </span>
    </button>
  );
};
