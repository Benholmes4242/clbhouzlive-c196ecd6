
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

  // Filter out excluded filters
  const availableFilters = filterOptions.filter(filter => !excludeFilters.includes(filter));

  // Split filters into two rows as evenly as possible
  const midpoint = Math.ceil(availableFilters.length / 2);
  const topRowFilters = availableFilters.slice(0, midpoint);
  const bottomRowFilters = availableFilters.slice(midpoint);

  // Carousel navigation hooks for each row
  const topRowCarousel = useCarouselNavigation(topRowFilters.length);
  const bottomRowCarousel = useCarouselNavigation(bottomRowFilters.length);

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

  const renderCarouselRow = (filters: string[], carouselRef: (node: HTMLDivElement | null) => void) => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      // Add bounce effect when reaching ends on mobile
      if (isMobile) {
        const container = e.currentTarget;
        const { scrollLeft, scrollWidth, clientWidth } = container;
        
        if (scrollLeft <= 0 || scrollLeft >= scrollWidth - clientWidth) {
          container.style.transform = scrollLeft <= 0 ? 'translateX(8px)' : 'translateX(-8px)';
          setTimeout(() => {
            container.style.transform = 'translateX(0)';
          }, 150);
        }
      }
    };

    return (
      <div 
        ref={carouselRef}
        className="flex space-x-3 overflow-x-auto scrollbar-hide transition-transform duration-150 ease-out px-1"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {filters.map(renderFilterButton)}
      </div>
    );
  };

  return (
    <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm pb-3 mb-4">
      <div className="space-y-3 md:px-4">
        {/* Top Row */}
        <div className="relative">
          {renderCarouselRow(topRowFilters, topRowCarousel.carouselRef)}
        </div>
        
        {/* Bottom Row */}
        <div className="relative">
          {renderCarouselRow(bottomRowFilters, bottomRowCarousel.carouselRef)}
        </div>
      </div>
    </div>
  );
};

export default ExploreFilters;
