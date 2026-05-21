'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import { Order, OrderItem, OrderTracking, OrderStatus, PaymentStatus } from '@/types';
import {
  Button, Badge, Card, Modal, Select, Table, Tr, Td,
  PageHeader, Spinner, EmptyState, StatCard,
} from '@/components/admin/ui';
import { ShoppingBag, Eye, Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

const ORDER_STATUSES = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

function statusBadge(status: string) {
  const map: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'gray'> = {
    delivered: 'green', paid: 'green',
    shipped: 'blue', out_for_delivery: 'purple',
    processing: 'amber', packed: 'amber', pending: 'gray',
    cancelled: 'red', failed: 'red', refunded: 'red',
  };
  return <Badge variant={map[status] ?? 'gray'}>{status.replace(/_/g, ' ')}</Badge>;
}

export default function OrdersPage() {
  const supabase = createBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [trackingNote, setTrackingNote] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Use debounce for search
  const debouncedSearch = useDebounce(search, 500);

  // Memoized stats to prevent recalculation
  const stats = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders]);

  // Stable fetch function with useCallback
  const fetchOrders = useCallback(async () => {
    // Prevent multiple calls during initial load
    if (initialLoad) {
      setLoading(true);
    }
    
    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(50); // Add limit to prevent loading too many orders
      
      if (debouncedSearch) {
        query = query.or(
          `customer_name.ilike.%${debouncedSearch}%,` +
          `customer_email.ilike.%${debouncedSearch}%,` +
          `id.ilike.%${debouncedSearch}%`
        );
      }
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setOrders(data as Order[]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [debouncedSearch, statusFilter, supabase, initialLoad]);

  // Fetch only when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // fetchOrders is stable now

  const openOrder = useCallback(async (order: Order) => {
  setSelectedOrder(order);
  setNewStatus(order.status as OrderStatus); // Add type assertion
  setDeliveryPartner(order.delivery_partner_name ?? '');
  setDeliveryPhone(order.delivery_partner_phone ?? '');
  setTrackingNote('');

  // Fetch items and tracking in parallel
  const [itemsResult, trackResult] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    supabase.from('order_tracking').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
  ]);
  
  setOrderItems((itemsResult.data ?? []) as OrderItem[]);
  setTracking((trackResult.data ?? []) as OrderTracking[]);
}, [supabase]);

  const updateOrderStatus = useCallback(async () => {
  if (!selectedOrder || !newStatus) return;
  
  setUpdatingStatus(true);
  
  try {
    const updates: Partial<Order> = {
      status: newStatus,
      tracking_status: newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      delivery_partner_name: deliveryPartner || null,
      delivery_partner_phone: deliveryPhone || null,
      updated_at: new Date().toISOString(),
    };
    
    // If delivered, update payment status
    if (newStatus === 'delivered') {
      updates.payment_status = 'paid' as PaymentStatus;
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', selectedOrder.id);

    if (!error) {
      // Insert tracking event
      await supabase.from('order_tracking').insert({
        order_id: selectedOrder.id,
        status: newStatus,
        note: trackingNote || null,
        created_at: new Date().toISOString(),
      });
      
      toast.success('Order status updated');
      
      // Update local state with proper typing
      setSelectedOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: newStatus,
          payment_status: newStatus === 'delivered' ? 'paid' as PaymentStatus : prev.payment_status,
          updated_at: new Date().toISOString(),
        };
      });
      
      // Update orders list
      setOrders(prev => prev.map(order => 
        order.id === selectedOrder.id 
          ? {
              ...order,
              status: newStatus,
              payment_status: newStatus === 'delivered' ? 'paid' as PaymentStatus : order.payment_status,
              updated_at: new Date().toISOString(),
            }
          : order
      ));
      
      // Refresh tracking
      const { data } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', selectedOrder.id)
        .order('created_at', { ascending: true });
      setTracking((data ?? []) as OrderTracking[]);
    } else {
      toast.error(error.message);
    }
  } catch (error) {
    console.error('Update error:', error);
    toast.error('Failed to update status');
  } finally {
    setUpdatingStatus(false);
  }
}, [selectedOrder, newStatus, deliveryPartner, deliveryPhone, trackingNote, supabase]);

  const sendNotification = useCallback(async (userId: string, title: string, message: string) => {
    try {
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message }),
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  }, []);

  const updateWithNotification = useCallback(async () => {
    await updateOrderStatus();
    if (selectedOrder) {
      await sendNotification(
        selectedOrder.user_id,
        `Order ${newStatus.replace(/_/g, ' ')}`,
        `Your order #${selectedOrder.id.slice(0, 8)} is now ${newStatus.replace(/_/g, ' ')}`
      );
    }
  }, [updateOrderStatus, selectedOrder, newStatus, sendNotification]);

  // Show loading only on initial load
  if (initialLoad && loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} orders`}
        action={<Button variant="outline" size="sm" icon={<Download size={14} />}>Export CSV</Button>}
      />

      {/* Stats - Memoized to prevent re-renders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={stats.pending} icon={<ShoppingBag size={18} />} color="amber" />
        <StatCard label="Processing" value={stats.processing} icon={<ShoppingBag size={18} />} color="blue" />
        <StatCard label="In Transit" value={stats.shipped} icon={<ShoppingBag size={18} />} color="purple" />
        <StatCard label="Delivered" value={stats.delivered} icon={<ShoppingBag size={18} />} color="green" />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, order ID..."
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card padding={false}>
        {loading && !initialLoad ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={40} />} title="No orders found" />
        ) : (
          <Table headers={['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Order Status', 'Date', 'Action']}>
            {orders.map(order => (
              <Tr key={order.id}>
                <Td><span className="font-mono text-green-700 font-bold text-xs">#{order.id.slice(0, 8).toUpperCase()}</span></Td>
                <Td>
                  <div className="font-semibold text-slate-900">{order.customer_name}</div>
                  <div className="text-xs text-slate-400">{order.customer_email}</div>
                </Td>
                <Td className="text-slate-500">—</Td>
                <Td><span className="font-bold text-slate-900">₹{order.total.toLocaleString()}</span></Td>
                <Td>{statusBadge(order.payment_status)}</Td>
                <Td>{statusBadge(order.status)}</Td>
                <Td className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</Td>
                <Td>
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button size="sm" variant="outline" icon={<Eye size={12} />}>View</Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id.slice(0, 8).toUpperCase()}`}
        width="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Modal content - same as before */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Customer</div>
                <div className="font-semibold text-sm">{selectedOrder.customer_name}</div>
                <div className="text-xs text-slate-500">{selectedOrder.customer_email}</div>
                <div className="text-xs text-slate-500">{selectedOrder.customer_phone}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Payment</div>
                <div>{statusBadge(selectedOrder.payment_status)}</div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{selectedOrder.cf_payment_id ?? 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Total</div>
                <div className="text-xl font-bold text-slate-900">₹{selectedOrder.total.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Shipping Address</div>
              <div className="text-sm font-medium">{selectedOrder.shipping_address}</div>
            </div>

            {/* Order items */}
            {orderItems.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Items</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Product</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Qty</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Price</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map(item => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-3 py-2">{item.product_name}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">₹{item.price}</td>
                          <td className="px-3 py-2 text-right font-semibold">₹{item.subtotal}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-200 bg-slate-50">
                        <td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">₹{selectedOrder.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tracking timeline */}
            {tracking.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Tracking History</div>
                <div className="space-y-2">
                  {tracking.map((t, i) => (
                    <div key={t.id} className="flex gap-3 items-start">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${i === tracking.length - 1 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        ✓
                      </div>
                      <div>
                        <div className="text-sm font-semibold capitalize">{t.status.replace(/_/g, ' ')}</div>
                        {t.note && <div className="text-xs text-slate-500">{t.note}</div>}
                        <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update status */}
<div className="border-t border-slate-200 pt-4 space-y-3">
  <div className="text-sm font-semibold text-slate-700">Update Order Status</div>
  <div className="grid grid-cols-2 gap-3">
    <Select 
      label="New Status" 
      value={newStatus} 
      onChange={e => setNewStatus(e.target.value as OrderStatus)}  // ← Add "as OrderStatus"
    >
      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
    </Select>
    <div />
    <input
      placeholder="Delivery partner name"
      value={deliveryPartner}
      onChange={e => setDeliveryPartner(e.target.value)}
      className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
    />
    <input
      placeholder="Partner phone"
      value={deliveryPhone}
      onChange={e => setDeliveryPhone(e.target.value)}
      className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
    />
    <div className="col-span-2">
      <input
        placeholder="Tracking note (optional)"
        value={trackingNote}
        onChange={e => setTrackingNote(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
      />
    </div>
  </div>
  <Button
    variant="primary"
    className="w-full"
    loading={updatingStatus}
    onClick={updateWithNotification}
  >
    Update Status + Notify Customer
  </Button>
</div>
          </div>
        )}
      </Modal>
    </>
  );
}