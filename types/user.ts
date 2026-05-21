// User and Profile types for Mediora

export interface UserProfile {
  id: string;
  user_id: string;
  clerk_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'customer' | 'staff';

export interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  favoriteCategory?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UserFilter {
  search?: string;
  role?: UserRole;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}