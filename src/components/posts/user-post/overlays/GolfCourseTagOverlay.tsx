import React from 'react';
import { MapPin } from 'lucide-react';
import CoursePostBadge from '../../CoursePostBadge';
import { GolfCourse } from '../types';

interface GolfCourseTagOverlayProps {
  golfCourse: GolfCourse | null;
  isMobile: boolean;
  showFullTag: boolean;
  onTagClick: (e: React.MouseEvent) => void;
}

export const GolfCourseTagOverlay: React.FC<GolfCourseTagOverlayProps> = ({
  golfCourse,
  isMobile,
  showFullTag,
  onTagClick
}) => {
  if (!golfCourse) return null;

  return (
    <>
      {/* Desktop: Show full tag in top-right */}
      {!isMobile ? (
        <div className="absolute top-6 right-3 z-20">
          <CoursePostBadge 
            course={{
              id: golfCourse.id,
              name: golfCourse.name,
              country: golfCourse.country,
              region: golfCourse.region
            }}
            className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
          />
        </div>
      ) : null}
    </>
  );
};