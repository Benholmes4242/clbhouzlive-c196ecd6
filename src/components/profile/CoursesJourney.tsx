import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import RegionDropdown from './RegionDropdown';
import SortViewDropdown from './SortViewDropdown';
import CourseHighlightsCarousel from './CourseHighlightsCarousel';
import { Badge } from '@/components/ui/badge';

interface CoursesJourneyProps {
  className?: string;
  userId?: string;
  userDisplayName?: string;
  isOwnProfile?: boolean;
}

const CoursesJourney: React.FC<CoursesJourneyProps> = ({ 
  className = '', 
  userId, 
  userDisplayName = 'User',
  isOwnProfile = false 
}) => {
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [selectedSort, setSelectedSort] = useState('rank-asc');
  const [viewType, setViewType] = useState<'cards' | 'list'>('cards');
  const journeyRings = [
    {
      id: 'xp-progress',
      value: '+300',
      label: 'XP',
      sublabel: 'Links Legend',
      color: 'from-cyan-400 to-cyan-600',
      progress: 75
    },
    {
      id: 'courses-milestone',
      value: '+20',
      label: '',
      sublabel: '17 more courses to unlock',
      color: 'from-purple-400 to-purple-600',
      progress: 60
    },
    {
      id: 'xp-milestone',
      value: '300',
      label: 'XP',
      sublabel: '',
      color: 'from-yellow-400 to-yellow-600',
      progress: 100,
      hasStars: true
    },
    {
      id: 'birdies-goal',
      value: '12',
      label: 'more birdies to unlock',
      sublabel: '',
      color: 'from-gray-300 to-gray-400',
      progress: 40
    }
  ];

  return (
    <div className={`w-full mb-6 md:mb-8 py-6 md:py-0 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Courses Journey Title moved above highlights */}
        <div className="flex items-center gap-2 mb-4 md:mb-6 md:py-6 md:pt-8 px-4 md:px-0">
          <h3 className="text-xl md:text-2xl text-foreground">Courses Journey</h3>
        </div>

        {/* Course Highlights Section with Badges */}
        <div className="space-y-6">
          <CourseHighlightsCarousel 
            userFirstName={userDisplayName?.split(' ')[0] || 'User'}
            isOwnProfile={isOwnProfile}
          />
        </div>

        {/* Controls Section */}
        <div className="flex items-center justify-between px-4 md:px-0 mt-6 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-foreground">Courses Played</span>
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

        {/* Progress rings section removed */}
      </div>
    </div>
  );
};

export default CoursesJourney;