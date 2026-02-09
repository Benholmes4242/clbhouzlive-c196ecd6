/**
 * StorylineInsightStrip - Editorial insight strip with rotating insights
 */

import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StorylineInsight } from '../../hooks/useTourOverviewData';

interface StorylineInsightStripProps {
  insights: StorylineInsight[];
}

export function StorylineInsightStrip({ insights }: StorylineInsightStripProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % insights.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [insights.length]);

  if (!insights.length) return null;

  const current = insights[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-primary/5 via-card to-primary/5">
      {/* Frosted glass effect */}
      <div className="absolute inset-0 backdrop-blur-sm" />
      
      <div className="relative px-5 py-4 flex items-center gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        
        {/* Insight Text */}
        <p className="text-sm text-foreground flex-1 leading-relaxed">
          {current.text}
        </p>
        
        {/* Navigation dots */}
        {insights.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            {insights.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? 'bg-primary w-3' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`View insight ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
