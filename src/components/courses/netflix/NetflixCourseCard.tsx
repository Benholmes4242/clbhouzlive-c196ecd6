import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number | null;
  targetUserId?: string;
  isOwnProfile: boolean;
  size?: 'large' | 'medium';
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  targetUserId,
  isOwnProfile,
  size = 'medium'
}) => {
  const navigate = useNavigate();

  if (!course) return null;

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  // Get ranking information for badges
  const getRankingInfo = () => {
    const badges = [];
    
    // Worldwide ranking
    if (course.global_rank) {
      badges.push({ type: 'worldwide', rank: course.global_rank, label: 'WORLD' });
    }
    
    // Regional ranking
    if (course.country === 'Britain & Ireland' && course.regional_rank) {
      badges.push({ type: 'regional', rank: course.regional_rank, label: 'GB&I' });
    } else if (course.country === 'Continental Europe' && course.regional_rank) {
      badges.push({ type: 'regional', rank: course.regional_rank, label: 'EUR' });
    } else if (course.country === 'USA' && course.regional_rank) {
      badges.push({ type: 'regional', rank: course.regional_rank, label: 'USA' });
    }
    
    // Clbhouz community rank (placeholder for now)
    badges.push({ type: 'community', rank: Math.floor(Math.random() * 500) + 1, label: 'CLB' });
    
    return badges;
  };

  const rankingBadges = getRankingInfo();

  // Calculate XP earned (placeholder logic)
  const xpEarned = course.global_rank ? Math.max(50, 500 - (course.global_rank * 4)) : 250;

  // Get responsive sizing classes based on card size
  const getSizingClasses = () => {
    if (size === 'large') {
      return {
        container: 'w-[82vw] sm:w-[44%] md:w-[31%] lg:w-[30%]',
        height: 'h-[41vw] sm:h-[22%] md:h-[15.5%] lg:h-[15%]', // 2:1 aspect ratio
        radius: 'rounded-2xl', // 16px
        shadow: 'shadow-xl'
      };
    } else {
      return {
        container: 'w-[76vw] sm:w-[40%] md:w-[28%] lg:w-[27%]',
        height: 'h-[38vw] sm:h-[20%] md:h-[14%] lg:w-[13.5%]', // 2:1 aspect ratio
        radius: 'rounded-xl', // 14px  
        shadow: 'shadow-lg'
      };
    }
  };

  const sizingClasses = getSizingClasses();

  return (
    <button
      onClick={handleClick}
      className={`relative ${sizingClasses.container} aspect-[2/1] ${sizingClasses.radius} overflow-hidden group hover:scale-105 transition-all duration-300 hover:z-10 ${sizingClasses.shadow}`}
    >
      {/* Course Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: course.thumbnail_image 
            ? `url(${course.thumbnail_image})`
            : "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
        }}
      />
      
      {/* Subtle gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Top section - empty for clean look */}
        <div />
        
        {/* Bottom section - Course info */}
        <div className="flex justify-between items-end">
          {/* Left side - Course name and badges */}
          <div className="flex flex-col items-start space-y-2 flex-1 mr-2">
            {/* Course name */}
            <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 text-left max-w-full">
              {course.name}
            </h3>
            
            {/* Ranking badges row */}
            <div className="flex flex-wrap items-center gap-1">
              {rankingBadges.map((badge, index) => (
                <div
                  key={index}
                  className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
                >
                  <span className="text-white text-xs font-medium">
                    {badge.label} {badge.rank}
                  </span>
                </div>
              ))}
              
              {/* XP Badge */}
              <div className="px-2 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
                <span className="text-primary text-xs font-medium">
                  +{xpEarned} XP
                </span>
              </div>
            </div>
          </div>
          
          {/* Right side - User rating */}
          {userRating && (
            <div className="text-white font-bold text-lg flex-shrink-0">
              {userRating}/10
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default NetflixCourseCard;