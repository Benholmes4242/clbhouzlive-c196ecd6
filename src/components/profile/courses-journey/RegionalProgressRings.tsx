import React from 'react';
import type { AchievementRing, ProgressData } from './types';

interface RegionalProgressRingsProps {
  regionProgress: Record<string, { played: number; total: number }>;
  isLoading: boolean;
}

// Achievement rings configuration
export const achievementRings: AchievementRing[] = [
  {
    id: 'legends-club',
    title: 'Worldwide',
    subtitle: 'Top 100 Worldwide Courses',
    region: 'global',
    color: '#DAA520',
    colorLight: '#F5DEB3',
    gradient: 'from-yellow-600 to-yellow-700'
  },
  {
    id: 'stars-stripes',
    title: 'USA',
    subtitle: 'Top 100 USA Courses',
    region: 'usa',
    color: '#B22222',
    colorLight: '#F5C6C6',
    gradient: 'from-red-600 to-red-800'
  },
  {
    id: 'links-legend',
    title: 'Great Britain & Ireland',
    subtitle: 'Top 100 Great Britain & Ireland Courses',
    region: 'britain-ireland',
    color: '#228B22',
    colorLight: '#D4E5D4',
    gradient: 'from-green-600 to-green-800'
  },
  {
    id: 'continental-swinger',
    title: 'Continental Europe',
    subtitle: 'Top 100 Continental Europe Courses',
    region: 'europe',
    color: '#4682B4',
    colorLight: '#E1EBEF',
    gradient: 'from-blue-600 to-blue-800'
  }
];

const getProgressData = (
  regionProgress: Record<string, { played: number; total: number }>,
  region: string
): ProgressData => {
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

// Map backgrounds for each region
const regionMapImages: Record<string, { src: string; alt: string }> = {
  usa: { src: '/lovable-uploads/6152bbaa-1d05-4eab-bbde-08d43b96a693.png', alt: 'USA map background' },
  europe: { src: '/lovable-uploads/793041de-0d8b-4c78-8256-3447ad57dc44.png', alt: 'Continental Europe map background' },
  'britain-ireland': { src: '/lovable-uploads/dc0f671b-b75f-4121-8ebd-18dd7f9b67c3.png', alt: 'UK & Ireland map background' },
  global: { src: '/lovable-uploads/c0ba76eb-90e6-404b-8df7-f9f34a43b606.png', alt: 'World map background' }
};

interface ProgressRingCenterProps {
  region: string;
  progress: ProgressData;
  size: 'mobile' | 'desktop';
}

const ProgressRingCenter: React.FC<ProgressRingCenterProps> = ({ region, progress, size }) => {
  const mapImage = regionMapImages[region];
  const containerSize = size === 'mobile' 
    ? (region === 'britain-ireland' ? 'w-24 h-24' : 'w-20 h-20')
    : (region === 'britain-ireland' ? 'w-44 h-44' : 'w-36 h-36');
  const textSize = size === 'mobile' ? 'text-lg' : 'text-3xl';
  const xpSize = size === 'mobile' ? 'text-xs mt-0.5' : 'text-2xl mt-1';
  const opacity = size === 'mobile' ? 'opacity-25' : 'opacity-20';

  if (mapImage) {
    return (
      <div className={`relative ${containerSize} rounded-full overflow-hidden flex flex-col items-center justify-center`}>
        <img
          src={mapImage.src}
          alt={mapImage.alt}
          className={`absolute inset-0 w-full h-full object-contain ${opacity}`}
        />
        <div className="relative z-10 text-center">
          <div className={`${textSize} text-black leading-none`}>
            <span>{progress.played}</span>
            <span className="text-black/60"> / {progress.total}</span>
          </div>
          <div className={`${xpSize} text-black`}>
            {progress.played * 120} XP
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${textSize} text-black leading-none`}>
        <span>{progress.played}</span>
        <span className="text-black/60"> / {progress.total}</span>
      </div>
      <div className={`${xpSize} text-black`}>
        {progress.played * 120} XP
      </div>
    </>
  );
};

const RegionalProgressRings: React.FC<RegionalProgressRingsProps> = ({
  regionProgress,
  isLoading
}) => {
  return (
    <div className="relative">
      {/* Desktop: Single row */}
      <div className="hidden md:flex gap-8 justify-center px-4">
        {achievementRings.map((achievement, index) => {
          const progress = getProgressData(regionProgress, achievement.region);
          const animationDelay = index * 0.2;
          const completedAngle = (progress.percentage / 100) * 283;
          
          return (
            <div key={achievement.id} className="flex flex-col items-center cursor-pointer group">
              <div className="w-52 h-52 relative transition-all duration-300">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
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
                  
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke={achievement.color}
                    strokeWidth="6"
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
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <ProgressRingCenter region={achievement.region} progress={progress} size="desktop" />
                </div>
              </div>
              
              <div className="mt-0.5 text-center max-w-[200px]">
                <div className="text-xl text-foreground">
                  {achievement.title === 'Great Britain & Ireland' ? (
                    <>
                      <div>Great Britain</div>
                      <div>& Ireland</div>
                    </>
                  ) : (
                    achievement.title
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Grid layout - single row */}
      <div className="md:hidden">
        <div className="grid grid-cols-4 gap-0.5 px-2">
          {achievementRings.map((achievement, index) => {
            const progress = getProgressData(regionProgress, achievement.region);
            const animationDelay = index * 0.15;
            const completedAngle = (progress.percentage / 100) * 283;
            
            return (
              <div 
                key={achievement.id} 
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="w-28 h-28 relative transition-all duration-300">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
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
                    
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke={achievement.color}
                      strokeWidth="6"
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
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <ProgressRingCenter region={achievement.region} progress={progress} size="mobile" />
                  </div>
                </div>
                
                <div className="mt-0.5 text-center max-w-[80px]">
                  <div className="text-xs text-foreground leading-tight">
                    {achievement.title === 'Great Britain & Ireland' ? (
                      <>
                        <div>Great Britain</div>
                        <div>& Ireland</div>
                      </>
                    ) : achievement.title === 'Continental Europe' ? (
                      <>
                        <div>Continental</div>
                        <div>Europe</div>
                      </>
                    ) : (
                      achievement.title
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RegionalProgressRings);
