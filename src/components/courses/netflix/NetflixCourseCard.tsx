import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number | null;
  targetUserId?: string;
  isOwnProfile: boolean;
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  targetUserId,
  isOwnProfile
}) => {
  const navigate = useNavigate();

  if (!course) return null;

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  // Get regional ranking and abbreviation
  const getRegionalInfo = () => {
    if (course.country === 'Britain & Ireland' && course.regional_rank) {
      return { rank: course.regional_rank, abbrev: 'GB&I' };
    }
    if (course.country === 'Continental Europe' && course.regional_rank) {
      return { rank: course.regional_rank, abbrev: 'EUR' };
    }
    if (course.country === 'USA' && course.regional_rank) {
      return { rank: course.regional_rank, abbrev: 'USA' };
    }
    if (course.global_rank) {
      return { rank: course.global_rank, abbrev: 'WORLD' };
    }
    return null;
  };

  const regionalInfo = getRegionalInfo();

  return (
    <button
      onClick={handleClick}
      className="relative w-full h-48 rounded-lg overflow-hidden group hover:scale-105 transition-all duration-300 hover:z-10"
    >
      {/* Course Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: course.thumbnail_image 
            ? `url(${course.thumbnail_image})`
            : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}
      />
      
      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Top section - empty for now */}
        <div />
        
        {/* Bottom section - Course info */}
        <div className="flex justify-between items-end">
          {/* Left side - Course name and regional badge */}
          <div className="flex flex-col items-start space-y-2">
            <h3 className="text-white font-bold text-sm text-left line-clamp-2 leading-tight">
              {course.name}
            </h3>
            
            {/* Regional ranking badge with liquid glass effect */}
            {regionalInfo && (
              <div className="flex items-center space-x-1">
                <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                  <span className="text-white text-xs font-medium">
                    {regionalInfo.abbrev} {regionalInfo.rank}
                  </span>
                </div>
                <div className="px-2 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
                  <span className="text-primary text-xs font-medium">
                    +250 XP
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right side - User rating */}
          {userRating && (
            <div className="text-white font-bold text-lg">
              {userRating}/10
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default NetflixCourseCard;