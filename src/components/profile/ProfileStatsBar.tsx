import React, { useRef, useEffect, useState } from 'react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';

interface StatItem {
  value: string | number;
  label: string;
  onClick?: () => void;
}

interface ProfileStatsBarProps {
  stats: StatItem[];
}

const ProfileStatsBar: React.FC<ProfileStatsBarProps> = ({ stats }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateScrollState = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 2);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 2
      );
    }
  };

  useEffect(() => {
    updateScrollState();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, [stats]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Left fade gradient */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background/80 to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right fade gradient */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/80 to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Stats container */}
      <div 
        ref={containerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-0.5 bg-background/70 backdrop-blur-sm rounded-2xl border border-border/20 shadow-sm"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className="flex-shrink-0 w-24 flex flex-col items-center justify-center py-0.5 px-2 rounded-xl bg-background/50 hover:bg-background/80 transition-all duration-200 hover:shadow-sm"
          >
            <div className="text-lg font-semibold text-foreground">
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileStatsBar;