// Product types for Mediora e-commerce

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  type?: string;
  generic?: string;
  description?: string;
  image?: string | null;
  price: number;
  mrp?: number;
  stock: number;
  tags: string[];
  is_antibiotic: boolean;
  prescription_required: boolean;
  featured: boolean;
  bestseller: boolean;
  combo_offer: boolean;
  combo_products?: ComboProduct[];
  rating: number;
  reviews: number;
  created_at: string;
  updated_at: string;
}

export interface ComboProduct {
  product_id: number;
  name: string;
  quantity: number;
  discount_percentage?: number;
}

export interface ProductFilter {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  prescription_required?: boolean;
  tags?: string[];
}

export interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  type: string;
  generic: string;
  description: string;
  image: string | null;
  price: number;
  mrp: number;
  stock: number;
  tags: string[];
  is_antibiotic: boolean;
  prescription_required: boolean;
  featured: boolean;
  bestseller: boolean;
  combo_offer: boolean;
  combo_products: ComboProduct[] | null;
  rating: number;
  reviews: number;
}

export interface ProductStats {
  total: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  featured: number;
  bestsellers: number;
}