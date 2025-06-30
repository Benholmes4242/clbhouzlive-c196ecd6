
import React from 'react';
import { Button } from '@/components/ui/button';
import { filterOptions } from './types';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm pb-4 mb-6">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {filterOptions.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "secondary" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter)}
            className={`whitespace-nowrap flex-shrink-0 ${
              activeFilter === filter 
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200" 
                : ""
            }`}
          >
            {filter}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ExploreFilters;
