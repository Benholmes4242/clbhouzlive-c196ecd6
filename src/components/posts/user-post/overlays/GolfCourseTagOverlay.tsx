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
    <div className={`${isMobile ? 'relative mb-3' : 'absolute top-6 right-3'} z-20`}>
      {/* Mobile: Show map pin icon only, expand on click */}
      {isMobile ? (
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTagClick(e);
            }}
            className="w-8 h-8 rounded-full bg-secondary/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 border border-border/20"
          >
            <MapPin className="w-4 h-4 text-foreground" />
          </button>
          
          {/* Full course tag that appears on click */}
          {showFullTag && (
            <div className="absolute top-0 right-0 animate-scale-in">
              <CoursePostBadge 
                course={{
                  id: golfCourse.id,
                  name: golfCourse.name,
                  country: golfCourse.country,
                  region: golfCourse.region
                }}
                className="bg-secondary text-secondary-foreground text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap border"
              />
            </div>
          )}
        </div>
      ) : (
        /* Desktop: Show full tag as before */
        <CoursePostBadge 
          course={{
            id: golfCourse.id,
            name: golfCourse.name,
            country: golfCourse.country,
            region: golfCourse.region
          }}
          className="bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm"
        />
      )}
    </div>
  );
};