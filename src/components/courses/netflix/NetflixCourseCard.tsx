import React from 'react';
import { Star, MapPin, Trophy, Users } from 'lucide-react';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number | null;
  className?: string;
  onClick?: () => void;
  size?: 'large' | 'medium';
  isHeroBanner?: boolean;
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  className = "",
  onClick,
  size = 'medium',
  isHeroBanner = false
}) => {
  const getRankBadges = () => {
    const badges = [];
    
    // Regional rank with abbreviation
    if (course.regional_rank && course.regional_rank <= 100) {
      let regionAbbrev = 'GLOBAL';
      
      // Map country/region to abbreviation
      if (course.country) {
        if (['United Kingdom', 'Ireland', 'Scotland', 'England', 'Wales', 'Northern Ireland'].includes(course.country)) {
          regionAbbrev = 'GB&I';
        } else if (['Germany', 'France', 'Spain', 'Italy', 'Portugal', 'Netherlands', 'Sweden', 'Denmark', 'Norway', 'Belgium', 'Austria', 'Switzerland'].includes(course.country)) {
          regionAbbrev = 'EUR';
        } else if (['United States', 'USA'].includes(course.country)) {
          regionAbbrev = 'USA';
        } else {
          regionAbbrev = 'WORLD';
        }
      }
      
      badges.push({
        type: 'regional',
        rank: course.regional_rank,
        icon: MapPin,
        label: `${regionAbbrev} ${course.regional_rank}`
      });
    }
    
    // Global rank (only if no regional rank or if it's different)
    if (course.global_rank && course.global_rank <= 100 && !course.regional_rank) {
      badges.push({
        type: 'global',
        rank: course.global_rank,
        icon: Trophy,
        label: `GLOBAL ${course.global_rank}`
      });
    }
    
    return badges;
  };

  const rankBadges = getRankBadges();
  const cornerRadius = size === 'large' ? 'rounded-2xl' : 'rounded-xl';
  const shadowClass = size === 'large' 
    ? 'shadow-lg shadow-black/20' 
    : 'shadow-md shadow-black/15';
  
  // Text sizing - larger for Row 1 (Recently Played)
  const textSizing = size === 'large' ? {
    title: 'text-base md:text-lg font-bold',
    badge: 'text-xs',
    rating: 'text-base md:text-lg font-bold',
    xp: 'text-xs font-semibold'
  } : {
    title: 'text-sm md:text-base font-bold', 
    badge: 'text-xs',
    rating: 'text-sm md:text-base font-bold',
    xp: 'text-xs font-semibold'
  };

  // Hero banner gets special treatment
  if (isHeroBanner) {
    return (
      <div 
        className={`relative group cursor-pointer hover:scale-[1.01] ${className}`}
        onClick={onClick}
      >
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-muted shadow-xl shadow-black/30">
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
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          
          {/* Enhanced gradient for hero banner */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 leading-tight">
              {course.name}
            </h2>
            <p className="text-lg md:text-xl italic opacity-90 leading-relaxed">
              "{course.description || course.tagline || "An exceptional golfing experience"}"
            </p>
            {userRating && (
              <div className="mt-4 flex items-center gap-2">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold">{userRating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group cursor-pointer hover:scale-[1.02] ${className}`}
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
        
        {/* Enhanced gradient overlay for better text readability - 55% opacity over lower 40% */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" 
             style={{
               background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)'
             }} />
        
        {/* Bottom content area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
          <div className="flex justify-between items-end">
            {/* Left side - Course info and badges */}
            <div className="flex-1 min-w-0">
              <h3 className={`${textSizing.title} mb-2 line-clamp-2 leading-tight drop-shadow-lg`}>
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
                        className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20 shadow-lg"
                        style={{
                          background: 'rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className={`${textSizing.badge} font-medium`}>{badge.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* XP earned */}
              <div 
                className="bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-lg inline-block border border-white/20 shadow-lg"
                style={{
                  background: 'rgba(var(--primary), 0.8)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <span className={`${textSizing.xp} text-white drop-shadow`}>+250 XP</span>
              </div>
            </div>
            
            {/* Right side - User rating */}
            {userRating && (
              <div className="ml-2 text-right">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow" />
                  <span className={`${textSizing.rating} drop-shadow-lg`}>{userRating}</span>
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