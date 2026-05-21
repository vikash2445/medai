// lib/validations/productValidation.ts - Product validation rules

export interface ProductValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ProductData {
  name?: string;
  slug?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  category?: string;
  description?: string;
  rating?: number;
  tags?: string[];
  is_antibiotic?: boolean;
  prescription_required?: boolean;
}

/**
 * Validate product name
 */
export function validateName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Product name is required';
  }
  if (name.length < 3) {
    return 'Product name must be at least 3 characters';
  }
  if (name.length > 200) {
    return 'Product name must be less than 200 characters';
  }
  return null;
}

/**
 * Validate product slug
 */
export function validateSlug(slug: string): string | null {
  if (!slug || slug.trim().length === 0) {
    return 'Slug is required';
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens';
  }
  if (slug.length < 3 || slug.length > 100) {
    return 'Slug must be between 3 and 100 characters';
  }
  return null;
}

/**
 * Validate product price
 */
export function validatePrice(price: number): string | null {
  if (price === undefined || price === null) {
    return 'Price is required';
  }
  if (isNaN(price)) {
    return 'Price must be a number';
  }
  if (price <= 0) {
    return 'Price must be greater than 0';
  }
  if (price > 1000000) {
    return 'Price cannot exceed ₹10,00,000';
  }
  return null;
}

/**
 * Validate MRP (Maximum Retail Price)
 */
export function validateMRP(mrp: number, price?: number): string | null {
  if (mrp === undefined || mrp === null) return null; // MRP is optional
  
  if (isNaN(mrp)) {
    return 'MRP must be a number';
  }
  if (mrp < 0) {
    return 'MRP cannot be negative';
  }
  if (price && mrp < price) {
    return 'MRP cannot be less than selling price';
  }
  if (mrp > 1000000) {
    return 'MRP cannot exceed ₹10,00,000';
  }
  return null;
}

/**
 * Validate stock quantity
 */
export function validateStock(stock: number): string | null {
  if (stock === undefined || stock === null) return null; // Stock is optional
  
  if (isNaN(stock)) {
    return 'Stock must be a number';
  }
  if (stock < 0) {
    return 'Stock cannot be negative';
  }
  if (stock > 100000) {
    return 'Stock cannot exceed 100,000 units';
  }
  return null;
}

/**
 * Validate category
 */
export function validateCategory(category: string): string | null {
  if (!category || category.trim().length === 0) {
    return 'Category is required';
  }
  const validCategories = ['Medicines', 'Skincare', 'Supplements', 'Baby Care', 'Fitness', 'Immunity', 'Personal Care', 'Healthcare'];
  if (!validCategories.includes(category)) {
    return `Category must be one of: ${validCategories.join(', ')}`;
  }
  return null;
}

/**
 * Validate product description
 */
export function validateDescription(description: string): string | null {
  if (!description) return null; // Description is optional
  
  if (description.length < 10) {
    return 'Description must be at least 10 characters';
  }
  if (description.length > 5000) {
    return 'Description must be less than 5000 characters';
  }
  return null;
}

/**
 * Validate rating
 */
export function validateRating(rating: number): string | null {
  if (rating === undefined || rating === null) return null;
  
  if (isNaN(rating)) {
    return 'Rating must be a number';
  }
  if (rating < 1 || rating > 5) {
    return 'Rating must be between 1 and 5';
  }
  return null;
}

/**
 * Validate tags
 */
export function validateTags(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  
  if (tags.length > 20) {
    return 'Cannot have more than 20 tags';
  }
  
  for (const tag of tags) {
    if (tag.length < 2) {
      return 'Each tag must be at least 2 characters';
    }
    if (tag.length > 30) {
      return 'Each tag must be less than 30 characters';
    }
  }
  return null;
}

/**
 * Complete product validation
 */
export function validateProduct(product: ProductData): ProductValidationResult {
  const errors: Record<string, string> = {};
  
  // Name validation
  const nameError = validateName(product.name || '');
  if (nameError) errors.name = nameError;
  
  // Slug validation
  const slugError = validateSlug(product.slug || '');
  if (slugError) errors.slug = slugError;
  
  // Price validation
  const priceError = validatePrice(product.price || 0);
  if (priceError) errors.price = priceError;
  
  // MRP validation
  const mrpError = validateMRP(product.mrp || 0, product.price);
  if (mrpError) errors.mrp = mrpError;
  
  // Stock validation
  const stockError = validateStock(product.stock || 0);
  if (stockError) errors.stock = stockError;
  
  // Category validation
  const categoryError = validateCategory(product.category || '');
  if (categoryError) errors.category = categoryError;
  
  // Description validation
  const descriptionError = validateDescription(product.description || '');
  if (descriptionError) errors.description = descriptionError;
  
  // Rating validation
  const ratingError = validateRating(product.rating || 0);
  if (ratingError) errors.rating = ratingError;
  
  // Tags validation
  const tagsError = validateTags(product.tags || []);
  if (tagsError) errors.tags = tagsError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Quick validation for form inputs (real-time)
 */
export function validateField(field: keyof ProductData, value: any, product?: ProductData): string | null {
  switch (field) {
    case 'name':
      return validateName(value);
    case 'slug':
      return validateSlug(value);
    case 'price':
      return validatePrice(value);
    case 'mrp':
      return validateMRP(value, product?.price);
    case 'stock':
      return validateStock(value);
    case 'category':
      return validateCategory(value);
    case 'description':
      return validateDescription(value);
    case 'rating':
      return validateRating(value);
    case 'tags':
      return validateTags(value);
    default:
      return null;
  }
}