import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import RegionDropdown from './RegionDropdown';
import SortViewDropdown from './SortViewDropdown';

interface CoursesControlsProps {
  className?: string;
}

const CoursesControls: React.FC<CoursesControlsProps> = ({ 
  className = ''
}) => {
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [selectedSort, setSelectedSort] = useState('rank-asc');
  const [viewType, setViewType] = useState<'cards' | 'list'>('cards');

  return (
    <div className={`w-full ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Controls Section */}
        <div className="flex items-center justify-between px-4 md:px-0 pt-6 mb-0">
          <div className="flex items-center gap-3">
            <h3 className="text-xl md:text-2xl text-foreground">Courses Played</h3>
            <RegionDropdown 
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
            />
            <SortViewDropdown 
              selectedSort={selectedSort}
              onSortChange={setSelectedSort}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewType(viewType === 'cards' ? 'list' : 'cards')}
            className="bg-white/10 backdrop-blur-2xl border border-white/20 text-black hover:bg-white/20 transition-all duration-300"
            style={{ backdropFilter: 'blur(40px) saturate(180%)', borderRadius: '8px' }}
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
  );
};

export default CoursesControls;