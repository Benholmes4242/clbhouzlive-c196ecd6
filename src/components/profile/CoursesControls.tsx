import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import RegionDropdown from './RegionDropdown';
import SortViewDropdown from './SortViewDropdown';

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
          
          <div className={`flex items-center ${isMobile ? 'justify-center' : 'gap-3'} ${isMobile ? 'gap-2' : 'gap-3'}`}>
            <RegionDropdown 
              selectedRegion={activeFilter || 'global'}
              onRegionChange={onFilterChange}
            />
            <SortViewDropdown 
              selectedSort={sortBy}
              onSortChange={onSortChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewTypeChange(viewType === 'cards' ? 'list' : 'cards')}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 text-black shadow-lg hover:bg-white/20 transition-all duration-300 rounded-full px-3 py-1.5"
              style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
            >
              {viewType === 'cards' ? (
                <>
                  <List className="w-4 h-4 mr-2" />
                  List View
                </>
              ) : (
                <>
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Card View
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesControls;