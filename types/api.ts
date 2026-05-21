// API Response types for consistent error handling

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: Record<string, any>;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  status?: number;
}

// Dashboard API Types
export interface RevenueStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export interface PrescriptionStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

// Update DashboardStats
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  pendingOrders: number;
  lowStockProducts: number;
  ordersGrowth: number;
  // Add other properties as needed
}

// Import these from other files - DON'T redefine them
import type { OrderStats } from './order';
import type { CustomerStats } from './user';
import type { ProductStats } from './product';

// Re-export them
export type { OrderStats, CustomerStats, ProductStats };

export interface TopProduct {
  id: number;
  name: string;
  total_sold: number;
  revenue: number;
}

export interface ChartData {
  dailyRevenue: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
    orders: number;
  }[];
}

// Category API Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  emoji?: string;
  parent_id?: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: string;
  is_active: boolean;
  emoji?: string;
}

// Prescription API Types
export interface Prescription {
  id: string;
  user_id: string;
  image_url: string;
  extracted_text?: string;
  medicines: PrescriptionMedicine[];
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage?: string;
  duration?: string;
  quantity?: number;
}

// Settings API Types
export interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_city: string;
  store_state: string;
  store_pincode: string;
  currency: string;
  currency_symbol: string;
  tax_percentage: number;
  delivery_charge: number;
  free_delivery_min: number;
  timezone: string;
  date_format: string;
  primary_color: string;
  logo_url: string;
  favicon_url: string;
}

export interface PaymentSettings {
  razorpay: {
    key_id: string;
    key_secret: string;
    enabled: boolean;
    test_mode: boolean;
  };
  cashfree: {
    app_id: string;
    secret_key: string;
    enabled: boolean;
    test_mode: boolean;
  };
  cod: {
    enabled: boolean;
    additional_charge: number;
    max_order_amount: number;
  };
  upi: {
    enabled: boolean;
    upi_id: string;
    qr_image?: string;
  };
}

export interface ShippingZone {
  id: string;
  name: string;
  type: 'domestic' | 'international';
  countries: string[];
  pincodes: string[];
  is_active: boolean;
  rules: ShippingRule[];
}

export interface ShippingRule {
  id: string;
  condition_type: 'weight' | 'price' | 'quantity';
  min_value: number;
  max_value: number;
  charge: number;
  free_shipping: boolean;
}

// Banner Type
export interface Banner {
  id: string;
  title: string;
  description?: string;
  image: string;
  link?: string;
  order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Coupon Type
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order?: number;
  maximum_discount?: number;
  usage_limit?: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: number;
  user_id: string;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  created_at: string;
  updated_at: string;
}