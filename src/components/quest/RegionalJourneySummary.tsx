/**
 * RegionalJourneySummary - Regional list progress as mini-quests
 * Features: Flag icons, animated progress bars
 */

import React, { useEffect, useState } from 'react';
import { ChevronRight, Globe, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface RegionProgress {
  id: string;
  name: string;
  shortName: string;
  played: number;
  total: number;
}

interface RegionalJourneySummaryProps {
  regions: RegionProgress[];
  onRegionClick?: (region: RegionProgress) => void;
}

// Region icon mapping
const getRegionIcon = (id: string) => {
  switch (id) {
    case 'gb-i':
      return '🇬🇧';
    case 'europe':
      return '🇪🇺';
    case 'usa':
      return '🇺🇸';
    case 'global':
      return '🌍';
    default:
      return '🏌️';
  }
};

const RegionRow: React.FC<{
  region: RegionProgress;
  index: number;
  onClick?: () => void;
}> = ({ region, index, onClick }) => {
  const prefersReducedMotion = useReducedMotion();
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;
  const isComplete = region.played >= region.total && region.total > 0;

  // Animate progress bar on mount
  useEffect(() => {
    if (!prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimatedWidth(progressPercent);
      }, 400 + index * 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedWidth(progressPercent);
    }
  }, [progressPercent, prefersReducedMotion, index]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-3.5 transition-colors hover:bg-black/[0.02] -mx-2 px-2 rounded-lg",
        !prefersReducedMotion && "quest-animate-fade-up"
      )}
      style={{ animationDelay: prefersReducedMotion ? '0ms' : `${300 + index * 80}ms` }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        {/* Region icon */}
        <span className="text-lg">{getRegionIcon(region.id)}</span>
        
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--quest-text-primary)' }}>
          {region.name}
        </span>
        
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: isComplete
                ? 'rgba(210, 180, 97, 0.14)'
                : region.played > 0
                ? 'rgba(110, 146, 119, 0.12)'
                : 'var(--quest-pill-inactive)',
              border: isComplete
                ? '1px solid rgba(210, 180, 97, 0.3)'
                : region.played > 0
                ? '1px solid rgba(110, 146, 119, 0.2)'
                : '1px solid var(--quest-stroke)',
              color: isComplete
                ? '#8A7A42'
                : region.played > 0
                ? 'var(--quest-accent-green)'
                : 'var(--quest-text-tertiary)',
            }}
          >
            {isComplete ? 'Complete' : region.played > 0 ? 'In progress' : 'Not started'}
          </span>
          <span className="text-sm tabular-nums" style={{ color: 'var(--quest-text-secondary)' }}>
            {region.played} / {region.total}
          </span>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--quest-text-tertiary)' }} />
        </div>
      </div>

      {/* Animated progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--quest-track)' }}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all ease-out",
            region.played > 0 && !prefersReducedMotion && "quest-progress-highlight"
          )}
          style={{
            width: `${animatedWidth}%`,
            background: isComplete
              ? 'var(--quest-accent-gold)'
              : 'var(--quest-accent-green)',
            transitionDuration: '650ms',
          }}
        />
      </div>
    </button>
  );
};

export const RegionalJourneySummary: React.FC<RegionalJourneySummaryProps> = ({
  regions,
  onRegionClick,
}) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRegionClick = (region: RegionProgress) => {
    if (onRegionClick) {
      onRegionClick(region);
    } else {
      navigate(`/top100?tab=my-progress&region=${region.id}`);
    }
  };

  return (
    <section>
      <h2
        className={cn(
          "quest-section-title mb-4 px-1",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up"
        )}
        style={{ animationDelay: '200ms' }}
      >
        Journey Summary
      </h2>

      <div 
        className={cn(
          "quest-card rounded-xl p-4",
          isVisible && !prefersReducedMotion && "quest-animate-scale-in"
        )}
        style={{
          background: 'var(--quest-card)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow)',
          animationDelay: '250ms',
        }}
      >
        <div className="divide-y" style={{ borderColor: 'var(--quest-hairline)' }}>
          {regions.map((region, index) => (
            <RegionRow
              key={region.id}
              region={region}
              index={index}
              onClick={() => handleRegionClick(region)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegionalJourneySummary;
