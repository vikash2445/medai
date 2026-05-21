'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@lib/supabase-admin';
import Link from 'next/link';
import toast from 'react-hot-toast';
import EditProductForm from './edit';

const css = `
  .ep-container { max-width: 1200px; margin: 0 auto; }
  .ep-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 14px; }
  .ep-back { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #21262d; border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; color: #8b949e; text-decoration: none; transition: all 0.18s; }
  .ep-back:hover { border-color: #0fa381; color: #0fa381; }
  .ep-title { font-family: 'DM Serif Display', serif; font-size: 1.7rem; color: #e6edf3; margin-bottom: 3px; }
  .ep-sub { font-size: 0.82rem; color: #8b949e; }
  .ep-delete-btn { background: rgba(214, 64, 64, 0.1); border: 1px solid rgba(214, 64, 64, 0.3); color: #d64040; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.18s; }
  .ep-delete-btn:hover { background: rgba(214, 64, 64, 0.2); border-color: #d64040; }
  .ep-loading { display: flex; justify-content: center; align-items: center; min-height: 400px; }
  .ep-spinner { width: 40px; height: 40px; border: 3px solid #21262d; border-top-color: #0fa381; border-radius: 50%; animation: ep-spin 0.8s linear infinite; }
  @keyframes ep-spin { to { transform: rotate(360deg); } }
`;

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const productId = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error || !data) {
      toast.error('Product not found');
      router.push('/admin/products');
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Product deleted successfully');
      router.push('/admin/products');
    }
  };

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="ep-container">
          <div className="ep-loading">
            <div className="ep-spinner" />
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="ep-container">
          <div className="ep-header">
            <div>
              <Link href="/admin/products" className="ep-back">
                ← Back to Products
              </Link>
              <h1 className="ep-title">Product Not Found</h1>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      
      <div className="ep-container">
        <div className="ep-header">
          <div>
            <Link href="/admin/products" className="ep-back">
              ← Back to Products
            </Link>
            <h1 className="ep-title">Edit Product</h1>
            <p className="ep-sub">Update product information and inventory</p>
          </div>
          <button 
            type="button" 
            className="ep-delete-btn"
            onClick={handleDelete}
          >
            Delete Product
          </button>
        </div>

        <EditProductForm product={product} />
      </div>
    </>
  );
}