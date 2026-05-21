'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Order } from '@/types';
import { Table, Tr, Td, Badge, Button } from '@/components/admin/ui';
import { Eye, Truck, CheckCircle, Clock, XCircle, Package } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  loading?: boolean;
  onStatusChange?: (orderId: string, newStatus: string) => void;
  showActions?: boolean;
}

const statusConfig: Record<string, { color: 'green' | 'amber' | 'blue' | 'red' | 'purple' | 'gray'; icon: React.ReactNode; label: string }> = {
  delivered: { 
    color: 'green', 
    icon: <CheckCircle size={12} />, 
    label: 'Delivered' 
  },
  shipped: { 
    color: 'blue', 
    icon: <Truck size={12} />, 
    label: 'Shipped' 
  },
  out_for_delivery: { 
    color: 'purple', 
    icon: <Truck size={12} />, 
    label: 'Out for Delivery' 
  },
  processing: { 
    color: 'amber', 
    icon: <Clock size={12} />, 
    label: 'Processing' 
  },
  packed: { 
    color: 'amber', 
    icon: <Package size={12} />, 
    label: 'Packed' 
  },
  pending: { 
    color: 'gray', 
    icon: <Clock size={12} />, 
    label: 'Pending' 
  },
  cancelled: { 
    color: 'red', 
    icon: <XCircle size={12} />, 
    label: 'Cancelled' 
  },
};

function formatOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant={config.color} className="inline-flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: 'green' | 'amber' | 'red' | 'gray'; label: string }> = {
    paid: { color: 'green', label: 'Paid' },
    pending: { color: 'amber', label: 'Pending' },
    failed: { color: 'red', label: 'Failed' },
    refunded: { color: 'gray', label: 'Refunded' },
  };
  const { color, label } = config[status] || config.pending;
  return <Badge variant={color}>{label}</Badge>;
}

export default function OrderTable({ orders, loading = false, onStatusChange, showActions = true }: OrderTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (onStatusChange) {
      setUpdatingStatus(orderId);
      await onStatusChange(orderId, newStatus);
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package size={48} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
        <p className="text-slate-500">No orders match your search criteria</p>
      </div>
    );
  }

  return (
    <Table
      headers={['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Actions']}
    >
      {orders.map((order) => (
        <Tr key={order.id}>
          <Td>
            <span className="font-mono font-bold text-green-700 text-xs">
              #{formatOrderId(order.id)}
            </span>
          </Td>
          <Td>
            <div className="font-semibold text-slate-900">{order.customer_name}</div>
            <div className="text-xs text-slate-400">{order.customer_email}</div>
          </Td>
          <Td className="text-slate-500">—</Td>
          <Td>
            <span className="font-bold text-slate-900">
              ₹{order.total.toLocaleString()}
            </span>
          </Td>
          <Td>
            <PaymentStatusBadge status={order.payment_status} />
          </Td>
          <Td>
            <StatusBadge status={order.status} />
          </Td>
          <Td className="text-slate-400 text-xs">
            {formatDate(order.created_at)}
          </Td>
          <Td>
            <div className="flex gap-2">
              <Link href={`/admin/orders/${order.id}`}>
                <Button size="sm" variant="outline" icon={<Eye size={12} />}>
                  View
                </Button>
              </Link>
              {showActions && onStatusChange && (
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingStatus === order.id}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-green-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </Td>
        </Tr>
      ))}
    </Table>
  );
}