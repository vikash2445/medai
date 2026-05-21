'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import toast from 'react-hot-toast';

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
  estimated_delivery?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface UseOrdersOptions {
  status?: string;
  search?: string;
  limit?: number;
  autoFetch?: boolean;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { status, search, limit = 20, autoFetch = true } = options;
  
  const supabase = createBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,` +
        `customer_email.ilike.%${search}%,` +
        `id.ilike.%${search}%`
      );
    }
    
    const { data, error, count } = await query;
    
    if (!error && data) {
      setOrders(data as Order[]);
      setTotalCount(count || 0);
      
      // Fetch stats
      const { data: allOrders } = await supabase
        .from('orders')
        .select('status');
      
      if (allOrders) {
        setStats({
          pending: allOrders.filter(o => o.status === 'pending').length,
          processing: allOrders.filter(o => o.status === 'processing').length,
          shipped: allOrders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length,
          delivered: allOrders.filter(o => o.status === 'delivered').length,
          cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        });
      }
    }
    
    setLoading(false);
  }, [status, search, limit, supabase]);

  const getOrder = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Order;
  }, [supabase]);

  const getOrderItems = useCallback(async (orderId: string) => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (error) return [];
    return data as OrderItem[];
  }, [supabase]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string, note?: string) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        tracking_status: status.replace(/_/g, ' ').toUpperCase(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) {
      toast.error(error.message);
      return null;
    }
    
    // Add tracking entry
    if (note) {
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status,
        note,
      });
    }
    
    toast.success(`Order status updated to ${status}`);
    await fetchOrders();
    return data as Order;
  }, [supabase, fetchOrders]);

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  return {
    orders,
    loading,
    totalCount,
    stats,
    fetchOrders,
    getOrder,
    getOrderItems,
    updateOrderStatus,
  };
}