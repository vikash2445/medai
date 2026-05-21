'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import toast from 'react-hot-toast';

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
  rating: number;
  reviews: number;
}

interface UseProductsOptions {
  category?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  autoFetch?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { category, search, featured, limit = 50, autoFetch = true } = options;
  
  const supabase = createBrowserClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,generic.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (featured !== undefined) {
      query = query.eq('featured', featured);
    }
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) {
      setError(fetchError.message);
      toast.error('Failed to fetch products');
    } else {
      setProducts(data as Product[]);
      setTotalCount(count || 0);
    }
    
    setLoading(false);
  }, [category, search, featured, limit, supabase]);

  const getProduct = useCallback(async (id: number) => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    setLoading(false);
    
    if (fetchError) {
      toast.error('Product not found');
      return null;
    }
    return data as Product;
  }, [supabase]);

  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    const { data, error: insertError } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    setLoading(false);
    
    if (insertError) {
      toast.error(insertError.message);
      return null;
    }
    
    toast.success('Product created successfully');
    await fetchProducts();
    return data as Product;
  }, [supabase, fetchProducts]);

  const updateProduct = useCallback(async (id: number, updates: Partial<Product>) => {
    setLoading(true);
    const { data, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    setLoading(false);
    
    if (updateError) {
      toast.error(updateError.message);
      return null;
    }
    
    toast.success('Product updated successfully');
    await fetchProducts();
    return data as Product;
  }, [supabase, fetchProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    setLoading(true);
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    setLoading(false);
    
    if (deleteError) {
      toast.error(deleteError.message);
      return false;
    }
    
    toast.success('Product deleted successfully');
    await fetchProducts();
    return true;
  }, [supabase, fetchProducts]);

  const updateStock = useCallback(async (id: number, stock: number) => {
    return updateProduct(id, { stock });
  }, [updateProduct]);

  const toggleFeatured = useCallback(async (id: number, featured: boolean) => {
    return updateProduct(id, { featured: !featured });
  }, [updateProduct]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    products,
    loading,
    error,
    totalCount,
    fetchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    toggleFeatured,
  };
}