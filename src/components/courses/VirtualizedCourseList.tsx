/**
 * CourseListGrid (file name kept as VirtualizedCourseList for import stability).
 *
 * NO LONGER VIRTUALISED. The previous implementation estimated a uniform row
 * height (240px) and translated a window of cards by startRow * rowHeight.
 * Top 100 rows are NOT uniform — `Top100EnrichmentBlock` renders nothing for
 * unrated courses and a verdict band + stats panel for rated ones, measured
 * at 232–394px on a 390px viewport. Every window boundary therefore snapped
 * the list by the accumulated error.
 *
 * We also deliberately do NOT use `content-visibility: auto` with a fixed
 * `contain-intrinsic-size`: that is the same uniform-height contract wearing a
 * different hat and reproduces the identical jump. At ~100 cards with
 * `loading="lazy"` images that already reserve space via aspect-ratio, plain
 * DOM is fast enough and is the least surprising thing to maintain.
 *
 * Uses UnifiedCourseCard - the single source of truth for course cards.
 */

import React, { useCallback, useMemo } from 'react';
import { UnifiedCourseCard } from './UnifiedCourseCard';
import { fromGolfCourse } from '@/lib/mappers/toCourseCardModel';
import { useNavigate } from 'react-router-dom';

/**
 * The 5px band between cards. Same convention as the light feed, declared
 * locally on purpose: that is a different feature and must not become a
 * dependency of this one.
 */
const CARD_BAND = '#E5E7EA';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
  average_rating?: number | null;
  displayRank?: number;
}

interface VirtualizedCourseListProps {
  courses: Course[];
  onCourseClick?: () => void;
  footer?: React.ReactNode;
  activeListSlug?: string | null;
  showGhostRank?: boolean;
  /**
   * Optional enrichment footer rendered under each card. Height may vary per
   * course — nothing here depends on a uniform row height any more.
   */
  renderEnrichment?: (courseId: string) => React.ReactNode;
  /** Viewer's relationship to a course, shown as a pill in the rank capsule. */
  viewerStatusFor?: (courseId: string) => 'rated' | 'played' | null;
}

const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  onCourseClick,
  footer,
  activeListSlug = null,
  showGhostRank = false,
  renderEnrichment,
  viewerStatusFor,
}) => {
  const navigate = useNavigate();

  // ── Memoise mapped card models (one per course) ──
  // Stable references let React.memo on UnifiedCourseCard bail out.
  const cardModelMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof fromGolfCourse>>();
    for (const course of courses) {
      const model = fromGolfCourse(course);
      if (course.displayRank != null) model.displayRank = course.displayRank;
      map.set(course.id, model);
    }
    return map;
  }, [courses]);

  const handleCardClick = useCallback((courseId: string) => {
    onCourseClick?.();
    navigate(`/courses/${courseId}`);
  }, [onCourseClick, navigate]);

  if (courses.length === 0) return null;

  return (
    <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
        {courses.map((course, i) => (
          <div key={course.id} className="mb-0">
            <UnifiedCourseCard
              course={cardModelMap.get(course.id) ?? fromGolfCourse(course)}
              showRankBadges={true}
              showRating={true}
              showGhostRank={showGhostRank}
              activeListSlug={activeListSlug}
              viewerStatus={viewerStatusFor?.(course.id) ?? null}
              onClick={() => handleCardClick(course.id)}
            />
            {renderEnrichment?.(course.id)}
            {/*
              BETWEEN items only — index against length, never :last-child,
              because the list appends pages and a trailing band would flash
              during load. Hidden from md up: a horizontal band under one cell
              of a 2/3-column grid separates nothing.
            */}
            {i < courses.length - 1 && (
              <div
                aria-hidden
                className="md:hidden"
                style={{ height: 5, background: CARD_BAND }}
              />
            )}
          </div>
        ))}
      </div>
      {footer && <div className="pt-8">{footer}</div>}
    </div>
  );
};

export default React.memo(VirtualizedCourseList);
