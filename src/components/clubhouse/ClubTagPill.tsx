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
  positioning?: 'fixed' | 'absolute' | 'static';
}

const ClubTagPill = ({ course, className, positioning = 'fixed' }: ClubTagPillProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isFixed = positioning === 'fixed';

  const handleCourseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/courses/${course.id}`);
  };

  return (
    <div
      data-action="course-tag"
      className={cn(
        // ⚠️ CRITICAL: chrome-follow-top makes this slide with header auto-hide
        // DO NOT REMOVE when fixed, or add conflicting transitions (transition-all, etc.)
        // Relies on --chrome-top-shift from chrome-autohide.css
        isFixed ? "fixed chrome-follow-top right-3 md:right-6" : (positioning === "absolute" ? "absolute" : "static"),
        "z-overlay cursor-pointer",
        className
      )}
      onClick={handleCourseClick}
      style={isFixed ? {
        top: 'calc(var(--safe-top, 0px) + 64px + 2px)',
        maxWidth: isMobile ? '52vw' : '28vw'
      } : undefined}
    >
      <div 
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1.5",
          "bg-hud-bg backdrop-blur-2xl border border-hud-border",
          "text-white shadow-hud",
          "hover:bg-hud-bg/80 transition-all duration-200"
        )}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          {course.name}
        </span>
      </div>
    </div>
  );
};

export default ClubTagPill;