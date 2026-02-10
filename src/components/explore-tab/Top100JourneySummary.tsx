/**
 * Top100JourneySummary - Compact, elegant journey card
 * A* Polish: mx-4 rounded-2xl bg-white shadow-sm card
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
      <div className={cn("mt-5 mb-2 mx-4", className)}>
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-5 mb-2 mx-4", className)}>
      <button
        onClick={handleClick}
        className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-4 text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          {/* Trophy icon in amber container */}
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                Top 100 Journey
              </h3>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </div>
            
            <p className="text-sm text-gray-500 mt-0.5">
              {hasProgress 
                ? <><span className="font-semibold text-amber-500">{totalPlayed}</span> of 100 courses played</>
                : 'Begin your journey'
              }
            </p>
            
            {hasProgress && (
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden mt-2">
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
    </div>
  );
};

export default Top100JourneySummary;
