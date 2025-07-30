
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Earth, Trophy, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import ViewToggle from '@/components/profile/ViewToggle';
import SortViewModal from '@/components/profile/SortViewModal';
import type { SortType } from '@/components/profile/SortViewModal';

interface RegionalProgress {
  played: number;
  total: number;
}

interface UserCoursesRegionalTilesProps {
  regionProgress: Record<string, RegionalProgress>;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewType: 'cards' | 'list';
  onViewTypeChange: (view: 'cards' | 'list') => void;
}

const UserCoursesRegionalTiles: React.FC<UserCoursesRegionalTilesProps> = ({
  regionProgress,
  activeFilter,
  onFilterChange,
  isLoading,
  sortBy,
  onSortChange,
  viewType,
  onViewTypeChange
}) => {
  const isMobile = useIsMobile();
  const [isSortViewModalOpen, setIsSortViewModalOpen] = useState(false);

  // Convert between different sort value formats
  const convertToModalSort = (sort: string): SortType => {
    switch (sort) {
      case 'rating-high-low':
        return 'rank-desc';
      case 'rating-low-high':
        return 'rank-asc';
      case 'recently-played':
        return 'recent';
      default:
        return 'rank-desc';
    }
  };

  const convertFromModalSort = (sort: SortType): string => {
    switch (sort) {
      case 'rank-desc':
        return 'rating-high-low';
      case 'rank-asc':
        return 'rating-low-high';
      case 'recent':
        return 'recently-played';
      default:
        return 'rating-high-low';
    }
  };

  const tiles = [
    {
      key: 'britain-ireland',
      label: 'Top 100 GB&I Played',
      country: 'Britain & Ireland',
      flag: '🇬🇧',
      progress: regionProgress['britain-ireland'] || { played: 0, total: 100 }
    },
    {
      key: 'europe',
      label: 'Top 100 Continental Europe Played',
      country: 'Continental Europe',
      flag: '🇪🇺',
      progress: regionProgress['europe'] || { played: 0, total: 100 }
    },
    {
      key: 'usa',
      label: 'Top 100 USA Played',
      country: 'USA',
      flag: '🇺🇸',
      progress: regionProgress['usa'] || { played: 0, total: 100 }
    },
    {
      key: 'global',
      label: 'Top 100 Worldwide Played',
      country: 'Worldwide',
      flag: 'earth',
      progress: regionProgress['global'] || { played: 0, total: 100 }
    }
  ];

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-evenly items-center gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sortOptions = [
    {
      key: 'rating-high-low',
      label: 'Rank: High to Low',
      icon: Trophy
    },
    {
      key: 'rating-low-high', 
      label: 'Rank: Low to High',
      icon: TrendingUp
    },
    {
      key: 'recently-played',
      label: 'Recently Played',
      icon: Clock
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-4 mb-4">
        {/* Regional Filter Tiles - moved to top */}
        <div className="relative w-full">
          {/* Desktop: Spread across full width */}
          {!isMobile ? (
            <div className="grid grid-cols-4 gap-3">
              <TooltipProvider>
                {tiles.map((tile) => (
                  <Tooltip key={tile.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                        className={`relative flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap px-4 py-1 shadow-lg shadow-black/10 text-base font-medium overflow-hidden h-10 ${
                          activeFilter === tile.key 
                            ? 'text-white' 
                            : 'text-white hover:bg-white/20'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {/* Liquid glass background */}
                        <div 
                          className={`absolute inset-0 ${
                            activeFilter === tile.key 
                              ? 'bg-white/20 border border-white/30' 
                              : 'bg-white/10 border border-white/20'
                          }`}
                          style={{ 
                            backdropFilter: 'blur(40px) saturate(180%)',
                            borderRadius: '8px'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" style={{ borderRadius: '8px' }} />
                        
                        {/* Content */}
                        <div className="relative flex items-center justify-center gap-1">
                          {tile.flag === 'earth' ? (
                            <Earth className="w-7 h-6 text-white flex-shrink-0" />
                          ) : (
                            <CountryFlag country={tile.country} size="lg" className="flex-shrink-0" />
                          )}
                          <span className="text-sm font-semibold">
                            {tile.progress.played} / {tile.progress.total}
                          </span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tile.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          ) : (
            /* Mobile: Full width grid */
            <div className="grid grid-cols-4 gap-2">
              <TooltipProvider>
                {tiles.map((tile) => (
                  <Tooltip key={tile.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                        className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors px-2 py-0.5 shadow-lg shadow-black/10 text-sm font-medium overflow-hidden ${
                          activeFilter === tile.key 
                            ? 'text-white' 
                            : 'text-white hover:bg-white/20'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {/* Liquid glass background */}
                        <div 
                          className={`absolute inset-0 ${
                            activeFilter === tile.key 
                              ? 'bg-white/20 border border-white/30' 
                              : 'bg-white/10 border border-white/20'
                          }`}
                          style={{ 
                            backdropFilter: 'blur(40px) saturate(180%)',
                            borderRadius: '8px'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" style={{ borderRadius: '8px' }} />
                        
                        {/* Content */}
                        <div className="relative flex flex-col items-center justify-center gap-1">
                          {tile.flag === 'earth' ? (
                            <Earth className="w-6 h-6 text-white flex-shrink-0" />
                          ) : (
                            <CountryFlag country={tile.country} size="lg" className="flex-shrink-0" />
                          )}
                          <span className="text-xs font-semibold">
                            {tile.progress.played} / {tile.progress.total}
                          </span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tile.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Sort & View Controls */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setIsSortViewModalOpen(true)}
            className="px-6 py-2 rounded-lg bg-muted/50 hover:bg-muted"
          >
            Sort & View
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter && (
        <div className="flex items-center justify-center gap-2 text-sm text-white">
          <span>
            Showing {tiles.find(t => t.key === activeFilter)?.label.replace(' Played', '')} courses
          </span>
        </div>
      )}

      {/* Sort & View Modal */}
      <SortViewModal
        isOpen={isSortViewModalOpen}
        onClose={() => setIsSortViewModalOpen(false)}
        currentSort={convertToModalSort(sortBy)}
        currentView={viewType}
        onSortChange={(sort) => onSortChange(convertFromModalSort(sort))}
        onViewChange={onViewTypeChange}
      />
    </div>
  );
};

export default UserCoursesRegionalTiles;
