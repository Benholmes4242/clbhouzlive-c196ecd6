import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';
import RegionDropdown from './RegionDropdown';
import SortViewDropdown from './SortViewDropdown';
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
    <div className={`w-full mb-6 md:mb-8 pt-1 ${className}`}>
      <div className="md:max-w-[1150px] md:mx-auto">
        {/* Courses Journey Title moved above highlights */}
        <div className="flex items-center gap-2 mb-4 md:mb-6 px-4 md:px-0">
          <h3 className="text-xl md:text-2xl text-foreground">Courses Journey</h3>
        </div>

        {/* Course highlights section removed */}

        {/* Controls Section moved - now appears above depth stack carousel */}

        {/* Progress Rings Section */}
        <div className="relative">
          <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 md:justify-center px-4 md:px-0"
               style={{
                 scrollbarWidth: 'none',
                 msOverflowStyle: 'none',
                 WebkitOverflowScrolling: 'touch'
               }}>
            {journeyRings.map((ring, index) => (
              <div key={ring.id} className="flex-shrink-0 flex flex-col items-center cursor-pointer w-28 md:w-36">
                <div className="w-28 h-28 md:w-32 md:h-32 relative transition-all duration-300 hover:scale-105">
                  {/* Progress Ring */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-muted/20"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${ring.progress * 2.83} 283`}
                      className={`bg-gradient-to-br ${ring.color}`}
                      style={{
                        stroke: ring.progress === 100 ? '#eab308' : 
                               ring.color.includes('cyan') ? '#06b6d4' :
                               ring.color.includes('purple') ? '#a855f7' :
                               ring.color.includes('gray') ? '#9ca3af' : '#06b6d4'
                      }}
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-lg md:text-xl font-bold text-foreground">
                      {ring.value}
                    </div>
                    {ring.label && (
                      <div className="text-xs text-muted-foreground">
                        {ring.label}
                      </div>
                    )}
                    {ring.hasStars && (
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3].map((star) => (
                          <div key={star} className="w-2 h-2 bg-yellow-400 rounded-full" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Label below ring */}
                <div className="text-xs text-muted-foreground font-medium mt-1 text-center line-clamp-2">
                  {ring.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesJourney;