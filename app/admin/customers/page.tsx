'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import Link from 'next/link';
import {
  Button, Card, PageHeader, Spinner, EmptyState, Badge,
} from '@/components/admin/ui';
import { 
  Users, Search, Download, Eye, Mail, Phone, 
  MapPin, Calendar, Filter, MoreVertical
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

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

const customerListCss = `
  .cl-container { max-width: 1400px; margin: 0 auto; }
  .cl-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .cl-stat-card { background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 16px; transition: all 0.2s; }
  .cl-stat-card:hover { border-color: #0fa381; }
  .cl-stat-value { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: #e6edf3; margin-bottom: 4px; }
  .cl-stat-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
  .cl-stat-icon { color: #0fa381; margin-bottom: 8px; }
  
  .cl-filters { background: #161b22; border: 1px solid #21262d; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .cl-search { position: relative; flex: 1; }
  .cl-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #8b949e; }
  .cl-search-input { width: 100%; padding: 10px 12px 10px 36px; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; color: #e6edf3; font-size: 0.85rem; outline: none; transition: all 0.2s; }
  .cl-search-input:focus { border-color: #0fa381; }
  
  .cl-table { background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; }
  .cl-table table { width: 100%; border-collapse: collapse; }
  .cl-table th { text-align: left; padding: 14px 16px; background: #0d1117; color: #8b949e; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #21262d; }
  .cl-table td { padding: 14px 16px; color: #e6edf3; font-size: 0.85rem; border-bottom: 1px solid #21262d; }
  .cl-table tr:last-child td { border-bottom: none; }
  .cl-table tr:hover { background: rgba(255, 255, 255, 0.02); }
  
  .cl-customer-cell { display: flex; align-items: center; gap: 12px; }
  .cl-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #0fa381, #0a7860); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
  .cl-customer-info { display: flex; flex-direction: column; gap: 2px; }
  .cl-customer-name { font-weight: 600; color: #e6edf3; }
  .cl-customer-email { font-size: 0.7rem; color: #8b949e; }
  
  .cl-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
  .cl-badge-active { background: rgba(15, 163, 129, 0.15); color: #0fa381; }
  .cl-badge-inactive { background: rgba(139, 148, 158, 0.15); color: #8b949e; }
  
  .cl-action-btn { padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; background: transparent; border: 1px solid #21262d; color: #8b949e; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
  .cl-action-btn:hover { border-color: #0fa381; color: #0fa381; }
  
  @media (max-width: 768px) { .cl-stats { grid-template-columns: repeat(2, 1fr); } }
`;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function CustomersPage() {
  const supabase = createBrowserClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderStats, setOrderStats] = useState<Record<string, number>>({});

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setCustomers(data as Customer[]);
      
      // Fetch order counts for each customer
      const orderCounts: Record<string, number> = {};
      for (const customer of data) {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', customer.user_id);
        
        orderCounts[customer.id] = count || 0;
      }
      setOrderStats(orderCounts);
    }
    
    setLoading(false);
  }, [search, supabase]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Joined Date'];
    const rows = customers.map(c => [
      c.full_name,
      c.email,
      c.phone || 'N/A',
      orderStats[c.id] || 0,
      formatDate(c.created_at),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => orderStats[c.id] > 0).length;
  const totalOrders = Object.values(orderStats).reduce((a, b) => a + b, 0);
  const newThisMonth = customers.filter(c => {
    const date = new Date(c.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customerListCss }} />
      
      <div className="cl-container">
        <PageHeader
          title="Customers"
          subtitle={`${totalCustomers} total customers`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={exportToCSV}>
                Export CSV
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="cl-stats">
          {[
            { label: 'Total Customers', value: totalCustomers, icon: '👥' },
            { label: 'Active Customers', value: activeCustomers, icon: '✅' },
            { label: 'Total Orders', value: totalOrders, icon: '📦' },
            { label: 'New This Month', value: newThisMonth, icon: '🎉' },
          ].map((stat, i) => (
            <div key={i} className="cl-stat-card">
              <div className="cl-stat-icon">{stat.icon}</div>
              <div className="cl-stat-value">{stat.value.toLocaleString()}</div>
              <div className="cl-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="cl-filters">
          <div className="cl-search">
            <Search size={16} className="cl-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cl-search-input"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="cl-table">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size={32} />
            </div>
          ) : customers.length === 0 ? (
            <EmptyState 
              icon={<Users size={48} />} 
              title="No customers found" 
              desc="No customers match your search criteria"
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="cl-customer-cell">
                        <div className="cl-avatar">
                          {getInitials(customer.full_name)}
                        </div>
                        <div className="cl-customer-info">
                          <div className="cl-customer-name">{customer.full_name}</div>
                          <div className="cl-customer-email">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {customer.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                            <Phone size={12} /> {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0fa381' }}>
                        {orderStats[customer.id] || 0}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                      {formatDate(customer.created_at)}
                    </td>
                    <td>
                      <span className="cl-badge cl-badge-active">
                        Active
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/customers/${customer.id}`} className="cl-action-btn">
                        <Eye size={12} /> View Details
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