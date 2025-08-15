import React from 'react';
import { useTop100CoursesData } from '@/hooks/useTop100CoursesData';
import CountryFlag from '@/components/ui/country-flag';
import usaMap from '@/assets/usa-map.png';
import ukIrelandMap from '@/assets/uk-ireland-map.png';
import continentalEuropeMap from '@/assets/continental-europe-map.png';

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
      title: 'Worldwide',
      subtitle: 'Top 100 Worldwide Courses',
      region: 'global',
      color: '#DAA520', // Rustic goldenrod for worldwide
      colorLight: '#F5DEB3', // Wheat for remaining
      gradient: 'from-yellow-600 to-yellow-700'
    },
    {
      id: 'stars-stripes',
      title: 'USA',
      subtitle: 'Top 100 USA Courses',
      region: 'usa',
      color: '#B22222', // Rustic fire brick red for USA
      colorLight: '#F5C6C6', // Light rustic red for remaining
      gradient: 'from-red-600 to-red-800'
    },
    {
      id: 'links-legend',
      title: 'Great Britain & Ireland',
      subtitle: 'Top 100 Great Britain & Ireland Courses',
      region: 'britain-ireland',
      color: '#228B22', // Masters Augusta forest green for Britain & Ireland
      colorLight: '#D4E5D4', // Light forest green for remaining
      gradient: 'from-green-600 to-green-800'
    },
    {
      id: 'continental-swinger',
      title: 'Continental Europe',
      subtitle: 'Top 100 Continental Europe Courses',
      region: 'europe',
      color: '#4682B4', // Rustic steel blue for Continental Europe
      colorLight: '#E1EBEF', // Light steel blue for remaining
      gradient: 'from-blue-600 to-blue-800'
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
        <div className="relative py-8">
          {/* Desktop: Single row */}
          <div className="hidden md:flex gap-16 justify-center">
            {achievementRings.map((achievement, index) => {
              const progress = getProgressData(achievement.region);
              const animationDelay = index * 0.2;
              const completedAngle = (progress.percentage / 100) * 283; // 283 is circumference for strokeDasharray
              const remainingAngle = 283 - completedAngle;
              
              return (
                <div key={achievement.id} className="flex flex-col items-center cursor-pointer group">
                  <div className="w-44 h-44 relative transition-all duration-300 group-hover:scale-105">
                    {/* Progress Ring with Full Circle */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Gradient Definitions */}
                      <defs>
                        <linearGradient id={`gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={achievement.color} stopOpacity="0.9" />
                          <stop offset="100%" stopColor={achievement.color} stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id={`bg-gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={achievement.color} stopOpacity="0.08" />
                          <stop offset="100%" stopColor={achievement.color} stopOpacity="0.04" />
                        </linearGradient>
                      </defs>
                      
                      
                      {/* Remaining portion (full ring) */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke={achievement.colorLight}
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      
                      {/* Completed portion with animated sweep */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke={achievement.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="283"
                        strokeDashoffset={283 - completedAngle}
                        className="transition-all duration-1000 ease-out"
                        style={{
                          filter: `drop-shadow(0 0 15px ${achievement.color}50)`,
                          animationDelay: `${animationDelay}s`
                        }}
                      />
                    </svg>
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      {achievement.region === 'usa' ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* USA Map Background */}
                          <img
                            src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                            alt="USA map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl font-bold text-foreground leading-none">
                              <span className="font-bold">{progress.played}</span>
                              <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">
                              Courses
                            </div>
                          </div>
                        </div>
                      ) : achievement.region === 'europe' ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* Continental Europe Map Background */}
                          <img
                            src={continentalEuropeMap}
                            alt="Continental Europe map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl font-bold text-foreground leading-none">
                              <span className="font-bold">{progress.played}</span>
                              <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">
                              Courses
                            </div>
                          </div>
                        </div>
                      ) : achievement.region === 'britain-ireland' ? (
                        <div className="relative w-44 h-44 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* UK & Ireland Map Background */}
                          <img
                            src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                            alt="UK & Ireland map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl font-bold text-foreground leading-none">
                              <span className="font-bold">{progress.played}</span>
                              <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">
                              Courses
                            </div>
                          </div>
                        </div>
                      ) : achievement.region === 'global' ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                          {/* World Map Background */}
                          <img
                            src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                            alt="World map background"
                            className="absolute inset-0 w-full h-full object-contain opacity-20"
                          />
                          {/* Overlay content */}
                          <div className="relative z-10 text-center">
                            <div className="text-2xl font-bold text-foreground leading-none">
                              <span className="font-bold">{progress.played}</span>
                              <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">
                              Courses
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-foreground leading-none">
                            <span className="font-bold">{progress.played}</span>
                            <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-1">
                            Courses
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Achievement info below ring - single line */}
                  <div className="mt-4 text-center min-w-[180px]">
                    <div className="text-sm font-semibold text-foreground mb-2 whitespace-nowrap">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
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
            <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-4 px-4"
                 style={{
                   scrollbarWidth: 'none',
                   msOverflowStyle: 'none',
                   WebkitOverflowScrolling: 'touch',
                   scrollSnapType: 'x mandatory'
                 }}>
              {achievementRings.map((achievement, index) => {
                const progress = getProgressData(achievement.region);
                const isLast = index === achievementRings.length - 1;
                const animationDelay = index * 0.15;
                const completedAngle = (progress.percentage / 100) * 283;
                
                return (
                  <div 
                    key={achievement.id} 
                    className={`flex-shrink-0 flex flex-col items-center cursor-pointer ${isLast ? 'pr-4' : ''}`}
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="w-36 h-36 relative transition-all duration-300">
                      {/* Progress Ring with Full Circle */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        {/* Gradient Definitions */}
                        <defs>
                          <linearGradient id={`mobile-gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={achievement.color} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={achievement.color} stopOpacity="0.7" />
                          </linearGradient>
                          <linearGradient id={`mobile-bg-gradient-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={achievement.color} stopOpacity="0.08" />
                            <stop offset="100%" stopColor={achievement.color} stopOpacity="0.04" />
                          </linearGradient>
                        </defs>
                        
                        
                        {/* Remaining portion (full ring) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="45"
                          fill="none"
                          stroke={achievement.colorLight}
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        
                        {/* Completed portion with animated sweep */}
                        <circle
                          cx="60"
                          cy="60"
                          r="45"
                          fill="none"
                          stroke={achievement.color}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="283"
                          strokeDashoffset={283 - completedAngle}
                          className="transition-all duration-1000 ease-out"
                          style={{
                            filter: `drop-shadow(0 0 10px ${achievement.color}50)`,
                            animationDelay: `${animationDelay}s`
                          }}
                        />
                      </svg>
                      
                      {/* Center content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        {achievement.region === 'usa' ? (
                          <div className="relative w-28 h-28 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* USA Map Background */}
                            <img
                              src="/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png"
                              alt="USA map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-lg font-bold text-foreground leading-none">
                                <span className="font-bold">{progress.played}</span>
                                <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-medium mt-1">
                                Courses
                              </div>
                            </div>
                          </div>
                        ) : achievement.region === 'europe' ? (
                          <div className="relative w-32 h-32 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* Continental Europe Map Background */}
                            <img
                              src={continentalEuropeMap}
                              alt="Continental Europe map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-lg font-bold text-foreground leading-none">
                                <span className="font-bold">{progress.played}</span>
                                <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-medium mt-1">
                                Courses
                              </div>
                            </div>
                          </div>
                        ) : achievement.region === 'britain-ireland' ? (
                          <div className="relative w-40 h-40 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* UK & Ireland Map Background */}
                            <img
                              src="/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png"
                              alt="UK & Ireland map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-lg font-bold text-foreground leading-none">
                                <span className="font-bold">{progress.played}</span>
                                <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-medium mt-1">
                                Courses
                              </div>
                            </div>
                          </div>
                        ) : achievement.region === 'global' ? (
                          <div className="relative w-28 h-28 rounded-full overflow-hidden flex flex-col items-center justify-center">
                            {/* World Map Background */}
                            <img
                              src="/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png"
                              alt="World map background"
                              className="absolute inset-0 w-full h-full object-contain opacity-20"
                            />
                            {/* Overlay content */}
                            <div className="relative z-10 text-center">
                              <div className="text-lg font-bold text-foreground leading-none">
                                <span className="font-bold">{progress.played}</span>
                                <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                              </div>
                              <div className="text-xs text-muted-foreground font-medium mt-1">
                                Courses
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-lg font-bold text-foreground leading-none">
                              <span className="font-bold">{progress.played}</span>
                              <span className="font-normal text-muted-foreground"> / {progress.total}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">
                              Courses
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Achievement info below ring - single line */}
                    <div className="mt-3 text-center w-36">
                      <div className="text-xs font-semibold text-foreground mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
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