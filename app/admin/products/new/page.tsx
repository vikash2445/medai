'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@lib/supabase-admin';

const CATEGORIES = ['Medicines', 'Skincare', 'Supplements', 'Baby Care', 'Fitness', 'Immunity', 'Personal Care', 'Healthcare'];
const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Injection', 'Powder', 'Gel', 'Lotion', 'Other'];

const newProductCss = `
  .np-container { max-width: 1200px; margin: 0 auto; }
  .np-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 14px; }
  .np-back { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #21262d; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; color: #8b949e; text-decoration: none; transition: all 0.18s; }
  .np-back:hover { border-color: #0fa381; color: #0fa381; }
  .np-title { font-family: 'DM Serif Display', serif; font-size: 1.7rem; color: #e6edf3; margin-bottom: 3px; }
  .np-sub { font-size: 0.82rem; color: #8b949e; }
  
  .np-form { background: #161b22; border: 1px solid #21262d; border-radius: 14px; padding: 24px; }
  .np-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .np-field { display: flex; flex-direction: column; gap: 6px; }
  .np-field-full { grid-column: span 2; }
  .np-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8b949e; }
  .np-label-required::after { content: '*'; color: #d64040; margin-left: 4px; }
  .np-input, .np-select, .np-textarea {
    background: #0d1117; border: 1px solid #21262d; border-radius: 8px;
    padding: 10px 12px; font-size: 0.85rem; color: #e6edf3;
    font-family: 'Outfit', sans-serif; transition: all 0.18s;
  }
  .np-input:focus, .np-select:focus, .np-textarea:focus {
    outline: none; border-color: #0fa381; box-shadow: 0 0 0 2px rgba(15, 163, 129, 0.1);
  }
  .np-textarea { resize: vertical; min-height: 80px; }
  .np-checkbox-group { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .np-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #0fa381; }
  
  .np-image-upload { border: 2px dashed #21262d; border-radius: 12px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.18s; background: #0d1117; }
  .np-image-upload:hover { border-color: #0fa381; background: rgba(15, 163, 129, 0.05); }
  .np-image-preview { position: relative; width: 120px; height: 120px; border-radius: 12px; overflow: hidden; background: #0d1117; border: 1px solid #21262d; }
  .np-image-preview img { width: 100%; height: 100%; object-fit: cover; }
  .np-remove-image { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.7); border: none; border-radius: 6px; color: #fff; padding: 4px 8px; font-size: 0.7rem; cursor: pointer; }
  
  .np-tags-input { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; min-height: 42px; }
  .np-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(15, 163, 129, 0.15); color: #0fa381; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; }
  .np-tag-remove { cursor: pointer; background: none; border: none; color: #8b949e; font-size: 14px; padding: 0 2px; }
  .np-tag-remove:hover { color: #d64040; }
  .np-tag-input { flex: 1; min-width: 120px; background: transparent; border: none; color: #e6edf3; font-size: 0.85rem; outline: none; }
  
  .np-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 24px; border-top: 1px solid #21262d; }
  .np-save-btn { background: #0fa381; color: #fff; border: none; border-radius: 10px; padding: 12px 24px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
  .np-save-btn:hover { background: #0a7860; }
  .np-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .np-cancel-btn { background: transparent; border: 1px solid #21262d; color: #8b949e; border-radius: 10px; padding: 12px 24px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
  .np-cancel-btn:hover { border-color: #8b949e; color: #e6edf3; }
  
  .np-error { background: rgba(214, 64, 64, 0.1); border: 1px solid rgba(214, 64, 64, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px; color: #d64040; font-size: 0.85rem; }
  .np-success { background: rgba(15, 163, 129, 0.1); border: 1px solid rgba(15, 163, 129, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px; color: #0fa381; font-size: 0.85rem; }
  
  @media (max-width: 768px) { .np-grid { grid-template-columns: 1fr; } .np-field-full { grid-column: span 1; } }
`;

interface NewProductForm {
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
  combo_products: any;
  rating: number;
  reviews: number;
}

const EMPTY_FORM: NewProductForm = {
  name: '',
  slug: '',
  category: '',
  type: '',
  generic: '',
  description: '',
  image: null,
  price: 0,
  mrp: 0,
  stock: 0,
  tags: [],
  is_antibiotic: false,
  prescription_required: false,
  featured: false,
  bestseller: false,
  combo_offer: false,
  combo_products: null,
  rating: 4.5,
  reviews: 0,
};

