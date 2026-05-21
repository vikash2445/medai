'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, Clock, Star, TrendingUp } from 'lucide-react';

interface Stat {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
}

export default function QuickStats() {
  const [stats, setStats] = useState<Stat[]>([
    { icon: <Package size={20} />, label: 'Products Available', value: '10,000+' },
    { icon: <Truck size={20} />, label: 'Delivery Time', value: '30-45 min', change: 'Fastest in city' },
    { icon: <Star size={20} />, label: 'Customer Rating', value: '4.9', change: '⭐ 50K+ reviews' },
    { icon: <TrendingUp size={20} />, label: 'Happy Customers', value: '2L+', change: 'Monthly active' },
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
              {stat.icon}
            </div>
            <div className="text-xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
            {stat.change && (
              <div className="text-xs text-green-600 mt-1">{stat.change}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}