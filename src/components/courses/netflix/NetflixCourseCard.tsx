import React from 'react';
import { Star, MapPin, Trophy, Users } from 'lucide-react';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number | null;
  className?: string;
  onClick?: () => void;
  size?: 'large' | 'medium';
  isHeroBanner?: boolean;
  isHighlightReel?: boolean;
  isTopRated?: boolean;
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  className = "",
  onClick,
  size = 'medium',
  isHeroBanner = false,
  isHighlightReel = false,
  isTopRated = false
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
  const cornerRadius = size === 'large' ? 'rounded-none' : 'rounded-none';
  const shadowClass = size === 'large' 
    ? 'shadow-lg shadow-black/20' 
    : 'shadow-md shadow-black/15';
  
  // Text sizing - larger for Row 1 (Recently Played), smaller for region cards on mobile
  const isRegionCard = ['Great Britain & Ireland', 'Europe', 'USA', 'Worldwide'].some(region => 
    course.region === region || course.name?.includes(region)
  );
  
  const textSizing = size === 'large' ? {
    title: 'text-base md:text-lg font-bold',
    badge: 'text-xs',
    rating: 'text-base md:text-lg font-bold',
    xp: 'text-xs font-semibold'
  } : isRegionCard ? {
    // Smaller text for region cards on mobile to match Recently Played scale
    title: 'text-xs sm:text-sm md:text-base font-bold', 
    badge: 'text-xs',
    rating: 'text-xs sm:text-sm md:text-base font-bold',
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
        className={`relative group cursor-pointer hover:scale-[1.005] transition-all duration-500 ease-out ${className}`}
        onClick={onClick}
      >
        <div className="relative w-full aspect-[16/9] md:aspect-[2.5/1] lg:aspect-[3/1] rounded-none overflow-hidden bg-muted shadow-2xl shadow-black/40">
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
              <span className="text-muted-foreground text-lg">No image</span>
            </div>
          )}
          
          {/* Enhanced cinematic gradient for hero banner */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 80%, transparent 100%)'
            }}
          />
          
          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12 text-white">
            <div className="max-w-4xl">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 leading-tight drop-shadow-2xl">
                {course.name}
              </h1>
              <p className="text-lg md:text-2xl lg:text-3xl italic opacity-95 leading-relaxed drop-shadow-lg font-light">
                "{course.description || course.tagline || course.heritage || "An exceptional golfing experience"}"
              </p>
              {userRating && (
                <div className="mt-6 flex items-center gap-3">
                  <Star className="w-7 h-7 md:w-8 md:h-8 fill-yellow-400 text-yellow-400 drop-shadow" />
                  <span className="text-2xl md:text-3xl font-bold drop-shadow-lg">{userRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine aspect ratio based on card size and context
  const getAspectRatio = () => {
    if (isTopRated) {
      // Top 10 Rated: Use fixed card dimensions (landscape)
      return 'card-rated';
    } else if (isHighlightReel) {
      // Highlight Reel: Slightly shorter than Recently Played (portrait-ish)
      return 'aspect-[4/5]';
    } else if (size === 'large') {
      // Recently Played and regional: 3:4 portrait
      return 'aspect-[3/4]';
    } else {
      // Default medium cards: landscape
      return 'aspect-[2/1]';
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer hover:scale-[1.02] ${className} [--badge-w:72px] md:[--badge-w:76px] lg:[--badge-w:76px]`}
      onClick={onClick}
    >
      {/* Main card container with responsive aspect ratio */}
      <div className={`relative ${isTopRated ? 'card-base card-rated' : `w-full ${getAspectRatio()}`} ${cornerRadius} overflow-hidden bg-muted ${shadowClass}`}>
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
                         className="glass-badge-tight shadow-lg"
                       >
                         <IconComponent className="w-3 h-3" />
                         <span className="font-medium text-white">{badge.label}</span>
                       </div>
                    );
                  })}
                </div>
              )}
              
               {/* XP earned */}
               <div className="glass-badge-tight shadow-lg bg-[rgba(247,147,30,0.9)]">
                 <span className="text-white drop-shadow font-semibold">+250 XP</span>
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