function slugify(str: string) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const [formData, setFormData] = useState<NewProductForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const setField = useCallback((field: keyof NewProductForm, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setField('image', publicUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setField('image', null);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setField('tags', [...formData.tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      setError('Valid price is required');
      return false;
    }
    if (formData.mrp && formData.mrp < formData.price) {
      setError('MRP cannot be less than the selling price');
      return false;
    }
    if (formData.stock < 0) {
      setError('Stock cannot be negative');
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const slug = formData.slug || slugify(formData.name);
    
    // Check if slug already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingProduct) {
      setError('A product with this slug already exists. Please use a different name or slug.');
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug,
      category: formData.category || null,
      type: formData.type || null,
      generic: formData.generic || null,
      description: formData.description || null,
      image: formData.image,
      price: formData.price,
      mrp: formData.mrp || null,
      stock: formData.stock,
      tags: formData.tags,
      is_antibiotic: formData.is_antibiotic,
      prescription_required: formData.prescription_required,
      featured: formData.featured,
      bestseller: formData.bestseller,
      combo_offer: formData.combo_offer,
      combo_products: formData.combo_products,
      rating: formData.rating,
      reviews: formData.reviews,
    };

    const { error: insertError } = await supabase
      .from('products')
      .insert([payload]);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess('Product created successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: newProductCss }} />
      
      <div className="np-container">
        <div className="np-header">
          <div>
            <button onClick={() => router.back()} className="np-back">
              ← Back to Products
            </button>
            <h1 className="np-title">Add New Product</h1>
            <p className="np-sub">Create a new product for your store</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="np-form">
          {error && <div className="np-error">{error}</div>}
          {success && <div className="np-success">{success}</div>}

          <div className="np-grid">
            {/* Image Upload */}
            <div className="np-field-full">
              <label className="np-label">Product Image</label>
              <div>
                {formData.image ? (
                  <div className="np-image-preview">
                    <img src={formData.image} alt="Product preview" />
                    <button type="button" onClick={removeImage} className="np-remove-image">
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="np-image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      disabled={uploadingImage}
                    />
                    <div style={{ color: '#8b949e' }}>
                      {uploadingImage ? (
                        'Uploading...'
                      ) : (
                        <>
                          📸 Click or drag to upload image
                          <div style={{ fontSize: '0.7rem', marginTop: '8px' }}>
                            Recommended: Square image, max 5MB
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="np-field-full">
              <label className="np-label np-label-required">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setField('name', e.target.value);
                  if (!formData.slug) {
                    setField('slug', slugify(e.target.value));
                  }
                }}
                className="np-input"
                placeholder="e.g., Dolo 650 Tablet Strip"
                required
              />
            </div>

            <div className="np-field">
              <label className="np-label">Slug (URL)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setField('slug', slugify(e.target.value))}
                className="np-input"
                placeholder="auto-generated from name"
              />
              <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                /products/{formData.slug || '...'}
              </div>
            </div>

            <div className="np-field">
              <label className="np-label">Generic Name</label>
              <input
                type="text"
                value={formData.generic}
                onChange={(e) => setField('generic', e.target.value)}
                className="np-input"
                placeholder="Active ingredient (e.g., Paracetamol)"
              />
            </div>

            <div className="np-field">
              <label className="np-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setField('category', e.target.value)}
                className="np-select"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="np-field">
              <label className="np-label">Type/Form</label>
              <select
                value={formData.type}
                onChange={(e) => setField('type', e.target.value)}
                className="np-select"
              >
                <option value="">Select type</option>
                {TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="np-field">
              <label className="np-label np-label-required">Price (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.price || ''}
                onChange={(e) => setField('price', Number(e.target.value))}
                className="np-input"
                placeholder="Selling price"
                required
              />
            </div>

            <div className="np-field">
              <label className="np-label">MRP (₹)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.mrp || ''}
                onChange={(e) => setField('mrp', Number(e.target.value))}
                className="np-input"
                placeholder="Maximum retail price"
              />
            </div>

            <div className="np-field">
              <label className="np-label">Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setField('stock', Number(e.target.value))}
                className="np-input"
              />
            </div>

            <div className="np-field">
              <label className="np-label">Rating (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setField('rating', Number(e.target.value))}
                className="np-input"
              />
            </div>

            <div className="np-field">
              <label className="np-label">Initial Reviews Count</label>
              <input
                type="number"
                min="0"
                value={formData.reviews}
                onChange={(e) => setField('reviews', Number(e.target.value))}
                className="np-input"
              />
            </div>

            <div className="np-field-full">
              <label className="np-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setField('description', e.target.value)}
                className="np-textarea"
                rows={4}
                placeholder="Product description, benefits, usage instructions..."
              />
            </div>

            {/* Tags */}
            <div className="np-field-full">
              <label className="np-label">Tags</label>
              <div className="np-tags-input">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className="np-tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="np-tag-remove">
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type tag and press Enter (e.g., fever, pain, antibiotic)"
                  className="np-tag-input"
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                Press Enter to add tags
              </div>
            </div>

            {/* Toggle Options */}
            <div className="np-field-full">
              <label className="np-label">Product Flags & Badges</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                {[
                  ['featured', '⭐ Featured on Homepage'],
                  ['bestseller', '🏆 Mark as Bestseller'],
                  ['prescription_required', '📋 Prescription Required'],
                  ['is_antibiotic', '💊 Is Antibiotic'],
                  ['combo_offer', '🎁 Combo Offer'],
                ].map(([field, label]) => (
                  <label key={field} className="np-checkbox-group">
                    <input
                      type="checkbox"
                      checked={formData[field as keyof NewProductForm] as boolean}
                      onChange={(e) => setField(field as keyof NewProductForm, e.target.checked)}
                      className="np-checkbox"
                    />
                    <span style={{ fontSize: '0.85rem', color: '#e6edf3' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Combo Products (if combo_offer is checked) */}
            {formData.combo_offer && (
              <div className="np-field-full">
                <label className="np-label">Combo Products (JSON)</label>
                <textarea
                  value={formData.combo_products ? JSON.stringify(formData.combo_products, null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setField('combo_products', parsed);
                    } catch {
                      setField('combo_products', e.target.value);
                    }
                  }}
                  className="np-textarea"
                  rows={3}
                  placeholder='{"products": [{"id": 1, "name": "Product Name", "quantity": 1}]}'
                />
                <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
                  Enter valid JSON for combo offer details
                </div>
              </div>
            )}
          </div>

          <div className="np-actions">
            <button type="button" onClick={() => router.push('/admin/products')} className="np-cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading || uploadingImage} className="np-save-btn">
              {loading ? 'Creating Product...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}