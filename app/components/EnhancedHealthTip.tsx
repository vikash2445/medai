'use client';

import { useState, useEffect } from 'react';

interface HealthTip {
  title: string;
  tip: string;
  hindiTitle: string;
  hindiTip: string;
  whyItMatters: string;
  hindiWhyItMatters: string;
  steps: string[];
  hindiSteps: string[];
  quickFact: string;
  hindiQuickFact: string;
  reminderTime: string;
  category: string;
  date: string;
}

export default function EnhancedHealthTip() {
  const [tip, setTip] = useState<HealthTip | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/health-tip')
      .then(res => res.json())
      .then(data => {
        setTip(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching health tip:', err);
        setLoading(false);
      });
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      hydration: 'bg-blue-100 text-blue-700',
      exercise: 'bg-green-100 text-green-700',
      sleep: 'bg-purple-100 text-purple-700',
      nutrition: 'bg-orange-100 text-orange-700',
      wellness: 'bg-teal-100 text-teal-700',
      mental: 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, { hi: string; en: string }> = {
      hydration: { hi: 'जलयोजन', en: 'Hydration' },
      exercise: { hi: 'व्यायाम', en: 'Exercise' },
      sleep: { hi: 'नींद', en: 'Sleep' },
      nutrition: { hi: 'पोषण', en: 'Nutrition' },
      wellness: { hi: 'कल्याण', en: 'Wellness' },
      mental: { hi: 'मानसिक स्वास्थ्य', en: 'Mental Health' },
    };
    return names[category] || { hi: 'स्वास्थ्य', en: 'Health' };
  };

  const getReminderIcon = (time: string) => {
    const icons: Record<string, string> = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙',
      night: '🌃',
    };
    return icons[time] || '⏰';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!tip) return null;

  const categoryColor = getCategoryColor(tip.category);
  const categoryName = getCategoryName(tip.category);
  const reminderIcon = getReminderIcon(tip.reminderTime);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-mint to-mint-dark px-6 py-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💚</span>
            <div>
              <h2 className="text-white font-bold text-lg">
                {language === 'hi' ? '✨ आज का स्वास्थ्य सुझाव' : '✨ Today\'s Health Tip'}
              </h2>
              <p className="text-white/80 text-xs">
                {tip.date ? new Date(tip.date).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                }) : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${categoryColor}`}>
              {language === 'hi' ? categoryName.hi : categoryName.en}
            </span>
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm transition"
            >
              {language === 'hi' ? 'English' : 'हिंदी'}
            </button>
          </div>
        </div>
      </div>

      {/* Tip Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-xl text-ink mb-2">
            {language === 'hi' ? tip.hindiTitle : tip.title}
          </h3>
          <p className="text-gray-700 text-lg">
            {language === 'hi' ? tip.hindiTip : tip.tip}
          </p>
        </div>

        {/* Why It Matters */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <h4 className="font-semibold text-blue-800">
              {language === 'hi' ? 'क्यों जरूरी है?' : 'Why It Matters'}
            </h4>
          </div>
          <p className="text-blue-700 text-sm">
            {language === 'hi' ? tip.hindiWhyItMatters : tip.whyItMatters}
          </p>
        </div>

        {/* Quick Fact */}
        <div className="bg-yellow-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔬</span>
            <h4 className="font-semibold text-yellow-800">
              {language === 'hi' ? 'वैज्ञानिक तथ्य' : 'Science Fact'}
            </h4>
          </div>
          <p className="text-yellow-700 text-sm">
            {language === 'hi' ? tip.hindiQuickFact : tip.quickFact}
          </p>
        </div>

        {/* Steps - Collapsible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition"
        >
          <span className="font-semibold text-ink">
            {language === 'hi' ? '📋 कैसे करें (चरणबद्ध निर्देश)' : '📋 How To Do It (Step by Step)'}
          </span>
          <span className="text-mint text-xl">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            {(language === 'hi' ? tip.hindiSteps : tip.steps).map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-6 h-6 bg-mint-light rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-mint-dark text-xs font-bold">{idx + 1}</span>
                </div>
                <p className="text-gray-700 text-sm">{step}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reminder */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <span>{reminderIcon}</span>
          <span className="text-sm text-gray-500">
            {language === 'hi' ? 'सबसे अच्छा समय:' : 'Best time:'}
            <strong className="text-mint-dark ml-1">
              {language === 'hi' 
                ? (tip.reminderTime === 'morning' ? 'सुबह' : tip.reminderTime === 'evening' ? 'शाम' : 'रात')
                : tip.reminderTime}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}