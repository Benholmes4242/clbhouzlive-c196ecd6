import React from 'react';
import { Star, MapPin, Trophy, Users } from 'lucide-react';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number | null;
  className?: string;
  onClick?: () => void;
  size?: 'large' | 'medium';
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  className = "",
  onClick,
  size = 'medium'
}) => {
  const getRankBadges = () => {
    const badges = [];
    
    if (course.global_rank && course.global_rank <= 100) {
      badges.push({
        type: 'global',
        rank: course.global_rank,
        icon: Trophy,
        label: 'Global'
      });
    }
    
    if (course.regional_rank && course.regional_rank <= 100) {
      badges.push({
        type: 'regional',
        rank: course.regional_rank,
        icon: MapPin,
        label: 'Regional'
      });
    }
    
    // Mock community rank for demo
    if (course.community_rank) {
      badges.push({
        type: 'community',
        rank: course.community_rank,
        icon: Users,
        label: 'Community'
      });
    }
    
    return badges;
  };

  const rankBadges = getRankBadges();
  const cornerRadius = size === 'large' ? 'rounded-2xl' : 'rounded-xl';
  const shadowClass = size === 'large' 
    ? 'shadow-lg shadow-black/20' 
    : 'shadow-md shadow-black/15';

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      {/* Main card container with 2:1 aspect ratio */}
      <div className={`relative w-full aspect-[2/1] ${cornerRadius} overflow-hidden bg-muted ${shadowClass}`}>
        {/* Course image */}
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt={course.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        {/* Bottom content area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
          <div className="flex justify-between items-end">
            {/* Left side - Course info and badges */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 leading-tight">
                {course.name}
              </h3>
              
              {/* Ranking badges */}
              {rankBadges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {rankBadges.map((badge, index) => {
                    const IconComponent = badge.icon;
                    return (
                      <div 
                        key={`${badge.type}-${index}`}
                        className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className="text-xs font-medium">#{badge.rank}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* XP earned */}
              <div className="bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-lg inline-block">
                <span className="text-xs font-semibold">+250 XP</span>
              </div>
            </div>
            
            {/* Right side - User rating */}
            {userRating && (
              <div className="ml-2 text-right">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm md:text-base font-bold">{userRating}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetflixCourseCard;