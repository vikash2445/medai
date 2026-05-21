// lib/utils.ts - Utility functions for Mediora

// ============ STRING FORMATTING ============

/**
 * Convert string to URL-friendly slug
 * @example slugify("My Product Name") -> "my-product-name"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Truncate text to specified length
 * @example truncate("Very long text...", 10) -> "Very long..."
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
}

/**
 * Capitalize first letter of each word
 * @example capitalizeWords("hello world") -> "Hello World"
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// ============ NUMBER & CURRENCY FORMATTING ============

/**
 * Format number as Indian Rupee
 * @example formatCurrency(1234567) -> "₹12,34,567"
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

/**
 * Format number with percentage
 * @example formatPercentage(0.185) -> "18.5%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Calculate discount percentage
 * @example calculateDiscount(1000, 800) -> 20
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Format number with Indian numbering system (K, L, Cr)
 * @example formatCompactNumber(125000) -> "1.25L"
 */
export function formatCompactNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ============ DATE FORMATTING ============

/**
 * Format date to readable string
 * @example formatDate("2024-01-15") -> "15 Jan 2024"
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Format time to readable string
 * @example formatTime("2024-01-15T14:30:00") -> "2:30 PM"
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(past);
}

// ============ PHONE & EMAIL VALIDATION ============

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate pincode (Indian postal code)
 */
export function isValidPincode(pincode: string): boolean {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
}

// ============ ARRAY & OBJECT HELPERS ============

/**
 * Group array by key
 * @example groupBy(products, 'category')
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, ascending: boolean = true): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ============ STORAGE HELPERS ============

/**
 * Set item in localStorage with expiration
 */
export function setWithExpiry(key: string, value: any, ttlMinutes: number): void {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + ttlMinutes * 60 * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get item from localStorage with expiration check
 */
export function getWithExpiry<T>(key: string): T | null {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  const item = JSON.parse(itemStr);
  const now = new Date();
  
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

// ============ ORDER HELPERS ============

/**
 * Calculate order summary
 */
export function calculateOrderSummary(
  subtotal: number,
  deliveryCharge: number = 0,
  taxPercentage: number = 18,
  discount: number = 0
): { subtotal: number; delivery: number; tax: number; discount: number; total: number } {
  const tax = (subtotal - discount) * (taxPercentage / 100);
  const total = subtotal - discount + deliveryCharge + tax;
  
  return {
    subtotal,
    delivery: deliveryCharge,
    tax,
    discount,
    total: Math.round(total),
  };
}

/**
 * Get order status badge color
 */
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    packed: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// ============ PRODUCT HELPERS ============

/**
 * Calculate stock status
 */
export function getStockStatus(stock: number): { text: string; color: string } {
  if (stock <= 0) return { text: 'Out of Stock', color: 'text-red-600' };
  if (stock <= 10) return { text: `Only ${stock} left`, color: 'text-orange-600' };
  return { text: 'In Stock', color: 'text-green-600' };
}

/**
 * Generate random ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}