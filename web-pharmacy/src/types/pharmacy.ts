export interface User {
  id?: number;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CUSTOMER';
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'PHARMACIST' | 'CUSTOMER';
}

/**
 * Matches MedicineService.searchMedicines (/api/v1/medicines/search)
 * and MedicineResponse (/api/medicines)
 */
export interface MedicineInventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  barcode?: string | null;
  activeIngredientId?: number | null;
  activeIngredientName?: string | null;
  totalStock: number;
  stock?: number;
  nearestExpiry: string | null;
  batches?: Array<{
    id: string;
    batchNumber: number;
    quantity: number;
    expiryDate: string;
  }>;
}

/**
 * Matches BatchDetailResponse.java (/api/v1/inventory/batches)
 */
export interface BatchInventoryDto {
  id: string;
  batchNumber: number;
  medicineId: string;
  medicineName: string;
  category: string;
  quantity: number;
  costPrice: number;
  expiryDate: string;
  daysRemaining: number;
  alertLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXPIRED';
  canSell: boolean;
}

/**
 * Matches InventoryImportRequest.java (POST /api/v1/inventory/import)
 */
export interface ImportBatchRequest {
  medicineId: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  supplierId?: number;
}

/**
 * Matches PosCheckoutRequest.java (POST /api/v1/pos/checkout)
 */
export interface PosCheckoutRequest {
  customerName: string;
  customerPhone?: string;
  paymentMethod: 'CASH' | 'QR_TRANSFER' | 'CARD' | 'TRANSFER';
  discountAmount: number;
  customerPaid: number;
  items: {
    medicineId: string;
    quantity: number;
  }[];
}

/**
 * Matches BatchAllocationDto.java
 */
export interface BatchAllocationDto {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: number;
  expiryDate: string;
  quantityAllocated: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceDetailResponse {
  id: number;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: number;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * Matches PosCheckoutResponse.java
 */
export interface PosCheckoutResponse {
  invoiceId: number;
  invoiceNumber: string;
  saleDate: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  customerPaid: number;
  changeAmount: number;
  paymentMethod: string;
  pharmacistUsername?: string;
  pharmacistName?: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceDetailResponse[];
  allocations: BatchAllocationDto[];
}

export interface OrderDetailItem {
  id: number;
  quantity: number;
  unitPrice: number;
  batch?: {
    id: string;
    batchNumber: number;
    expiryDate: string;
    medicine?: {
      id: string;
      name: string;
      category?: string;
      price?: number;
    };
  };
}

export interface OnlineOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  orderDetails?: OrderDetailItem[];
}

export interface OnlineCheckoutRequest {
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  items: {
    medicineId: string;
    quantity: number;
  }[];
}

export interface OnlineCheckoutResponse {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  allocations: BatchAllocationDto[];
  message: string;
}

/**
 * Matches DashboardOverviewResponse.java (/api/v1/dashboard/overview)
 */
export interface DashboardOverviewResponse {
  posRevenue: number;
  appRevenue: number;
  totalRevenue: number;
  posPercentage: number;
  appPercentage: number;
  posOrdersCount: number;
  appOrdersCount: number;
  totalOrdersCount: number;
  lowStockCount: number;
  expiringBatchesCount: number;
  criticalBatchesCount: number;
  shiftRevenue: number;
  todayAppRevenue: number;
  dailyRevenue?: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
  topSellingMedicines?: Array<{
    rank: number;
    medicineId: string;
    medicineName: string;
    activeIngredient: string;
    quantitySold: number;
    unit: string;
    revenue: number;
    percentage: number;
    availableStock: number;
    safetyStatus: string;
  }>;
}

/**
 * Matches DashboardMetricsResponse.java (/api/v1/dashboard/metrics)
 */
export interface DashboardMetricsResponse {
  totalRevenue: number;
  totalOrders: number;
  lowStockCount: number;
  expiringBatchesCount: number;
  todayRevenue: number;
  todayOrders: number;
  revenueChart?: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
}

// ============================================================================
// CRUD DTOs matching /api/medicines, /api/batches, /api/customers,
// /api/employees, /api/suppliers (SQL Server tables)
// ============================================================================

export interface MedicineRequest {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface MedicineResponse {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  nearestExpiry: string | null;
}

export interface MedicineBatchRequest {
  id: string;
  medicineId: string;
  batchNumber: number;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
}

export interface MedicineBatchResponse {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: number;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
}

export interface CustomerRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface CustomerResponse {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface EmployeeRequest {
  id: string;
  name: string;
  phone: string;
  birthDate: string | null;
  role: string;
  startDate: string | null;
}

export interface EmployeeResponse {
  id: string;
  name: string;
  phone: string;
  birthDate: string | null;
  role: string;
  startDate: string | null;
}

export interface SupplierRequest {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface SupplierResponse {
  id: string;
  name: string;
  phone: string;
  address: string;
}
