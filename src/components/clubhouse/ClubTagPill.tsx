import React from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FROST, FROST_BLUR } from '@/lib/frostPanel';

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
        top: 'calc(var(--safe-top, 0px) + 52px + 2px)',
        maxWidth: isMobile ? '52vw' : '28vw'
      } : undefined}
    >
      <div
        className="inline-flex items-center gap-1 px-2.5 py-1.5"
        style={{
          background: FROST.glass,
          backdropFilter: FROST_BLUR.panel,
          WebkitBackdropFilter: FROST_BLUR.panel,
          border: `1px solid ${FROST.border}`,
          boxShadow: `${FROST.dropShadow}, ${FROST.innerHighlight}`,
          borderRadius: 10,
          transform: 'translateZ(0)',
          willChange: 'backdrop-filter',
        }}
      >
        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: FROST.ink }} />
        <span
          className="text-[10px] leading-none font-semibold truncate"
          style={{ color: FROST.ink }}
        >
          {course.name}
        </span>
      </div>
    </div>
  );
};

export default ClubTagPill;