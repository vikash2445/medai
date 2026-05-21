'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, RefreshCw } from 'lucide-react';

const tips = [
  { text: "💧 Drink 8 glasses of water daily for better metabolism", category: "Hydration" },
  { text: "🥗 Add turmeric to your diet for natural anti-inflammatory benefits", category: "Nutrition" },
  { text: "🧘 Take 5-minute breathing breaks every hour to reduce stress", category: "Mental Health" },
  { text: "🏃‍♂️ 30 minutes of walking daily can reduce heart disease risk by 35%", category: "Exercise" },
  { text: "😴 7-8 hours of sleep boosts immunity and brain function", category: "Sleep" },
];

export default function CompactHealthTip() {
  const [currentTip, setCurrentTip] = useState(tips[0]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newIndex = (index + 1) % tips.length;
      setIndex(newIndex);
      setCurrentTip(tips[newIndex]);
    }, 8000);
    return () => clearInterval(interval);
  }, [index]);

  const refreshTip = () => {
    const newIndex = (index + 1) % tips.length;
    setIndex(newIndex);
    setCurrentTip(tips[newIndex]);
  };

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Lightbulb size={16} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{currentTip.category}</p>
            <p className="text-sm font-medium text-gray-800">{currentTip.text}</p>
          </div>
        </div>
        <button
          onClick={refreshTip}
          className="p-1 hover:bg-yellow-100 rounded-lg transition"
          title="Next tip"
        >
          <RefreshCw size={14} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}