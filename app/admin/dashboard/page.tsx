'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import { StatCard, Card, Badge, Table, Tr, Td, Spinner } from '../../../components/admin/ui';
import { BarChart3, ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';
import { DashboardStats } from '@/types';
import Link from 'next/link';

// Simple bar chart without a library dependency
function MiniBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 h-24 mt-2">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-green-500 rounded-sm transition-all"
            style={{ height: `${(v / max) * 100}%`, minHeight: 2 }}
            title={`₹${v.toLocaleString()}`}
          />
          <span className="text-[9px] text-slate-400 truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createBrowserClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [
        { count: totalOrders },
        { count: totalCustomers },
        { count: totalProducts },
        { data: allOrders },
        { data: thisMonthOrders },
        { data: lastMonthOrders },
        { data: recentOrdersData },
        { count: lowStock },
        { count: pendingOrders },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }), // Changed from user_profiles to profiles
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', thisMonthStart),
        supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10).gt('stock', 0),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const totalRevenue = (allOrders ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);
      const thisMonthRev = (thisMonthOrders ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);
      const lastMonthRev = (lastMonthOrders ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);
      const revenueGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

      setStats({
        totalRevenue,
        totalOrders: totalOrders ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalProducts: totalProducts ?? 0,
        revenueGrowth,
        ordersGrowth: 0,
        pendingOrders: pendingOrders ?? 0,
        lowStockProducts: lowStock ?? 0,
      });
      setRecentOrders(recentOrdersData ?? []);

      // Build last 7 months revenue
      const months = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = d.toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
        const { data: mOrders } = await supabase
          .from('orders').select('total').eq('payment_status', 'paid')
          .gte('created_at', start).lt('created_at', end);
        months.push((mOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0));
        labels.push(d.toLocaleString('default', { month: 'short' }));
      }
      setMonthlyRevenue(months);
      setLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size={32} /></div>;
  }

  const s = stats!;

  function statusBadge(status: string) {
    const map: Record<string, 'green' | 'amber' | 'blue' | 'red' | 'gray'> = {
      delivered: 'green', paid: 'green',
      shipped: 'blue', processing: 'amber',
      pending: 'gray', cancelled: 'red',
    };
    return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Welcome back! Here&apos;s what&apos;s happening at Mediora today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={`₹${(s.totalRevenue / 1000).toFixed(1)}K`}
          icon={<TrendingUp size={18} />}
          change={`${s.revenueGrowth > 0 ? '+' : ''}${s.revenueGrowth.toFixed(1)}% this month`}
          changeDir={s.revenueGrowth >= 0 ? 'up' : 'down'}
          color="green"
        />
        <StatCard
          label="Total Orders"
          value={s.totalOrders.toLocaleString()}
          icon={<ShoppingBag size={18} />}
          change={`${s.pendingOrders} pending`}
          changeDir="up"
          color="blue"
        />
        <Link href="/admin/customers" className="block">
          <StatCard
            label="Customers"
            value={s.totalCustomers.toLocaleString()}
            icon={<Users size={18} />}
            color="purple"
          />
        </Link>
        <Link href="/admin/products" className="block">
          <StatCard
            label="Products"
            value={s.totalProducts.toLocaleString()}
            icon={<Package size={18} />}
            change={`${s.lowStockProducts} low stock`}
            changeDir="down"
            color="amber"
          />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-slate-900">Revenue Overview</div>
              <div className="text-xs text-slate-400">Last 7 months</div>
            </div>
            <BarChart3 size={18} className="text-slate-300" />
          </div>
          <MiniBarChart
            data={monthlyRevenue}
            labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']}
          />
        </Card>

        {/* Quick stats */}
        <Card>
          <div className="font-bold text-slate-900 mb-3">Quick Stats</div>
          <div className="space-y-3">
            <Link href="/admin/orders?status=pending" className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="text-sm text-slate-600">Pending Orders</span>
              <Badge variant="amber">{s.pendingOrders}</Badge>
            </Link>
            <Link href="/admin/products?stock=low" className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <span className="text-sm text-slate-600">Low Stock Items</span>
              <Badge variant="red">{s.lowStockProducts}</Badge>
            </Link>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">This Month Revenue</span>
              <span className="text-sm font-bold text-green-700">
                ₹{((monthlyRevenue[monthlyRevenue.length - 1] ?? 0) / 1000).toFixed(1)}K
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Avg Order Value</span>
              <span className="text-sm font-bold text-slate-900">
                ₹{s.totalOrders > 0 ? Math.round(s.totalRevenue / s.totalOrders) : 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding={false}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="font-bold text-slate-900">Recent Orders</div>
          <Link href="/admin/orders" className="text-xs text-green-600 font-semibold hover:underline">
            View all →
          </Link>
        </div>
        <Table headers={['Order', 'Customer', 'Total', 'Status', 'Date']}>
          {recentOrders.map(order => (
            <Tr key={order.id}>
              <Td>
                <Link href={`/admin/orders/${order.id}`}>
                  <span className="font-mono text-green-700 text-xs font-bold hover:underline">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </Link>
              </Td>
              <Td>
                <div className="font-semibold text-sm">{order.customer_name}</div>
                <div className="text-xs text-slate-400">{order.customer_email}</div>
              </Td>
              <Td><span className="font-bold">₹{order.total.toLocaleString()}</span></Td>
              <Td>{statusBadge(order.status)}</Td>
              <Td className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString('en-IN')}</Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}