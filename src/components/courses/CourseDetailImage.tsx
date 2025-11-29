
import React from 'react';
import Top100Pills from './Top100Pills';
import { useCourseTop100Memberships } from '@/hooks/useCourseTop100Memberships';

interface CourseDetailImageProps {
  courseId: string;
  thumbnailImage?: string;
  courseName: string;
  showUserRating?: boolean;
  userRating?: number | null;
}

const CourseDetailImage: React.FC<CourseDetailImageProps> = ({
  courseId,
  thumbnailImage,
  courseName,
  showUserRating = false,
  userRating
}) => {
  // Fetch Top 100 memberships for unified badge display
  const { data: top100Memberships = [] } = useCourseTop100Memberships(courseId);

  return (
    <div className="relative h-[236px] rounded-lg overflow-hidden">
      <img
        src={thumbnailImage || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop'}
        alt={courseName}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop';
        }}
      />
      
      {/* Unified Top 100 ranking badges */}
      {top100Memberships.length > 0 && (
        <div className="absolute top-3 left-3">
          <Top100Pills 
            memberships={top100Memberships} 
            variant="overlay" 
            size="sm" 
          />
        </div>
      )}
      
      {/* User rating badge */}
      {showUserRating && userRating && (
        <div className="absolute top-3 right-3">
          <div className="bg-white/16 backdrop-blur-[18px] border border-white/45 text-white shadow-[0_0_12px_rgba(0,0,0,0.35)] text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
            Your: {userRating}/10
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailImage;
