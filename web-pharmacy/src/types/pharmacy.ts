// Data Types matching Java Spring Boot Backend Entities and DTOs

export interface ActiveIngredient {
  id: number;
  name: string;
  description?: string;
}

export interface MedicineBatchItem {
  id: string;
  batchNumber: number;
  quantity: number;
  expiryDate: string;
  costPrice?: number;
}

export interface MedicineItem {
  id: string;
  name: string;
  category: string;
  price: number;
  barcode?: string;
  activeIngredientId?: number;
  activeIngredientName?: string;
  totalStock: number;
  nearestExpiry?: string | null;
  batches: MedicineBatchItem[];
}

export interface SubstituteMedicineResponse {
  id: string;
  name: string;
  category: string;
  price: number;
  activeIngredientId: number;
  activeIngredientName: string;
  availableStock: number;
  nearestExpiryDate?: string;
  nearestExpiry?: string;
}

export interface BatchAllocationDto {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: number;
  expiryDate: string;
  allocatedQuantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceDetailResponse {
  id: number;
  medicineId: string;
  medicineName: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PosCheckoutRequest {
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  discountAmount?: number;
  customerPaid?: number;
  items: {
    medicineId: string;
    quantity: number;
  }[];
}

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
  invoiceDetails: InvoiceDetailResponse[];
  batchAllocations: BatchAllocationDto[];
}

export interface BatchDetailResponse {
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

export interface InventoryImportRequest {
  medicineId: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  supplierId?: number;
}

export interface OrderDetail {
  id: number;
  batch: {
    id: string;
    batchNumber: number;
    expiryDate: string;
  };
  medicine: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface OnlineOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  shippingAddress: string;
  receiverPhone: string;
  receiverName: string;
  orderDetails?: OrderDetail[];
}

export interface DailyRevenueDto {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface DashboardOverviewResponse {
  posRevenue: number;
  appRevenue: number;
  totalRevenue: number;
  posOrdersCount: number;
  appOrdersCount: number;
  totalOrdersCount: number;
  lowStockCount: number;
  expiringBatchesCount: number;
  criticalBatchesCount: number;
  dailyRevenue: DailyRevenueDto[];
}
