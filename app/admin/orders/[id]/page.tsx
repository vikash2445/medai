'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@lib/supabase-admin';
import { Order, OrderItem, OrderTracking } from '@/types';
import {
  Button, Badge, Card, Modal, Select, Table, Tr, Td,
  PageHeader, Spinner, EmptyState,
} from '@/components/admin/ui';
import { 
  ArrowLeft, Truck, Package, CreditCard, MapPin, 
  Clock, Phone, Mail, User, RefreshCw, Printer, 
  Download, Send, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['pending', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const orderDetailsCss = `
  .od-container { max-width: 1400px; margin: 0 auto; }
  .od-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 14px; }
  .od-back-btn { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #21262d; border-radius: 8px; padding: 8px 16px; font-size: 0.85rem; color: #8b949e; text-decoration: none; transition: all 0.18s; cursor: pointer; }
  .od-back-btn:hover { border-color: #0fa381; color: #0fa381; }
  .od-title { font-family: 'DM Serif Display', serif; font-size: 1.7rem; color: #e6edf3; margin-bottom: 3px; }
  .od-sub { font-size: 0.82rem; color: #8b949e; }
  .od-actions { display: flex; gap: 10px; }
  
  .od-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
  .od-card { background: #161b22; border: 1px solid #21262d; border-radius: 14px; padding: 20px; }
  .od-card-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8b949e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .od-info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #21262d; font-size: 0.85rem; }
  .od-info-row:last-child { border-bottom: none; }
  .od-info-label { color: #8b949e; }
  .od-info-value { color: #e6edf3; font-weight: 500; }
  
  .od-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .od-status-delivered { background: rgba(15, 163, 129, 0.15); color: #0fa381; }
  .od-status-shipped { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .od-status-processing { background: rgba(240, 180, 41, 0.15); color: #f0b429; }
  .od-status-pending { background: rgba(139, 148, 158, 0.15); color: #8b949e; }
  .od-status-cancelled { background: rgba(214, 64, 64, 0.15); color: #d64040; }
  
  .od-timeline { position: relative; padding-left: 30px; }
  .od-timeline-item { position: relative; padding-bottom: 24px; }
  .od-timeline-dot { position: absolute; left: -30px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: #21262d; border: 2px solid #0d1117; }
  .od-timeline-dot.completed { background: #0fa381; }
  .od-timeline-dot.current { background: #f0b429; animation: pulse 2s infinite; }
  .od-timeline-line { position: absolute; left: -24px; top: 12px; bottom: 0; width: 2px; background: #21262d; }
  .od-timeline-content { padding-bottom: 8px; }
  .od-timeline-status { font-weight: 600; color: #e6edf3; margin-bottom: 4px; }
  .od-timeline-date { font-size: 0.7rem; color: #8b949e; }
  .od-timeline-note { font-size: 0.75rem; color: #8b949e; margin-top: 4px; }
  
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .od-update-section { background: #0d1117; border: 1px solid #21262d; border-radius: 14px; padding: 20px; margin-top: 20px; }
  .od-update-title { font-size: 0.85rem; font-weight: 600; color: #e6edf3; margin-bottom: 16px; }
  
  @media (max-width: 768px) { .od-grid { grid-template-columns: 1fr; } }
`;

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    delivered: 'od-status-delivered',
    shipped: 'od-status-shipped',
    out_for_delivery: 'od-status-shipped',
    processing: 'od-status-processing',
    packed: 'od-status-processing',
    pending: 'od-status-pending',
    cancelled: 'od-status-cancelled',
  };
  return colors[status] || 'od-status-pending';
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    
    // Fetch order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError || !orderData) {
      toast.error('Order not found');
      router.push('/admin/orders');
      return;
    }
    
    setOrder(orderData as Order);
    setNewStatus(orderData.status);
    setDeliveryPartner(orderData.delivery_partner_name || '');
    setDeliveryPhone(orderData.delivery_partner_phone || '');
    setEstimatedDelivery(orderData.estimated_delivery || '');
    
    // Fetch order items
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    setOrderItems((itemsData || []) as OrderItem[]);
    
    // Fetch tracking history
    const { data: trackingData } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    
    setTracking((trackingData || []) as OrderTracking[]);
    
    setLoading(false);
  }, [orderId, supabase, router]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const updateOrderStatus = async () => {
    if (!order || !newStatus) return;
    
    setUpdatingStatus(true);
    
    const updates: any = {
      status: newStatus,
      tracking_status: newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      updated_at: new Date().toISOString(),
    };
    
    if (deliveryPartner) updates.delivery_partner_name = deliveryPartner;
    if (deliveryPhone) updates.delivery_partner_phone = deliveryPhone;
    if (estimatedDelivery) updates.estimated_delivery = estimatedDelivery;
    
    // If delivered, update payment status
    if (newStatus === 'delivered') {
      updates.payment_status = 'paid';
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id);
    
    if (!error) {
      // Insert tracking event
      await supabase.from('order_tracking').insert({
        order_id: order.id,
        status: newStatus,
        note: trackingNote || null,
      });
      
      toast.success('Order status updated successfully');
      
      // Send notification to customer
      await sendNotification(order.user_id, newStatus, trackingNote);
      
      // Refresh data
      fetchOrderDetails();
      setShowUpdateModal(false);
      setTrackingNote('');
    } else {
      toast.error(error.message);
    }
    
    setUpdatingStatus(false);
  };

  const sendNotification = async (userId: string, status: string, note: string) => {
    try {
      const statusText = status.replace(/_/g, ' ');
      const message = `Your order #${order?.id.slice(0, 8).toUpperCase()} is now ${statusText}. ${note ? `Note: ${note}` : ''}`;
      
      await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: `Order ${statusText}`,
          message,
        }),
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const generateInvoice = () => {
    // Create invoice HTML
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order?.id.slice(0, 8).toUpperCase()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mediora Invoice</h1>
          <p>Order #${order?.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div class="order-details">
          <p><strong>Customer:</strong> ${order?.customer_name}</p>
          <p><strong>Email:</strong> ${order?.customer_email}</p>
          <p><strong>Phone:</strong> ${order?.customer_phone}</p>
          <p><strong>Address:</strong> ${order?.shipping_address}</p>
          <p><strong>Date:</strong> ${formatDate(order?.created_at || '')}</p>
        </div>
        <table>
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            ${orderItems.map(item => `
              <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.subtotal}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total: ₹${order?.total.toLocaleString()}</div>
      </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="od-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-container">
        <EmptyState icon={<Package size={40} />} title="Order not found" />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: orderDetailsCss }} />
      
      <div className="od-container">
        <div className="od-header">
          <div>
            <button onClick={() => router.back()} className="od-back-btn">
              <ArrowLeft size={16} /> Back to Orders
            </button>
            <h1 className="od-title">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="od-sub">Placed on {formatDate(order.created_at)}</p>
          </div>
          <div className="od-actions">
            <Button size="sm" variant="outline" icon={<Printer size={14} />} onClick={generateInvoice}>
              Invoice
            </Button>
            <Button size="sm" variant="outline" icon={<Download size={14} />}>
              Export
            </Button>
            <Button size="sm" variant="primary" icon={<RefreshCw size={14} />} onClick={() => setShowUpdateModal(true)}>
              Update Status
            </Button>
          </div>
        </div>

        <div className="od-grid">
          {/* Customer Information */}
          <div className="od-card">
            <div className="od-card-title">
              <User size={16} /> Customer Details
            </div>
            <div className="od-info-row">
              <span className="od-info-label">Name</span>
              <span className="od-info-value">{order.customer_name}</span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label"><Mail size={12} /> Email</span>
              <span className="od-info-value">{order.customer_email}</span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label"><Phone size={12} /> Phone</span>
              <span className="od-info-value">{order.customer_phone}</span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label"><MapPin size={12} /> Address</span>
              <span className="od-info-value">{order.shipping_address}</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="od-card">
            <div className="od-card-title">
              <Package size={16} /> Order Summary
            </div>
            <div className="od-info-row">
              <span className="od-info-label">Order Status</span>
              <span className={`od-status-badge ${getStatusColor(order.status)}`}>
                {order.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label">Payment Status</span>
              <span className={`od-status-badge ${order.payment_status === 'paid' ? 'od-status-delivered' : 'od-status-pending'}`}>
                {order.payment_status.toUpperCase()}
              </span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label"><CreditCard size={12} /> Payment ID</span>
              <span className="od-info-value">{order.cf_payment_id || 'N/A'}</span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label"><Clock size={12} /> Estimated Delivery</span>
              <span className="od-info-value">{order.estimated_delivery || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Delivery Partner Info */}
        {(order.delivery_partner_name || order.delivery_partner_phone) && (
          <div className="od-card" style={{ marginBottom: 20 }}>
            <div className="od-card-title">
              <Truck size={16} /> Delivery Partner
            </div>
            <div className="od-info-row">
              <span className="od-info-label">Partner Name</span>
              <span className="od-info-value">{order.delivery_partner_name || 'N/A'}</span>
            </div>
            <div className="od-info-row">
              <span className="od-info-label"><Phone size={12} /> Contact</span>
              <span className="od-info-value">{order.delivery_partner_phone || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Order Items Table */}
        <div className="od-card" style={{ marginBottom: 20 }}>
          <div className="od-card-title">
            <Package size={16} /> Order Items
          </div>
          {orderItems.length === 0 ? (
            <EmptyState icon={<Package size={32} />} title="No items found" />
          ) : (
            <Table
              headers={['Product', 'Quantity', 'Price', 'Subtotal']}
            >
              {orderItems.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <div>
                      <div className="font-semibold text-slate-900">{item.product_name}</div>
                    </div>
                  </Td>
                  <Td className="text-center">{item.quantity}</Td>
                  <Td>₹{item.price.toLocaleString()}</Td>
                  <Td className="font-semibold">₹{item.subtotal.toLocaleString()}</Td>
                </Tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td colSpan={3} className="px-4 py-3 text-right font-bold">Total</td>
                <td className="px-4 py-3 font-bold text-green-700">₹{order.total.toLocaleString()}</td>
              </tr>
            </Table>
          )}
        </div>

        {/* Tracking Timeline */}
        {tracking.length > 0 && (
          <div className="od-card">
            <div className="od-card-title">
              <Clock size={16} /> Tracking History
            </div>
            <div className="od-timeline">
              {tracking.map((event, index) => {
                const isCompleted = index < tracking.length - 1;
                const isCurrent = index === tracking.length - 1 && order.status !== 'delivered';
                return (
                  <div key={event.id} className="od-timeline-item">
                    <div className={`od-timeline-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`} />
                    {index < tracking.length - 1 && <div className="od-timeline-line" />}
                    <div className="od-timeline-content">
                      <div className="od-timeline-status">
                        {event.status.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="od-timeline-date">{formatDate(event.created_at)}</div>
                      {event.note && <div className="od-timeline-note">{event.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        <Modal
          open={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title={`Update Order #${order.id.slice(0, 8).toUpperCase()}`}
          width="max-w-lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Order Status</label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Partner Name</label>
              <input
                type="text"
                value={deliveryPartner}
                onChange={(e) => setDeliveryPartner(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                placeholder="e.g., BlueDart, Delhivery, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Partner Phone</label>
              <input
                type="tel"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                placeholder="Contact number of delivery partner"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Delivery Date</label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tracking Note (Optional)</label>
              <textarea
                value={trackingNote}
                onChange={(e) => setTrackingNote(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                rows={3}
                placeholder="Add any additional notes about this update..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" loading={updatingStatus} onClick={updateOrderStatus}>
                <Send size={14} className="mr-2" /> Update & Notify
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}