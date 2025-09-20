import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, TvMinimalPlay, Zap, Brain, Users } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { PiGolf } from 'react-icons/pi';
import { IoFlameOutline } from 'react-icons/io5';
import { filterOptions, FILTER_TYPES } from '@/components/explore/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDiscoverQuery } from '@/utils/useDiscoverQuery';
import { cn } from '@/lib/utils';

interface DiscoverPillRowProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  excludeFilters?: string[];
}

const DiscoverPillRow: React.FC<DiscoverPillRowProps> = ({ 
  activeFilter, 
  onFilterChange, 
  excludeFilters = [] 
}) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const { main, setMainFromFilter } = useDiscoverQuery();

  // Filter out excluded filters
  const availableFilters = filterOptions.filter(filter => !excludeFilters.includes(filter));

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setIsAtStart(scrollLeft <= 10);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
  }, []);

  const getFilterIcon = (filter: string) => {
    const iconProps = { className: "w-4 h-4", strokeWidth: 2 };
    
    switch (filter) {
      case FILTER_TYPES.FRIENDS:
        return <Users {...iconProps} />;
      case FILTER_TYPES.VIDEOS:
        return <MdOutlinePlayCircle className="w-4 h-4" />;
      case FILTER_TYPES.PHOTOS:
        return <Camera {...iconProps} />;
      case FILTER_TYPES.TRENDING:
        return <IoFlameOutline className="w-4 h-4" />;
      case FILTER_TYPES.VERIFIED_PROS:
        return <PiGolf className="w-4 h-4" />;
      case FILTER_TYPES.CHANNELS:
        return <TvMinimalPlay {...iconProps} />;
      case FILTER_TYPES.HACK_SHACK:
        return <Zap {...iconProps} />;
      case FILTER_TYPES.BRAIN_GAME:
        return <Brain {...iconProps} />;
      default:
        return null;
    }
  };

  const renderFilterButton = (filter: string) => {
    const isActive = activeFilter === filter;
    
    const handleFilterClick = () => {
      // Update both the old filter state and new URL state
      onFilterChange(filter);
      setMainFromFilter(filter);
    };
    
    return (
      <button
        key={filter}
        onClick={handleFilterClick}
        className={cn(
          // Base styles
          "discover-pill",
          // Active state
          isActive && "discover-pill--active"
        )}
      >
        {/* Icon */}
        <div className="discover-pill__icon">
          {getFilterIcon(filter)}
        </div>
        
        {/* Label */}
        <span className="discover-pill__label">{filter}</span>
      </button>
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    checkScrollPosition();
    
    // Add bounce effect when reaching ends
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    if (scrollLeft <= 0 && isAtStart) {
      container.style.transform = 'translateX(4px)';
      container.style.transition = 'transform 150ms ease-out';
      setTimeout(() => {
        container.style.transform = 'translateX(0)';
      }, 150);
    } else if (scrollLeft >= scrollWidth - clientWidth && isAtEnd) {
      container.style.transform = 'translateX(-4px)';
      container.style.transition = 'transform 150ms ease-out';
      setTimeout(() => {
        container.style.transform = 'translateX(0)';
      }, 150);
    }
  };

  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm">
      <div className="px-4 md:container md:mx-auto md:px-6">
        {/* Single Row Horizontal Scroll */}
        <div className="relative py-3">
          <div 
            ref={scrollContainerRef}
            className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide"
            onScroll={handleScroll}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              scrollSnapType: 'x mandatory'
            }}
          >
            {availableFilters.map(renderFilterButton)}
          </div>
          
          {/* Gradient overlays for visual scroll indication */}
          {!isAtStart && (
            <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          {!isAtEnd && (
            <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPillRow;