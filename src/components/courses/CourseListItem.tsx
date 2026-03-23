import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from './CourseRankBadges';
import { extractRanksFromMemberships } from '@/utils/rankingUtils';

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
      className="relative h-24 rounded-sq-sm overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg"
      onClick={handleClick}
    >
      {/* Full background image with lazy loading */}
      <img
        src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
        alt={`Background image for ${course.name}`}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center p-4 z-10">
        <div className="flex-1 text-white">
          <h3 className="font-semibold text-2xl leading-tight mb-1">
            {course.name}
          </h3>
          <div className="flex items-center text-lg text-white/90">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{formatLocation(course)}</span>
          </div>
        </div>
      </div>

      {/* Top right badges */}
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
  );
};

export default CourseListItem;