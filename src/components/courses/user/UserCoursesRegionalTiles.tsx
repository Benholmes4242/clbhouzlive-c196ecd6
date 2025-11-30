
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Earth, Trophy, TrendingUp, Clock, ChevronRight, Plus } from 'lucide-react';
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
  isOwnProfile?: boolean;
  onAddCoursesClick?: () => void;
}

const UserCoursesRegionalTiles: React.FC<UserCoursesRegionalTilesProps> = ({
  regionProgress,
  activeFilter,
  onFilterChange,
  isLoading,
  sortBy,
  onSortChange,
  viewType,
  onViewTypeChange,
  isOwnProfile = false,
  onAddCoursesClick
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
      label: 'Top 100 GB&I Rated',
      country: 'Britain & Ireland',
      flag: '🇬🇧',
      progress: regionProgress['britain-ireland'] || { played: 0, total: 100 }
    },
    {
      key: 'europe',
      label: 'Top 100 Continental Europe Rated',
      country: 'Continental Europe',
      flag: '🇪🇺',
      progress: regionProgress['europe'] || { played: 0, total: 100 }
    },
    {
      key: 'usa',
      label: 'Top 100 USA Rated',
      country: 'USA',
      flag: '🇺🇸',
      progress: regionProgress['usa'] || { played: 0, total: 100 }
    },
    {
      key: 'global',
      label: 'Top 100 Worldwide Rated',
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
            <div className="flex justify-center gap-2">
              <TooltipProvider>
                {tiles.map((tile) => (
                  <Tooltip key={tile.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                        className={`flex items-center gap-2 text-base font-medium whitespace-nowrap px-6 py-2 transition-colors ${
                          activeFilter === tile.key 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-muted border border-border text-foreground hover:bg-muted/80'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {tile.flag === 'earth' ? (
                          <Earth className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <CountryFlag country={tile.country} size="md" className="flex-shrink-0" />
                        )}
                        <span className="text-base font-medium">
                          {tile.progress.played}/{tile.progress.total}
                        </span>
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
            <div className="flex justify-center gap-1">
              <TooltipProvider>
                {tiles.map((tile) => (
                  <Tooltip key={tile.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                        className={`flex items-center gap-2 text-base font-medium whitespace-nowrap px-4 py-2 transition-colors ${
                          activeFilter === tile.key 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-muted border border-border text-foreground hover:bg-muted/80'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {tile.flag === 'earth' ? (
                          <Earth className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <CountryFlag country={tile.country} size="md" className="flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          {tile.progress.played}/{tile.progress.total}
                        </span>
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
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIsSortViewModalOpen(true)}
            className="flex items-center gap-2 text-base font-medium whitespace-nowrap px-6 py-2 transition-colors bg-muted border border-border text-foreground hover:bg-muted/80"
            style={{ borderRadius: '8px' }}
          >
            <div className="flex items-center gap-2">
              Sort & View
              <ChevronRight className="ml-2 h-4 w-4" />
            </div>
          </button>

          {/* Add Courses Button - Only for own profile */}
          {isOwnProfile && onAddCoursesClick && (
            <button
              onClick={onAddCoursesClick}
              className="flex items-center gap-2 text-base font-medium whitespace-nowrap px-6 py-2 transition-colors bg-muted border border-border text-foreground hover:bg-muted/80"
              style={{ borderRadius: '8px' }}
            >
              <div className="flex items-center gap-2">
                📍 <Plus className="h-4 w-4" />
                Add Courses
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter && (
        <div className="flex items-center justify-center gap-2 text-sm text-foreground">
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
