'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Tag, Clock, ChevronRight } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  code?: string;
  expiryDate?: string;
  bgColor: string;
}

export default function NotificationBanner() {
  const [showBanner, setShowBanner] = useState(true);
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [offers] = useState<Offer[]>([
    {
      id: '1',
      title: 'First Order Discount',
      description: 'Get 20% off on your first medicine order',
      discount: '20% OFF',
      code: 'MED20',
      expiryDate: 'Dec 31, 2025',
      bgColor: 'from-green-500 to-teal-500',
    },
    {
      id: '2',
      title: 'Free Delivery',
      description: 'On orders above ₹499',
      discount: 'FREE DELIVERY',
      expiryDate: 'Ongoing',
      bgColor: 'from-blue-500 to-cyan-500',
    },
    {
      id: '3',
      title: 'Health Checkup',
      description: 'Book a full body checkup at 50% off',
      discount: '50% OFF',
      code: 'HEALTH50',
      expiryDate: 'Limited Period',
      bgColor: 'from-purple-500 to-pink-500',
    },
  ]);

  useEffect(() => {
    // Rotate offers every 5 seconds
    const interval = setInterval(() => {
      setActiveOffer(prev => {
        const currentIndex = offers.findIndex(o => o.id === prev?.id);
        const nextIndex = (currentIndex + 1) % offers.length;
        return offers[nextIndex];
      });
    }, 5000);
    
    setActiveOffer(offers[0]);
    return () => clearInterval(interval);
  }, [offers]);

  if (!showBanner || !activeOffer) return null;

  return (
    <div className={`bg-gradient-to-r ${activeOffer.bgColor} text-white relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 animate-pulse">
              <Tag size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base">
                {activeOffer.title}: {activeOffer.discount}
              </p>
              <p className="text-xs opacity-90 truncate">{activeOffer.description}</p>
            </div>
            {activeOffer.code && (
              <div className="flex-shrink-0 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <code className="text-sm font-mono">{activeOffer.code}</code>
              </div>
            )}
            <div className="flex-shrink-0 text-xs opacity-75 hidden sm:flex items-center gap-1">
              <Clock size={12} />
              {activeOffer.expiryDate}
            </div>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}