'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import {
  Button, Card, Modal, Input, PageHeader, Spinner, EmptyState, Badge,
} from '@/components/admin/ui';
import { 
  Plus, Edit, Trash2, Search, FolderTree, Package, 
  ChevronRight, MoreVertical, Check, X, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  emoji?: string;
  parent_id: string | null;
  product_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categoriesCss = `
  .cat-container { max-width: 1400px; margin: 0 auto; }
  
  .cat-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .cat-stat-card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 16px; transition: all 0.2s; }
  .cat-stat-card:hover { border-color: #0fa381; }
  .cat-stat-value { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: #e6edf3; margin-bottom: 4px; }
  .cat-stat-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .cat-filters { background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .cat-search { position: relative; flex: 1; }
  .cat-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #8b949e; }
  .cat-search-input { width: 100%; padding: 10px 12px 10px 36px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .cat-search-input:focus { border-color: #0fa381; }
  
  .cat-table { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
  .cat-table table { width: 100%; border-collapse: collapse; }
  .cat-table th { text-align: left; padding: 14px 16px; background: #0d1117; color: #8b949e; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #21262d; }
  .cat-table td { padding: 14px 16px; color: #e6edf3; font-size: 0.85rem; border-bottom: 1px solid #21262d; }
  .cat-table tr:last-child td { border-bottom: none; }
  .cat-table tr:hover { background: rgba(255, 255, 255, 0.02); }
  
  .cat-name-cell { display: flex; align-items: center; gap: 12px; }
  .cat-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(15, 163, 129, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
  .cat-info { display: flex; flex-direction: column; gap: 2px; }
  .cat-name { font-weight: 600; color: #e6edf3; }
  .cat-slug { font-size: 0.7rem; color: #8b949e; font-family: monospace; }
  
  .cat-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
  .cat-badge-active { background: rgba(15, 163, 129, 0.15); color: #0fa381; }
  .cat-badge-inactive { background: rgba(139, 148, 158, 0.15); color: #8b949e; }
  
  .cat-action-btn { padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; background: transparent; border: 1px solid #21262d; color: #8b949e; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 4px; }
  .cat-action-btn:hover { border-color: #0fa381; color: #0fa381; }
  .cat-action-btn-danger:hover { border-color: #d64040; color: #d64040; }
  
  .cat-form-group { margin-bottom: 20px; }
  .cat-form-label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #8b949e; margin-bottom: 8px; }
  .cat-form-input, .cat-form-select, .cat-form-textarea { width: 100%; padding: 10px 12px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .cat-form-input:focus, .cat-form-select:focus, .cat-form-textarea:focus { border-color: #0fa381; }
  .cat-form-textarea { resize: vertical; min-height: 80px; }
  
  .cat-image-preview { width: 100px; height: 100px; border-radius: 8px; overflow: hidden; background: #0d1117; border: 1px solid #21262d; margin-top: 8px; }
  .cat-image-preview img { width: 100%; height: 100%; object-fit: cover; }
  
  @media (max-width: 768px) {
    .cat-stats { grid-template-columns: repeat(2, 1fr); }
    .cat-table { overflow-x: auto; }
    .cat-table table { min-width: 600px; }
  }
`;

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Simple type for parent dropdown (only needs id and name)
interface SimpleCategory {
  id: string;
  name: string;
}

export default function CategoriesPage() {
  const supabase = createBrowserClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    emoji: '📦',  // ← Add this
    parent_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [parentCategories, setParentCategories] = useState<SimpleCategory[]>([]); // Changed type

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (cat: any) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', cat.name);
          
          return { ...cat, product_count: count || 0 };
        })
      );
      setCategories(categoriesWithCounts);
    }
    
    setLoading(false);
  }, [search, supabase]);

  const fetchParentCategories = useCallback(async () => {
    // Only select id and name for the dropdown
    const { data } = await supabase
      .from('categories')
      .select('id, name')  // Only fetch what we need for dropdown
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (data) {
      setParentCategories(data as SimpleCategory[]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
    fetchParentCategories();
  }, [fetchCategories, fetchParentCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      emoji: '📦',
      parent_id: '',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active,
      emoji: category.emoji || '📦',
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const saveCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);

    const slug = formData.slug || slugify(formData.name);
    
    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .neq('id', editingCategory?.id || '')
      .single();

    if (existing) {
      toast.error('A category with this slug already exists');
      setSaving(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug,
      description: formData.description || null,
      image: formData.image || null,
      emoji: formData.emoji || '📦',
      parent_id: formData.parent_id || null,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingCategory) {
      const { error: updateError } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editingCategory.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('categories')
        .insert([{ ...payload, created_at: new Date().toISOString() }]);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      setModalOpen(false);
      fetchCategories();
      fetchParentCategories();
    }
  };

  const deleteCategory = async () => {
    if (!deleteId) return;

    // Check if category has products
    const categoryToDelete = categories.find(c => c.id === deleteId);
    if (categoryToDelete && categoryToDelete.product_count > 0) {
      toast.error(`Cannot delete category with ${categoryToDelete.product_count} products. Reassign or delete products first.`);
      setDeleteId(null);
      return;
    }

    // Check if category has subcategories
    const hasSubcategories = categories.some(c => c.parent_id === deleteId);
    if (hasSubcategories) {
      toast.error('Cannot delete category with subcategories. Delete or reassign subcategories first.');
      setDeleteId(null);
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Category deleted successfully');
      fetchCategories();
      fetchParentCategories();
    }
    setDeleteId(null);
  };

  const toggleCategoryStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchCategories();
    }
  };

  const stats = {
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
    withProducts: categories.filter(c => c.product_count > 0).length,
  };

  // Build hierarchical display
  const getCategoryLevel = (category: Category, level = 0): number => {
    if (!category.parent_id) return level;
    const parent = categories.find(c => c.id === category.parent_id);
    return parent ? getCategoryLevel(parent, level + 1) : level;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: categoriesCss }} />
      
      <div className="cat-container">
        <PageHeader
          title="Categories"
          subtitle={`${stats.total} total categories`}
          action={
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openAddModal}>
              Add Category
            </Button>
          }
        />

        {/* Stats */}
        <div className="cat-stats">
          {[
            { label: 'Total Categories', value: stats.total, icon: '📁' },
            { label: 'Active', value: stats.active, icon: '✅' },
            { label: 'Inactive', value: stats.inactive, icon: '⭕' },
            { label: 'With Products', value: stats.withProducts, icon: '📦' },
          ].map((stat, i) => (
            <div key={i} className="cat-stat-card">
              <div className="cat-stat-value">{stat.value}</div>
              <div className="cat-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="cat-filters">
          <div className="cat-search">
            <Search size={16} className="cat-search-icon" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cat-search-input"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="cat-table">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={32} />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState 
              icon={<FolderTree size={48} />} 
              title="No categories found" 
              desc="Create your first category to organize products"
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const level = getCategoryLevel(category);
                  const indent = level * 24;
                  
                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="cat-name-cell" style={{ paddingLeft: indent }}>
                          <div className="cat-icon">
                            {category.image ? (
                              <img src={category.image} alt={category.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              '📁'
                            )}
                          </div>
                          <div className="cat-info">
                            <div className="cat-name">{category.name}</div>
                            {category.description && (
                              <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                                {category.description.substring(0, 50)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.7rem', color: '#8b949e' }}>{category.slug}</code>
                      </td>
                      <td>
                        <Badge variant="blue">{category.product_count}</Badge>
                      </td>
                      <td>
                        <span className={category.is_active ? 'cat-badge cat-badge-active' : 'cat-badge cat-badge-inactive'}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                        {new Date(category.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                            className="cat-action-btn"
                            title={category.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {category.is_active ? <X size={12} /> : <Check size={12} />}
                          </button>
                          <button
                            onClick={() => openEditModal(category)}
                            className="cat-action-btn"
                            title="Edit"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteId(category.id)}
                            className="cat-action-btn cat-action-btn-danger"
                            title="Delete"
                            disabled={category.product_count > 0}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
        width="max-w-lg"
      >
        <div className="cat-form-group">
          <label className="cat-form-label">Category Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                name: e.target.value,
                slug: editingCategory ? prev.slug : slugify(e.target.value),
              }));
            }}
            className="cat-form-input"
            placeholder="e.g., Medicines, Skincare, Supplements"
          />
        </div>

        <div className="cat-form-group">
          <label className="cat-form-label">Slug (URL)</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
            className="cat-form-input"
            placeholder="auto-generated from name"
          />
          <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
            /categories/{formData.slug || '...'}
          </div>
        </div>

        <div className="cat-form-group">
          <label className="cat-form-label">Parent Category</label>
          <select
            value={formData.parent_id}
            onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
            className="cat-form-select"
          >
            <option value="">None (Top Level)</option>
            {parentCategories
              .filter(c => !editingCategory || c.id !== editingCategory.id)
              .map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
          </select>
        </div>

        <div className="cat-form-group">
          <label className="cat-form-label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="cat-form-textarea"
            rows={3}
            placeholder="Category description for SEO and display..."
          />
        </div>

        <div className="cat-form-group">
          <label className="cat-form-label">Category Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="cat-form-input"
          />
          {formData.image && (
            <div className="cat-image-preview">
              <img src={formData.image} alt="Category preview" />
              <button
                onClick={removeImage}
                style={{ position: 'absolute', marginTop: '-28px', marginLeft: '70px', background: '#d64040', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
            Recommended: 200x200px, max 2MB
          </div>
        </div>

        <div className="cat-form-group">
  <label className="cat-form-label">Category Emoji</label>
  <input
    type="text"
    value={formData.emoji}
    onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
    className="cat-form-input"
    placeholder="e.g., 🧴, 💊, 🏋️"
    maxLength={2}
  />
  <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: '4px' }}>
    Enter a single emoji for this category (e.g., 🧴 for Skincare)
  </div>
</div>


        <div className="cat-form-group">
          <label className="cat-form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              style={{ width: 'auto' }}
            />
            Active (visible on storefront)
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" loading={saving} onClick={saveCategory}>
            {editingCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Category"
        width="max-w-md"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <AlertCircle size={48} style={{ color: '#d64040', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', color: '#e6edf3' }}>
            Delete Category?
          </h3>
          <p style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '24px' }}>
            This action cannot be undone. The category will be permanently removed.
            {categories.find(c => c.id === deleteId)?.product_count === 0 && (
              <span style={{ display: 'block', marginTop: '8px', color: '#f0b429' }}>
                Note: This category has no products, so it's safe to delete.
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={deleteCategory}>
              Delete Category
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}