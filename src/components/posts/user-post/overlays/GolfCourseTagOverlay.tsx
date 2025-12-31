import React from 'react';
import { MapPin } from 'lucide-react';
import CoursePostBadge from '../../CoursePostBadge';
import { GolfCourse } from '../types';

interface GolfCourseTagOverlayProps {
  golfCourse: GolfCourse | null;
  /** Raw course ID for safety net - show badge even if name lookup failed */
  rawCourseId?: string | null;
  isMobile: boolean;
  showFullTag: boolean;
  onTagClick: (e: React.MouseEvent) => void;
}

export const GolfCourseTagOverlay: React.FC<GolfCourseTagOverlayProps> = ({
  golfCourse,
  rawCourseId,
  isMobile,
  showFullTag,
  onTagClick
}) => {
  // Safety net: show badge if we have course data OR if we have a raw course ID
  const shouldShow = golfCourse || rawCourseId;
  if (!shouldShow) return null;

  // Use course data if available, otherwise create minimal fallback from rawCourseId
  const courseData = golfCourse || (rawCourseId ? {
    id: rawCourseId,
    name: 'Golf Course', // Fallback name when lookup fails
    country: '',
    region: ''
  } : null);

  if (!courseData) return null;

  return (
    <>
      {/* Desktop: Show full tag in top-right */}
      {!isMobile ? (
        <div className="absolute top-32 right-6 z-20">
          <CoursePostBadge 
            course={{
              id: courseData.id,
              name: courseData.name,
              country: courseData.country,
              region: courseData.region
            }}
            className="bg-black/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium px-3 py-1.5"
          />
        </div>
      ) : null}
    </>
  );
};