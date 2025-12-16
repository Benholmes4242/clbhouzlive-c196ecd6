/**
 * GolfPassport - Regional progress as collectible passport
 * Tactile rows, animated progress, premium feel
 */

import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
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

interface GolfPassportProps {
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

const PassportRow: React.FC<{
  region: RegionProgress;
  index: number;
  isWorldwide: boolean;
  onClick?: () => void;
}> = ({ region, index, isWorldwide, onClick }) => {
  const prefersReducedMotion = useReducedMotion();
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  const progressPercent = region.total > 0 ? (region.played / region.total) * 100 : 0;
  const isComplete = region.played >= region.total && region.total > 0;

  // Animate progress bar on mount
  useEffect(() => {
    if (!prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimatedWidth(progressPercent);
      }, 500 + index * 120);
      return () => clearTimeout(timer);
    } else {
      setAnimatedWidth(progressPercent);
    }
  }, [progressPercent, prefersReducedMotion, index]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-4 transition-colors hover:bg-black/[0.02] rounded-lg",
        !prefersReducedMotion && "quest-animate-fade-up"
      )}
      style={{ animationDelay: prefersReducedMotion ? '0ms' : `${400 + index * 80}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Region icon - slightly larger for worldwide */}
        <span className={cn("flex-shrink-0", isWorldwide ? "text-xl" : "text-lg")}>
          {getRegionIcon(region.id)}
        </span>
        
        <span 
          className={cn(
            "text-sm flex-1",
            isWorldwide ? "font-semibold" : "font-medium"
          )} 
          style={{ color: 'var(--quest-text-primary)' }}
        >
          {region.name}
        </span>
        
        <span 
          className="text-sm tabular-nums font-medium" 
          style={{ color: 'var(--quest-text-secondary)' }}
        >
          {region.played} / {region.total}
        </span>
        
        <ChevronRight 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: 'var(--quest-text-tertiary)' }} 
        />
      </div>

      {/* Progress bar - slightly thicker for worldwide */}
      <div
        className={cn(
          "rounded-full overflow-hidden",
          isWorldwide ? "h-2" : "h-1.5"
        )}
        style={{ background: 'var(--quest-track)' }}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all ease-out",
            region.played > 0 && !prefersReducedMotion && "quest-progress-highlight-slow"
          )}
          style={{
            width: `${animatedWidth}%`,
            background: isComplete
              ? 'var(--quest-accent-gold)'
              : 'var(--quest-accent-green)',
            transitionDuration: '700ms',
          }}
        />
      </div>
    </button>
  );
};

export const GolfPassport: React.FC<GolfPassportProps> = ({
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
        style={{ animationDelay: '350ms' }}
      >
        Your Golf Passport
      </h2>

      <div 
        className={cn(
          "rounded-2xl p-4",
          isVisible && !prefersReducedMotion && "quest-animate-scale-in"
        )}
        style={{
          background: 'var(--quest-card)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow)',
          animationDelay: '400ms',
        }}
      >
        <div className="space-y-1">
          {regions.map((region, index) => (
            <PassportRow
              key={region.id}
              region={region}
              index={index}
              isWorldwide={region.id === 'global'}
              onClick={() => handleRegionClick(region)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GolfPassport;
