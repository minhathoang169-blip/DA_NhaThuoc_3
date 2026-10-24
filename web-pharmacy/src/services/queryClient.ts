import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 15, // Dữ liệu còn mới trong 15s
      refetchOnWindowFocus: true, // Tự động refetch khi người dùng quay lại tab
      retry: 1,
    },
  },
});

export const QUERY_KEYS = {
  medicines: ['medicines'] as const,
  adminOrders: ['admin', 'orders'] as const,
  dashboardMetrics: ['dashboard', 'metrics'] as const,
  expiringBatches: ['inventory', 'expiring'] as const,
  orderTracking: (orderNumber: string) => ['orders', 'track', orderNumber] as const,
};

/**
 * Hàm hỗ trợ Invalidate Cache toàn diện khi có thay đổi:
 * - Khi Admin thêm/sửa/đổi giá/tồn kho sản phẩm -> Invalidate để Storefront cập nhật tức thì.
 * - Khi Khách đặt hàng -> Invalidate để Admin nhận đơn mới và tồn kho tự động trừ.
 */
export function invalidateMedicinesCache() {
  return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines });
}

export function invalidateOrdersCache() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOrders }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardMetrics }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines }),
  ]);
}
