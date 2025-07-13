
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Camera, Zap } from 'lucide-react';
import { filterOptions, FILTER_TYPES } from './types';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ activeFilter, onFilterChange }) => {
  const getFilterIcon = (filter: string) => {
    switch (filter) {
      case FILTER_TYPES.VIDEOS:
        return <Video className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.PHOTOS:
        return <Camera className="w-4 h-4 mr-2" />;
      case FILTER_TYPES.HACK_SHACK:
        return <Zap className="w-4 h-4 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-6">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {filterOptions.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "secondary" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter)}
            className={`whitespace-nowrap flex-shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex items-center ${
              activeFilter === filter 
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200" 
                : ""
            }`}
          >
            {getFilterIcon(filter)}
            {filter}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ExploreFilters;
