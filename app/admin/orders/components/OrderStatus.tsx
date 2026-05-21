'use client';

import { useState, useEffect } from 'react';
import { OrderTracking } from '@/types';
import { CheckCircle, Circle, Truck, Package, Clock, AlertCircle } from 'lucide-react';

interface OrderStatusProps {
  currentStatus: string;
  trackingHistory?: OrderTracking[];
  showTimeline?: boolean;
  onStatusUpdate?: (newStatus: string, note: string) => void;
  canUpdate?: boolean;
}

interface StatusStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const statusSteps: StatusStep[] = [
  {
    key: 'pending',
    label: 'Order Placed',
    icon: <Clock size={18} />,
    description: 'Your order has been received',
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: <Package size={18} />,
    description: 'Your order is being processed',
  },
  {
    key: 'packed',
    label: 'Packed',
    icon: <Package size={18} />,
    description: 'Your order has been packed',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: <Truck size={18} />,
    description: 'Your order is on the way',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: <Truck size={18} />,
    description: 'Your order is out for delivery',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: <CheckCircle size={18} />,
    description: 'Your order has been delivered',
  },
];

const statusColors: Record<string, string> = {
  pending: 'text-amber-500 border-amber-500',
  processing: 'text-blue-500 border-blue-500',
  packed: 'text-blue-500 border-blue-500',
  shipped: 'text-purple-500 border-purple-500',
  out_for_delivery: 'text-purple-500 border-purple-500',
  delivered: 'text-green-500 border-green-500',
  cancelled: 'text-red-500 border-red-500',
};

const statusBackgrounds: Record<string, string> = {
  pending: 'bg-amber-50',
  processing: 'bg-blue-50',
  packed: 'bg-blue-50',
  shipped: 'bg-purple-50',
  out_for_delivery: 'bg-purple-50',
  delivered: 'bg-green-50',
  cancelled: 'bg-red-50',
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderStatus({ 
  currentStatus, 
  trackingHistory = [], 
  showTimeline = true,
  onStatusUpdate,
  canUpdate = false,
}: OrderStatusProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [statusNote, setStatusNote] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [animatedStatus, setAnimatedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
    setAnimatedStatus(currentStatus);
  }, [currentStatus]);

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const handleStatusUpdate = () => {
    if (onStatusUpdate && selectedStatus !== currentStatus) {
      onStatusUpdate(selectedStatus, statusNote);
      setShowUpdateForm(false);
      setStatusNote('');
    }
  };

  // Status card component
  const StatusCard = () => {
    const currentStep = statusSteps.find(s => s.key === currentStatus);
    const isCancelled = currentStatus === 'cancelled';
    
    if (isCancelled) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Order Cancelled</h3>
          <p className="text-red-600 text-sm">This order has been cancelled</p>
        </div>
      );
    }

    return (
      <div className={`${statusBackgrounds[currentStatus]} border rounded-lg p-6 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Current Status</h3>
            <p className="text-sm text-slate-500 mt-1">Track your order progress</p>
          </div>
          {canUpdate && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Update Status
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${statusBackgrounds[currentStatus]} border ${statusColors[currentStatus]}`}>
            {currentStep?.icon}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{currentStep?.label}</div>
            <div className="text-sm text-slate-500">{currentStep?.description}</div>
          </div>
        </div>

        {showUpdateForm && canUpdate && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Change Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 mb-3"
            >
              {statusSteps.map(step => (
                <option key={step.key} value={step.key}>{step.label}</option>
              ))}
              <option value="cancelled">Cancelled</option>
            </select>
            
            <label className="block text-sm font-semibold text-slate-700 mb-2">Note (Optional)</label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 mb-3"
              rows={3}
              placeholder="Add any additional notes about this update..."
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpdateForm(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Timeline component
  const Timeline = () => {
    const currentIndex = getCurrentStepIndex();
    
    return (
      <div className="relative">
        {statusSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const trackingEvent = trackingHistory.find(t => t.status === step.key);
          
          return (
            <div key={step.key} className="relative mb-8 last:mb-0">
              {/* Connecting line */}
              {index < statusSteps.length - 1 && (
                <div 
                  className={`absolute left-5 top-10 w-0.5 h-12 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  } transition-colors duration-500`}
                />
              )}
              
              <div className="flex gap-4">
                {/* Icon */}
                <div className="relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-green-200 scale-110' : ''}`}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : step.icon}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className={`font-semibold ${
                      isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </h4>
                    {trackingEvent && (
                      <span className="text-xs text-slate-400">
                        {formatDate(trackingEvent.created_at)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    isCompleted ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {step.description}
                  </p>
                  {trackingEvent?.note && (
                    <p className="text-xs text-slate-500 mt-2 italic">
                      "{trackingEvent.note}"
                    </p>
                  )}
                  {isCurrent && !isCompleted && currentStatus !== 'delivered' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                        In Progress
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Delivery info component
  const DeliveryInfo = ({ order }: { order?: any }) => {
    if (!order?.delivery_partner_name && !order?.estimated_delivery) return null;
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 mt-4">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Truck size={16} />
          Delivery Information
        </h4>
        {order.delivery_partner_name && (
          <div className="text-sm mb-2">
            <span className="text-slate-500">Partner:</span>{' '}
            <span className="font-medium text-slate-900">{order.delivery_partner_name}</span>
          </div>
        )}
        {order.delivery_partner_phone && (
          <div className="text-sm mb-2">
            <span className="text-slate-500">Contact:</span>{' '}
            <span className="font-medium text-slate-900">{order.delivery_partner_phone}</span>
          </div>
        )}
        {order.estimated_delivery && (
          <div className="text-sm">
            <span className="text-slate-500">Estimated Delivery:</span>{' '}
            <span className="font-medium text-slate-900">
              {new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <StatusCard />
      {showTimeline && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Order Timeline</h3>
          <Timeline />
        </div>
      )}
    </div>
  );
}