import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export const QUERY_KEYS = {
  medicines: ['medicines'] as const,
  posMedicines: ['posMedicinesReal'] as const,
  medicinesCatalog: ['medicinesCatalogReal'] as const,
  inventoryBatches: ['inventoryBatchesReal'] as const,
  batchesCrud: ['batchesCrud'] as const,
  customers: ['customers'] as const,
  employees: ['employees'] as const,
  suppliers: ['suppliers'] as const,
  adminOrders: ['adminMobileOrdersList'] as const,
  dashboardOverview: ['dashboardOverviewDetail'] as const,
  dashboardMetrics: ['dashboard', 'metrics'] as const,
  expiringBatches: ['inventory', 'expiring'] as const,
  orderTracking: (orderNumber: string) => ['orders', 'track', orderNumber] as const,
};

/**
 * Invalidate toàn bộ cache liên quan đến thuốc, lô thuốc và dashboard
 */
export function invalidateMedicinesCache() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicines }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posMedicines }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicinesCatalog }),
    queryClient.invalidateQueries({ queryKey: ['posMedicinesDropdown'] }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryBatches }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.batchesCrud }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardOverview }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardMetrics }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expiringBatches }),
  ]);
}

/**
 * Invalidate toàn bộ cache liên quan đến đơn hàng, hóa đơn, tồn kho và dashboard
 */
export function invalidateOrdersCache() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOrders }),
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardOverview }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardMetrics }),
    invalidateMedicinesCache(),
  ]);
}
