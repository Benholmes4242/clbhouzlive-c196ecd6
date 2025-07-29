import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from './CourseRankBadges';

interface CourseListItemProps {
  course: any;
  viewingUserId?: string;
  viewContext: 'global' | 'regional' | 'usa' | 'europe';
  userRating?: number | null;
  isReadOnly?: boolean;
  showUserRating?: boolean;
  isFromUserCoursesPage?: boolean;
}

// Helper function to format location display
const formatLocation = (course: any) => {
  const parts = [];
  
  if (course.country) parts.push(course.country);
  if (course.region && course.region !== course.country) {
    parts.push(course.region);
  }
  
  return parts.join(', ');
};

const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  viewingUserId,
  viewContext,
  userRating,
  isReadOnly = false,
  showUserRating = false,
  isFromUserCoursesPage = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <div
      className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
      onClick={handleClick}
    >
      {/* Course Image */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
          alt={course.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Rank Badge */}
        <div className="absolute top-1 left-1">
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
            viewContext={viewContext}
            userRating={userRating}
            showUserRating={showUserRating}
            positioning="top-left"
          />
        </div>
      </div>

      {/* Course Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1 group-hover:text-white/90">
          {course.name}
        </h3>
        
        <div className="flex items-center text-xs text-white/70 mb-2">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{formatLocation(course)}</span>
        </div>

        {course.description && (
          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      {/* User Rating Display */}
      {userRating && showUserRating && (
        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="h-3 w-3 text-yellow-400 fill-current" />
          <span className="text-xs font-medium text-white">{userRating}/10</span>
        </div>
      )}
    </div>
  );
};

export default CourseListItem;