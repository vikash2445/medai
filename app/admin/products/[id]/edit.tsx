'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@lib/supabase-admin';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/admin/ImageUpload';

interface EditProductFormProps {
  product: any;
}

const CATEGORIES = ['Medicines', 'Skincare', 'Supplements', 'Baby Care', 'Fitness', 'Immunity', 'Personal Care', 'Healthcare'];
const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Injection', 'Powder', 'Gel', 'Lotion', 'Other'];

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const [formData, setFormData] = useState(product);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>(product?.images || (product?.image ? [product.image] : []));

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateField('tags', [...(formData.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags?.filter((t: string) => t !== tag) || []);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const updateData: any = {
      name: formData.name,
      slug: formData.slug,
      category: formData.category,
      type: formData.type,
      generic: formData.generic,
      description: formData.description,
      price: formData.price,
      mrp: formData.mrp,
      stock: formData.stock,
      tags: formData.tags || [],
      is_antibiotic: formData.is_antibiotic,
      prescription_required: formData.prescription_required,
      featured: formData.featured,
      bestseller: formData.bestseller,
      combo_offer: formData.combo_offer,
      rating: formData.rating,
      reviews: formData.reviews,
      updated_at: new Date().toISOString(),
      // Multiple images support
      images: images,
      // Keep first image as main image for backward compatibility
      image: images.length > 0 ? images[0] : null,
    };
    
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', formData.id);
    
    setSaving(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Product updated successfully!');
      router.push('/admin/products');
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-6">
      <div className="space-y-4">
        {/* Multiple Images Upload */}
        <div>
          <ImageUpload
            values={images}
            onChange={(urls) => setImages(urls || [])}
            bucket="product-images"
            folder="products"
            label="Product Images"
            maxImages={5}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Product Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => updateField('slug', e.target.value)}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Category</label>
            <select
              value={formData.category || ''}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Type</label>
            <select
              value={formData.type || ''}
              onChange={(e) => updateField('type', e.target.value)}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            >
              <option value="">Select Type</option>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Generic Name</label>
          <input
            type="text"
            value={formData.generic || ''}
            onChange={(e) => updateField('generic', e.target.value)}
            className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Price (₹)</label>
            <input
              type="number"
              value={formData.price || 0}
              onChange={(e) => updateField('price', Number(e.target.value))}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">MRP (₹)</label>
            <input
              type="number"
              value={formData.mrp || ''}
              onChange={(e) => updateField('mrp', Number(e.target.value))}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Stock</label>
            <input
              type="number"
              value={formData.stock || 0}
              onChange={(e) => updateField('stock', Number(e.target.value))}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Rating</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={formData.rating || 4.5}
              onChange={(e) => updateField('rating', Number(e.target.value))}
              className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            className="w-full p-2 bg-[#0d1117] border border-[#21262d] rounded text-white"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 p-2 bg-[#0d1117] border border-[#21262d] rounded min-h-[42px]">
            {formData.tags?.map((tag: string) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="Type tag and press Enter"
              className="flex-1 bg-transparent outline-none text-sm text-white"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={formData.featured} onChange={(e) => updateField('featured', e.target.checked)} />
            <span>Featured</span>
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={formData.bestseller} onChange={(e) => updateField('bestseller', e.target.checked)} />
            <span>Bestseller</span>
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={formData.is_antibiotic} onChange={(e) => updateField('is_antibiotic', e.target.checked)} />
            <span>Antibiotic</span>
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={formData.prescription_required} onChange={(e) => updateField('prescription_required', e.target.checked)} />
            <span>Prescription Required</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-[#21262d] rounded text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}