import React from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface ClubTagPillProps {
  course: GolfCourse;
  className?: string;
}

const ClubTagPill = ({ course, className }: ClubTagPillProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/courses/${course.id}`);
  };

  return (
    <div
      data-action="course-tag"
      className={cn(
        // ⚠️ CRITICAL: chrome-follow-top makes this slide with header auto-hide
        // DO NOT REMOVE or add conflicting transitions (transition-all, etc.)
        // Relies on --chrome-top-shift from chrome-autohide.css
        "fixed z-overlay cursor-pointer chrome-follow-top",
        "right-3 md:right-6",
        className
      )}
      onClick={handleCourseClick}
      style={{
        top: 'calc(var(--safe-top, 0px) + 64px + 8px)',
        maxWidth: isMobile ? '52vw' : '28vw'
      }}
    >
      <div 
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-2",
          "bg-hud-bg backdrop-blur-2xl border border-hud-border",
          "text-white shadow-hud",
          "hover:bg-hud-bg/80 transition-all duration-200"
        )}
      >
        <MapPin className="w-5 h-5 flex-shrink-0" />
        <span className="text-base font-medium truncate">
          {course.name}
        </span>
      </div>
    </div>
  );
};

export default ClubTagPill;