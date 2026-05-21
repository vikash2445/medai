// Order types for Mediora

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  updated_at: string;
  payment_status: PaymentStatus;
  cf_payment_id?: string;
  tracking_status?: string;
  estimated_delivery?: string;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  created_at: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'packed' 
  | 'shipped' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderSummary {
  subtotal: number;
  delivery_charge: number;
  discount: number;
  tax: number;
  total: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface OrderFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}