/**
 * Top100JourneySummary - Polished journey card (Hub standard)
 * 
 * Features:
 * - Gradient circle icon (amber/trophy)
 * - Progress bar with amber gradient
 * - Clean Hub styling
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';
import { useUserTop100Intent } from '@/hooks/useUserTop100Intent';

interface Top100JourneySummaryProps {
  className?: string;
  onStartJourney?: () => void;
  onContinueJourney?: () => void;
}

export const Top100JourneySummary: React.FC<Top100JourneySummaryProps> = ({
  className,
  onStartJourney,
  onContinueJourney,
}) => {
  const navigate = useNavigate();
  const { data: intent, isLoading } = useUserTop100Intent();
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const totalPlayed = intent?.total_top100_played ?? 0;
  const hasProgress = totalPlayed > 0;
  const progressPercent = Math.min((totalPlayed / 100) * 100, 100);

  // Animate progress only once on first load
  useEffect(() => {
    if (!isLoading && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, hasAnimated]);

  const handleClick = () => {
    if (hasProgress) {
      onContinueJourney?.() ?? navigate('/top100');
    } else {
      onStartJourney?.() ?? navigate('/top100');
    }
  };

  if (isLoading) {
    return (
      <div className={cn("bg-white border-b border-[#e2e8f0]", className)}>
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="w-12 h-12 rounded-full bg-[#e2e8f0] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-[#e2e8f0] rounded animate-pulse" />
            <div className="h-3 w-32 bg-[#e2e8f0] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn("w-full bg-white border-b border-[#e2e8f0]", className)}
    >
      <div className="flex items-center gap-4 px-4 py-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/60 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-amber-600" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Top 100 Journey
            </h3>
            <ChevronRight className="w-4 h-4 text-[#94a3b8] flex-shrink-0" />
          </div>
          
          {/* Progress Text */}
          <p className="text-xs text-[#64748b] mb-2">
            {hasProgress 
              ? <><span className="font-semibold" style={{ background: 'linear-gradient(to right, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{totalPlayed}</span> of 100 courses played</>
              : 'Begin your journey'
            }
          </p>
          
          {/* Progress Bar - Outstanding gradient */}
          {hasProgress && (
            <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: hasAnimated ? `${progressPercent}%` : '0%',
                  background: 'linear-gradient(to right, #f59e0b, #fbbf24)'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default Top100JourneySummary;
