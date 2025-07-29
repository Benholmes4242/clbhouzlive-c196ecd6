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
      className="relative h-24 rounded-lg overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg"
      onClick={handleClick}
    >
      {/* Full background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'})`
        }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center p-4 z-10">
        <div className="flex-1 text-white">
          <h3 className="font-semibold text-lg leading-tight mb-1">
            {course.name}
          </h3>
          <div className="flex items-center text-sm text-white/90">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{formatLocation(course)}</span>
          </div>
        </div>
      </div>

      {/* Top right badges - regional rank and user rating on same row */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
        {/* Regional ranking badge only - using original styling */}
        <CourseRankBadges
          globalRank={null}
          regionalRank={course.regional_rank}
          usaRank={null}
          country={course.country}
          viewContext={viewContext}
          userRating={null}
          showUserRating={false}
          positioning="top-left"
        />

        {/* User Rating Display */}
        {userRating && showUserRating && (
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-white">{userRating}/10</span>
          </div>
        )}
      </div>

      {/* Other ranking badges in original position */}
      <div className="absolute top-2 left-2 z-20">
        <CourseRankBadges
          globalRank={course.global_rank}
          regionalRank={null}
          usaRank={course.usa_rank}
          country={course.country}
          viewContext={viewContext}
          userRating={null}
          showUserRating={false}
          positioning="top-left"
        />
      </div>
    </div>
  );
};

export default CourseListItem;