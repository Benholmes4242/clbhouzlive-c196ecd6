import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import SortAndViewDropdown from './SortAndViewDropdown';

interface CoursesControlsProps {
  className?: string;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewType: 'cards' | 'list';
  onViewTypeChange: (viewType: 'cards' | 'list') => void;
}

const CoursesControls: React.FC<CoursesControlsProps> = ({ 
  className = '',
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  viewType,
  onViewTypeChange
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`w-full ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Controls Section */}
        <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'} px-4 md:px-0 pt-1 mb-4`}>
          <div className="flex items-center">
            <h3 className="text-xl md:text-2xl text-foreground">Courses Played</h3>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'justify-center' : 'gap-3'}`}>
            <SortAndViewDropdown 
              selectedRegion={activeFilter || 'all'}
              onRegionChange={onFilterChange}
              selectedSort={sortBy}
              onSortChange={onSortChange}
              viewType={viewType}
              onViewTypeChange={onViewTypeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesControls;