// types/index.ts - Main export file
// This file should ONLY export types from other files, not define them

// Export all product types
export type {
  Product,
  ComboProduct,
  ProductFilter,
  ProductFormData,
  ProductStats,
} from './product';

// Export all order types
export type {
  Order,
  OrderItem,
  OrderTracking,
  OrderStatus,
  PaymentStatus,
  OrderSummary,
  OrderStats,
  OrderFilter,
} from './order';

// Export all user types
export type {
  UserProfile,
  UserRole,
  Address,
  CustomerStats,
  UserActivity,
  UserFilter,
} from './user';

// Export all API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  DashboardStats,
  TopProduct,
  ChartData,
  Category,
  CategoryFormData,
  Prescription,
  PrescriptionMedicine,
  StoreSettings,
  PaymentSettings,
  ShippingZone,
  ShippingRule,
} from './api';

// types/index.ts
// Re-export commonly used types for convenience
export type { RevenueStats, PrescriptionStats } from './api';

// If you need any additional types that aren't in separate files, 
// define them here (but better to put in appropriate files)