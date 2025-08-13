import React from 'react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';

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
  const { regionProgress, isLoading } = useTop100CoursesData(userId || '', isOwnProfile);

  // Define the four regional achievements in order: Left → Right
  const achievementRings = [
    {
      id: 'legends-club',
      title: 'Legends Club',
      subtitle: 'Top 100 Worldwide Courses',
      region: 'global',
      color: '#FFD700', // Gold for worldwide
      gradient: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 'stars-stripes',
      title: 'Stars and Stripes Tourer',
      subtitle: 'Top 100 USA Courses',
      region: 'usa',
      color: '#1E40AF', // Blue for USA
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      id: 'links-legend',
      title: 'Links Legend',
      subtitle: 'Top 100 Great Britain & Ireland Courses',
      region: 'britain-ireland',
      color: '#059669', // Green for Britain & Ireland
      gradient: 'from-green-500 to-green-700'
    },
    {
      id: 'continental-swinger',
      title: 'Continental Swinger',
      subtitle: 'Top 100 Continental Europe Courses',
      region: 'europe',
      color: '#DC2626', // Red for Continental Europe
      gradient: 'from-red-500 to-red-700'
    }
  ];

  const getProgressData = (region: string) => {
    const data = regionProgress[region] || { played: 0, total: 100 };
    const percentage = data.total > 0 ? (data.played / data.total) * 100 : 0;
    const remaining = Math.max(0, data.total - data.played);
    
    return {
      played: data.played,
      total: data.total,
      percentage: Math.min(percentage, 100),
      remaining
    };
  };

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
          {/* Desktop: Single row */}
          <div className="hidden md:flex gap-6 justify-center">
            {achievementRings.map((achievement) => {
              const progress = getProgressData(achievement.region);
              return (
                <div key={achievement.id} className="flex flex-col items-center cursor-pointer group">
                  <div className="w-36 h-36 relative transition-all duration-300 group-hover:scale-105">
                    {/* Progress Ring */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="4"
                        opacity="0.2"
                      />
                      {/* Progress circle with gradient */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={achievement.color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${progress.percentage * 2.64} 264`}
                        className="transition-all duration-700 ease-out"
                        style={{
                          filter: `drop-shadow(0 0 8px ${achievement.color}40)`
                        }}
                      />
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {progress.played} / {progress.total}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        Courses
                      </div>
                    </div>
                  </div>
                  
                  {/* Achievement info below ring */}
                  <div className="mt-3 text-center max-w-32">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {progress.remaining > 0 
                        ? `${progress.remaining} courses to go to unlock`
                        : 'Achievement unlocked!'
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Swipeable carousel */}
          <div className="md:hidden">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-4"
                 style={{
                   scrollbarWidth: 'none',
                   msOverflowStyle: 'none',
                   WebkitOverflowScrolling: 'touch',
                   scrollSnapType: 'x mandatory'
                 }}>
              {achievementRings.map((achievement, index) => {
                const progress = getProgressData(achievement.region);
                const isLast = index === achievementRings.length - 1;
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`flex-shrink-0 flex flex-col items-center cursor-pointer ${isLast ? 'pr-4' : ''}`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="w-28 h-28 relative transition-all duration-300">
                      {/* Progress Ring */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="4"
                          opacity="0.2"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={achievement.color}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={`${progress.percentage * 2.64} 264`}
                          className="transition-all duration-700 ease-out"
                          style={{
                            filter: `drop-shadow(0 0 6px ${achievement.color}40)`
                          }}
                        />
                      </svg>
                      
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <div className="text-lg font-bold text-foreground">
                          {progress.played} / {progress.total}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          Courses
                        </div>
                      </div>
                    </div>
                    
                    {/* Achievement info below ring */}
                    <div className="mt-2 text-center w-28">
                      <div className="text-xs font-semibold text-foreground mb-1 line-clamp-2">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {progress.remaining > 0 
                          ? `${progress.remaining} to unlock`
                          : 'Unlocked!'
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Peek indicator for mobile */}
              <div className="flex-shrink-0 w-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesJourney;