import React from 'react';
import { Star, MapPin } from 'lucide-react';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number | null;
  className?: string;
  onClick?: () => void;
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  className = "",
  onClick
}) => {
  const getRankDisplay = () => {
    if (course.regional_rank && course.regional_rank <= 100) {
      return `#${course.regional_rank}`;
    }
    if (course.global_rank && course.global_rank <= 100) {
      return `#${course.global_rank}`;
    }
    return null;
  };

  const rankDisplay = getRankDisplay();

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
    >
      {/* Main card container with 2:1 aspect ratio */}
      <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-muted">
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
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Rank badge */}
        {rankDisplay && (
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
            {rankDisplay}
          </div>
        )}
        
        {/* User rating badge */}
        {userRating && (
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {userRating}
          </div>
        )}
        
        {/* Course info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-2 group-hover:text-primary-foreground transition-colors">
            {course.name}
          </h3>
          
          <div className="flex items-center gap-2 text-xs opacity-90">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">
              {course.country}{course.region && course.region !== course.country ? `, ${course.region}` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetflixCourseCard;