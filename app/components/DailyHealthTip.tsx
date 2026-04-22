'use client';

import { useState, useEffect } from 'react';

interface HealthTip {
  tip: string;
  title: string;
  hindiTitle: string;
  hindiTip: string;
  category: string;
  date: string;
}

export default function DailyHealthTip() {
  const [tip, setTip] = useState<HealthTip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [language, setLanguage] = useState<'hi' | 'en'>('hi'); // Default to Hindi

  useEffect(() => {
    fetch('/api/health-tip')
      .then(res => res.json())
      .then(data => {
        setTip(data);
        setLoading(false);
      })
      .catch(() => {
        setTip({
          title: "Stay Hydrated",
          tip: "💧 Drink a glass of water first thing in the morning. It kickstarts your metabolism!",
          hindiTitle: "पानी पीते रहें",
          hindiTip: "💧 सुबह उठते ही एक गिलास पानी पिएं। यह आपके मेटाबॉलिज्म को तेज करता है।",
          category: "hydration",
          date: new Date().toISOString().split('T')[0]
        });
        setLoading(false);
      });
  }, []);

  const shareTip = () => {
    const shareText = language === 'hi' ? tip?.hindiTip : tip?.tip;
    if (tip && navigator.share) {
      navigator.share({
        title: language === 'hi' ? 'आज का स्वास्थ्य सुझाव' : 'Daily Health Tip',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText || '');
      setShowShare(true);
      setTimeout(() => setShowShare(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-28 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    hydration: 'bg-blue-100 text-blue-700',
    exercise: 'bg-green-100 text-green-700',
    sleep: 'bg-purple-100 text-purple-700',
    nutrition: 'bg-orange-100 text-orange-700',
    wellness: 'bg-teal-100 text-teal-700',
    mental: 'bg-indigo-100 text-indigo-700',
  };

  const categoryNames: Record<string, { hi: string; en: string }> = {
    hydration: { hi: 'जलयोजन', en: 'Hydration' },
    exercise: { hi: 'व्यायाम', en: 'Exercise' },
    sleep: { hi: 'नींद', en: 'Sleep' },
    nutrition: { hi: 'पोषण', en: 'Nutrition' },
    wellness: { hi: 'कल्याण', en: 'Wellness' },
    mental: { hi: 'मानसिक स्वास्थ्य', en: 'Mental Health' },
  };

  const categoryColor = categoryColors[tip?.category || 'wellness'] || 'bg-mint-light text-mint-dark';
  const categoryName = categoryNames[tip?.category || 'wellness']?.[language] || tip?.category;

  return (
    <div className="bg-gradient-to-r from-mint-light to-white rounded-xl p-5 border border-mint/20 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl animate-pulse">💚</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-mint-dark text-lg">
                {language === 'hi' ? '✨ आज का स्वास्थ्य सुझाव' : '✨ Today\'s Health Tip'}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor}`}>
                {categoryName}
              </span>
              <button
                onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                className="text-xs bg-white/50 hover:bg-white px-2 py-0.5 rounded-full text-mint-dark transition"
              >
                {language === 'hi' ? 'English' : 'हिंदी'}
              </button>
            </div>
            
            {/* Hindi Content */}
            {language === 'hi' && (
              <>
                <p className="text-ink font-semibold text-lg mb-1">{tip?.hindiTitle}</p>
                <p className="text-ink-soft leading-relaxed">{tip?.hindiTip}</p>
              </>
            )}
            
            {/* English Content */}
            {language === 'en' && (
              <>
                <p className="text-ink font-semibold text-lg mb-1">{tip?.title}</p>
                <p className="text-ink-soft leading-relaxed">{tip?.tip}</p>
              </>
            )}
            
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={shareTip}
                className="text-xs text-mint hover:text-mint-dark transition flex items-center gap-1"
              >
                📤 {language === 'hi' ? 'शेयर करें' : 'Share'}
              </button>
              <span className="text-xs text-ink-muted">
                {tip?.date ? new Date(tip.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'short' 
                }) : ''}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-ink-muted hover:text-mint transition text-sm"
          title={language === 'hi' ? 'नया सुझाव' : 'Refresh tip'}
        >
          🔄
        </button>
      </div>
      
      {showShare && (
        <div className="mt-3 text-center text-xs text-green-600 bg-green-50 rounded-lg p-2">
          {language === 'hi' ? '✓ सुझाव कॉपी हो गया!' : '✓ Tip copied to clipboard!'}
        </div>
      )}
    </div>
  );
}