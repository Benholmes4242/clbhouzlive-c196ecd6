
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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
      flag: '🌍',
      progress: regionProgress['global'] || { played: 0, total: 100 }
    }
  ];

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
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
      <div className="flex items-center gap-4 mb-4">
        {/* All Courses Button */}
        <Button
          variant={activeFilter === null ? "default" : "ghost"}
          size="sm"
          onClick={() => onFilterChange(null)}
          className={`text-sm font-medium ${
            activeFilter === null 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Courses
        </Button>

        {/* Draggable Flag Bar */}
        <div className="relative flex-1">
          {/* Gradient overlays for draggable hint */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none opacity-50" />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none opacity-50" />
          
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-6 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
              <TooltipProvider>
                {tiles.map((tile) => {
                  const percentage = tile.progress.total > 0 ? Math.round((tile.progress.played / tile.progress.total) * 100) : 0;
                  
                  return (
                    <Tooltip key={tile.key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onFilterChange(activeFilter === tile.key ? null : tile.key)}
                          className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                            activeFilter === tile.key ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ scrollSnapAlign: 'start' }}
                        >
                          <CountryFlag country={tile.country} size="lg" />
                          <span className="text-lg font-bold">
                            {tile.progress.played} / {tile.progress.total}
                          </span>
                          
                          {/* Optional: Progress bar beneath the count */}
                          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-600 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
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
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserCoursesRegionalTiles;
