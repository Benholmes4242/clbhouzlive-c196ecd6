
import React from 'react';
import { Button } from '@/components/ui/button';
import { filterOptions } from './types';

interface ExploreFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {filterOptions.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter)}
            className={`whitespace-nowrap ${
              activeFilter === filter 
                ? 'bg-[#2a2626] text-white hover:bg-[#2a2626]/90' 
                : 'hover:bg-muted'
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
