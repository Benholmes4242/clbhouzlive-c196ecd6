
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, TvMinimalPlay, Zap, Brain, Users, TrendingUp } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { PiGolf } from 'react-icons/pi';
import { filterOptions, FILTER_TYPES } from './types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  excludeFilters?: string[];
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ activeFilter, onFilterChange, excludeFilters = [] }) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

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
    const iconProps = { className: "w-5 h-5", strokeWidth: 2 };
    
    switch (filter) {
      case FILTER_TYPES.FRIENDS:
        return <Users {...iconProps} />;
      case FILTER_TYPES.VIDEOS:
        return <MdOutlinePlayCircle className="w-5 h-5" />;
      case FILTER_TYPES.PHOTOS:
        return <Camera {...iconProps} />;
      case FILTER_TYPES.TRENDING:
        return <TrendingUp {...iconProps} />;
      case FILTER_TYPES.VERIFIED_PROS:
        return <PiGolf className="w-5 h-5" />;
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
    
    return (
      <button
        key={filter}
        onClick={() => onFilterChange(filter)}
        className={`
          flex flex-col items-center gap-1 px-3 py-2 min-w-[80px] 
          whitespace-nowrap flex-shrink-0 transition-all duration-200 ease-in-out
          focus:outline-none border rounded-xl bg-gradient-to-b relative
          ${isActive 
            ? 'from-emerald-50 to-emerald-100 border-emerald-300 shadow-sm' 
            : 'from-white to-gray-50 border-gray-200 hover:from-gray-50 hover:to-gray-100 active:from-gray-100 active:to-gray-200'
          }
        `}
      >
        {/* Icon */}
        <div className={`transition-colors duration-200 ${
          isActive ? 'text-emerald-600' : 'text-gray-600'
        }`}>
          {getFilterIcon(filter)}
        </div>
        
        {/* Label */}
        <span className={`text-xs font-medium transition-colors duration-200 ${
          isActive ? 'text-emerald-700 font-semibold' : 'text-gray-700'
        }`}>
          {filter}
        </span>
        
        {/* Active indicator dot */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
        )}
      </button>
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    checkScrollPosition();
    
    // Add bounce effect when reaching ends
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    if (scrollLeft <= 0 && isAtStart) {
      container.style.transform = 'translateX(8px)';
      container.style.transition = 'transform 150ms ease-out';
      setTimeout(() => {
        container.style.transform = 'translateX(0)';
      }, 150);
    } else if (scrollLeft >= scrollWidth - clientWidth && isAtEnd) {
      container.style.transform = 'translateX(-8px)';
      container.style.transition = 'transform 150ms ease-out';
      setTimeout(() => {
        container.style.transform = 'translateX(0)';
      }, 150);
    }
  };

  return (
    <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-4">
      <div className="md:px-4">
        {/* Single Row Horizontal Scroll */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex space-x-3 overflow-x-auto scrollbar-hide px-1"
            onScroll={handleScroll}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
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

export default ExploreFilters;
