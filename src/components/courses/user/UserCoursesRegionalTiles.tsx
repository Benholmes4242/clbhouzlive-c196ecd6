
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Earth, Trophy, TrendingUp, Clock } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

const UserCoursesRegionalTiles: React.FC<UserCoursesRegionalTilesProps> = ({
  regionProgress,
  activeFilter,
  onFilterChange,
  isLoading,
  sortBy,
  onSortChange
}) => {
  const isMobile = useIsMobile();

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
        {/* Sorting Controls */}
        <div className="flex justify-center">
          {!isMobile ? (
            <div className="flex gap-2">
              {sortOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => onSortChange(option.key)}
                    className={`flex items-center gap-2 text-base font-medium whitespace-nowrap px-1 py-1.5 shadow-lg shadow-black/10 transition-colors hover:bg-white/30 ${
                      sortBy === option.key 
                        ? "bg-white/40 backdrop-blur-sm border border-white/50 text-white" 
                        : "bg-white/20 backdrop-blur-sm border border-white/30 text-white"
                    }`}
                    style={{ borderRadius: '8px' }}
                  >
                    <IconComponent className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="w-full">
              <div className="flex gap-1 w-full">
                {sortOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.key}
                      onClick={() => onSortChange(option.key)}
                      className={`flex items-center justify-center gap-1 text-sm font-medium px-2 py-1.5 shadow-lg shadow-black/10 transition-colors flex-1 hover:bg-white/30 ${
                        sortBy === option.key 
                          ? "bg-white/40 backdrop-blur-sm border border-white/50 text-white" 
                          : "bg-white/20 backdrop-blur-sm border border-white/30 text-white"
                      }`}
                      style={{ borderRadius: '8px' }}
                    >
                      <IconComponent className="w-3 h-3" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Regional Filter Tiles */}
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
                        className={`flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap px-0.5 py-1.5 shadow-lg shadow-black/10 text-base font-medium hover:bg-white/30 ${
                          activeFilter === tile.key 
                            ? 'bg-white/40 backdrop-blur-sm border border-white/50 text-white' 
                            : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {tile.flag === 'earth' ? (
                          <Earth className="w-5 h-4 text-white flex-shrink-0" />
                        ) : (
                          <CountryFlag country={tile.country} size="md" className="flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold">
                          {tile.progress.played} / {tile.progress.total}
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
            <div className="grid grid-cols-4 gap-2">
              <TooltipProvider>
                {tiles.map((tile) => (
                  <Tooltip key={tile.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                        className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors px-1 py-2 shadow-lg shadow-black/10 text-sm font-medium hover:bg-white/30 ${
                          activeFilter === tile.key 
                            ? 'bg-white/40 backdrop-blur-sm border border-white/50 text-white' 
                            : 'bg-white/20 backdrop-blur-sm border border-white/30 text-white'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {tile.flag === 'earth' ? (
                          <Earth className="w-4 h-4 text-white flex-shrink-0" />
                        ) : (
                          <CountryFlag country={tile.country} size="sm" className="flex-shrink-0" />
                        )}
                        <span className="text-xs font-semibold">
                          {tile.progress.played} / {tile.progress.total}
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
      </div>

      {/* Active Filter Indicator */}
      {activeFilter && (
        <div className="flex items-center justify-center gap-2 text-sm text-white">
          <span>
            Showing {tiles.find(t => t.key === activeFilter)?.label.replace(' Played', '')} courses
          </span>
        </div>
      )}
    </div>
  );
};

export default UserCoursesRegionalTiles;
