'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@lib/supabase-admin';
import Link from 'next/link';
import {
  Button, Card, Badge, Spinner, EmptyState,
} from '@/components/admin/ui';
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, Package,Users, 
  CreditCard, ShoppingBag, Edit, Download, MessageCircle,
  Home, Clock, CheckCircle, XCircle, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  user_id: string;
  clerk_id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
}

interface Order {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_address: string;
}

const customerDetailsCss = `
  .cd-container { max-width: 1400px; margin: 0 auto; }
  .cd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 14px; }
  .cd-back-btn { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid #21262d; border-radius: 8px; padding: 8px 16px; font-size: 0.85rem; color: #8b949e; text-decoration: none; transition: all 0.18s; cursor: pointer; }
  .cd-back-btn:hover { border-color: #0fa381; color: #0fa381; }
  .cd-title { font-family: 'DM Serif Display', serif; font-size: 1.7rem; color: #e6edf3; margin-bottom: 3px; }
  .cd-sub { font-size: 0.82rem; color: #8b949e; }
  
  .cd-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
  .cd-card { background: #161b22; border: 1px solid #21262d; border-radius: 14px; padding: 20px; }
  .cd-card-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8b949e; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .cd-info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #21262d; font-size: 0.85rem; }
  .cd-info-row:last-child { border-bottom: none; }
  .cd-info-label { color: #8b949e; display: flex; align-items: center; gap: 8px; }
  .cd-info-value { color: #e6edf3; font-weight: 500; }
  
  .cd-stat { text-align: center; padding: 16px; background: #0d1117; border-radius: 10px; }
  .cd-stat-value { font-family: 'DM Serif Display', serif; font-size: 1.5rem; color: #0fa381; }
  .cd-stat-label { font-size: 0.7rem; color: #8b949e; margin-top: 4px; }
  
  .cd-table { width: 100%; border-collapse: collapse; }
  .cd-table th { text-align: left; padding: 12px 12px; background: #0d1117; color: #8b949e; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #21262d; }
  .cd-table td { padding: 12px 12px; color: #e6edf3; font-size: 0.85rem; border-bottom: 1px solid #21262d; }
  .cd-table tr:last-child td { border-bottom: none; }
  
  .cd-status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
  .cd-status-delivered { background: rgba(15, 163, 129, 0.15); color: #0fa381; }
  .cd-status-pending { background: rgba(240, 180, 41, 0.15); color: #f0b429; }
  .cd-status-processing { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .cd-status-cancelled { background: rgba(214, 64, 64, 0.15); color: #d64040; }
  
  .cd-action-btn { padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; background: transparent; border: 1px solid #21262d; color: #8b949e; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
  .cd-action-btn:hover { border-color: #0fa381; color: #0fa381; }
  
  @media (max-width: 768px) { .cd-grid { grid-template-columns: 1fr; } }
`;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, string> = {
    delivered: 'cd-status-delivered',
    shipped: 'cd-status-processing',
    out_for_delivery: 'cd-status-processing',
    processing: 'cd-status-processing',
    packed: 'cd-status-processing',
    pending: 'cd-status-pending',
    cancelled: 'cd-status-cancelled',
  };
  
  const iconMap: Record<string, React.ReactNode> = {
    delivered: <CheckCircle size={12} />,
    shipped: <Truck size={12} />,
    out_for_delivery: <Truck size={12} />,
    processing: <Clock size={12} />,
    pending: <Clock size={12} />,
    cancelled: <XCircle size={12} />,
  };
  
  return (
    <span className={`cd-status-badge ${statusMap[status] || 'cd-status-pending'}`}>
      {iconMap[status] || <Clock size={12} />}
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserClient();
  
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: '',
  });

  const fetchCustomerDetails = useCallback(async () => {
    setLoading(true);
    
    // Fetch customer profile
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (customerError || !customerData) {
      toast.error('Customer not found');
      router.push('/admin/customers');
      return;
    }
    
    setCustomer(customerData as Customer);
    
    // Fetch addresses
    const { data: addressesData } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', customerData.user_id)
      .order('is_default', { ascending: false });
    
    setAddresses((addressesData || []) as Address[]);
    
    // Fetch orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customerData.user_id)
      .order('created_at', { ascending: false });
    
    const ordersList = (ordersData || []) as Order[];
    setOrders(ordersList);
    
    // Calculate stats
    const totalOrders = ordersList.length;
    const totalSpent = ordersList.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = ordersList.length > 0 ? ordersList[0].created_at : '';
    
    setOrderStats({
      total: totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
    });
    
    setLoading(false);
  }, [customerId, supabase, router]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const sendEmail = () => {
    window.location.href = `mailto:${customer?.email}`;
  };

  const callCustomer = () => {
    if (customer?.phone) {
      window.location.href = `tel:${customer.phone}`;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!customer) {
    return (
      <EmptyState 
        icon={<Users size={48} />} 
        title="Customer not found" 
      />
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customerDetailsCss }} />
      
      <div className="cd-container">
        <div className="cd-header">
          <div>
            <button onClick={() => router.back()} className="cd-back-btn">
              <ArrowLeft size={16} /> Back to Customers
            </button>
            <h1 className="cd-title">{customer.full_name}</h1>
            <p className="cd-sub">Customer since {formatDate(customer.created_at)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={sendEmail} className="cd-action-btn">
              <Mail size={14} /> Email
            </button>
            {customer.phone && (
              <button onClick={callCustomer} className="cd-action-btn">
                <Phone size={14} /> Call
              </button>
            )}
          </div>
        </div>

        <div className="cd-grid">
          {/* Customer Information */}
          <div className="cd-card">
            <div className="cd-card-title">
              <Users size={16} /> Customer Information
            </div>
            <div className="cd-info-row">
              <div className="cd-info-label"><Mail size={14} /> Email</div>
              <div className="cd-info-value">{customer.email}</div>
            </div>
            {customer.phone && (
              <div className="cd-info-row">
                <div className="cd-info-label"><Phone size={14} /> Phone</div>
                <div className="cd-info-value">{customer.phone}</div>
              </div>
            )}
            <div className="cd-info-row">
              <div className="cd-info-label"><Calendar size={14} /> Member Since</div>
              <div className="cd-info-value">{formatDateTime(customer.created_at)}</div>
            </div>
            <div className="cd-info-row">
              <div className="cd-info-label"><Package size={14} /> Total Orders</div>
              <div className="cd-info-value">{orderStats.total}</div>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="cd-card">
            <div className="cd-card-title">
              <ShoppingBag size={16} /> Order Statistics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div className="cd-stat">
                <div className="cd-stat-value">{orderStats.total}</div>
                <div className="cd-stat-label">Total Orders</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-value">₹{orderStats.totalSpent.toLocaleString()}</div>
                <div className="cd-stat-label">Total Spent</div>
              </div>
              <div className="cd-stat">
                <div className="cd-stat-value">₹{Math.round(orderStats.averageOrderValue).toLocaleString()}</div>
                <div className="cd-stat-label">Avg. Order Value</div>
              </div>
            </div>
            {orderStats.lastOrderDate && (
              <div className="cd-info-row">
                <div className="cd-info-label">Last Order</div>
                <div className="cd-info-value">{formatDate(orderStats.lastOrderDate)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Saved Addresses */}
        {addresses.length > 0 && (
          <div className="cd-card" style={{ marginBottom: 20 }}>
            <div className="cd-card-title">
              <MapPin size={16} /> Saved Addresses ({addresses.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {addresses.map((address) => (
                <div key={address.id} style={{ padding: '12px', background: '#0d1117', borderRadius: '8px', border: '1px solid #21262d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Home size={14} style={{ color: '#0fa381' }} />
                      {address.is_default && (
                        <Badge variant="green">Default</Badge>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#e6edf3', marginBottom: '4px' }}>
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#e6edf3', marginBottom: '4px' }}>
                    {address.city}, {address.state} - {address.pincode}
                  </div>
                  {address.phone && (
                    <div style={{ fontSize: '0.75rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={10} /> {address.phone}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="cd-card">
          <div className="cd-card-title">
            <Package size={16} /> Order History
          </div>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>
              <ShoppingBag size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No orders yet</p>
            </div>
          ) : (
            <table className="cd-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0fa381' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{order.total.toLocaleString()}</td>
                    <td>
                      <Badge variant={order.payment_status === 'paid' ? 'green' : 'amber'}>
                        {order.payment_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="cd-action-btn">
                        View Order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}