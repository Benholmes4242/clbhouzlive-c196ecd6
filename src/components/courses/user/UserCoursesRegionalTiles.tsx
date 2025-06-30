
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Earth } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RegionalProgress {
  played: number;
  total: number;
}

interface UserCoursesRegionalTilesProps {
  regionProgress: Record<string, RegionalProgress>;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  isLoading: boolean;
}

const UserCoursesRegionalTiles: React.FC<UserCoursesRegionalTilesProps> = ({
  regionProgress,
  activeFilter,
  onFilterChange,
  isLoading
}) => {
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

  return (
    <div className="mb-8">
      <div className="flex items-center gap-6 mb-4">
        {/* All Courses Button */}
        <button
          onClick={() => onFilterChange(null)}
          className={`text-lg font-bold whitespace-nowrap px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 hover:text-[#b66b41] flex-shrink-0 ${
            activeFilter === null 
              ? "bg-green-100 text-green-800" 
              : "text-foreground"
          }`}
        >
          All Courses
        </button>

        {/* Mobile-Optimized Swipeable Flag Bar */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            className="overflow-x-auto scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorX: 'contain',
              maxWidth: '100%'
            }}
          >
            <style>
              {`
                .mobile-scroll-container::-webkit-scrollbar {
                  display: none;
                }
                .mobile-scroll-container {
                  scroll-snap-type: x mandatory;
                  scroll-padding: 0 16px;
                }
              `}
            </style>
            <div 
              className="flex items-center gap-6 pb-2 px-4 mobile-scroll-container"
              style={{ 
                minWidth: 'max-content',
                width: 'max-content'
              }}
            >
              <TooltipProvider>
                {tiles.map((tile, index) => {
                  return (
                    <Tooltip key={tile.key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                          className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 hover:text-[#b66b41] whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-full ${
                            activeFilter === tile.key 
                              ? 'bg-green-100 text-green-800' 
                              : 'text-foreground'
                          }`}
                          style={{ 
                            scrollSnapAlign: index === 0 ? 'start' : index === tiles.length - 1 ? 'end' : 'center'
                          }}
                        >
                          {tile.flag === 'earth' ? (
                            <Earth className="w-8 h-6 text-gray-600 flex-shrink-0" />
                          ) : (
                            <CountryFlag country={tile.country} size="lg" className="flex-shrink-0" />
                          )}
                          <span className="text-lg font-bold">
                            {tile.progress.played} / {tile.progress.total}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tile.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {tiles.find(t => t.key === activeFilter)?.label.replace(' Played', '')} courses
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(null)}
            className="h-auto p-1 text-muted-foreground hover:text-[#b66b41]"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserCoursesRegionalTiles;
