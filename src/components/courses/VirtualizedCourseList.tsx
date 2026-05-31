/**
 * Phase 2 Perf: Virtualized course list for better scroll performance
 * Only renders visible items + buffer, reducing DOM nodes significantly
 *
 * Uses UnifiedCourseCard - the single source of truth for course cards.
 *
 * Column-aware: calculates heights based on actual grid column count
 * to avoid over-sizing on md:grid-cols-2 / lg:grid-cols-3 layouts.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { UnifiedCourseCard } from './UnifiedCourseCard';
import { fromGolfCourse } from '@/lib/mappers/toCourseCardModel';
import { useNavigate } from 'react-router-dom';

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
}

// Initial row-height estimate. The actual rendered height is measured at runtime
// from a sample card on mount + when courses/columnCount change.
const INITIAL_ROW_HEIGHT = 240;
const BUFFER_ROWS = 3; // Number of rows to render above/below viewport

const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  onCourseClick,
  footer,
  activeListSlug = null,
  showGhostRank = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sampleCardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [rowHeight, setRowHeight] = useState<number>(INITIAL_ROW_HEIGHT);
  const [columnCount, setColumnCount] = useState(1);

  // Cached container offset relative to scroll container (top-left).
  // Avoids per-frame getBoundingClientRect() calls inside the scroll handler.
  // NOTE: If a future change introduces dynamic-height content above the list
  // (e.g. a collapsible filter section), trigger recomputeContainerOffset()
  // when that content's size changes.
  const containerOffsetRef = useRef(0);

  // ── Refs mirroring state read inside updateVisibleRange ──
  // Keeps the callback identity stable across pagination so the scroll
  // listener isn't torn down + re-attached every time courses.length changes.
  const coursesLengthRef = useRef(courses.length);
  const rowHeightRef = useRef(rowHeight);
  const columnCountRef = useRef(columnCount);

  useEffect(() => { coursesLengthRef.current = courses.length; }, [courses.length]);
  useEffect(() => { rowHeightRef.current = rowHeight; }, [rowHeight]);
  useEffect(() => { columnCountRef.current = columnCount; }, [columnCount]);

  // ── Memoise mapped card models (one per course, recompute when courses array changes) ──
  // Stable references let React.memo on UnifiedCourseCard bail out when props are unchanged.
  const cardModelMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof fromGolfCourse>>();
    for (const course of courses) {
      const model = fromGolfCourse(course);
      if (course.displayRank != null) model.displayRank = course.displayRank;
      map.set(course.id, model);
    }
    return map;
  }, [courses]);

  // Detect viewport size → update column count (row height is now measured)
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      // Match Tailwind breakpoints: 1 col default, 2 at md (768), 3 at lg (1024)
      if (w >= 1024) setColumnCount(3);
      else if (w >= 768) setColumnCount(2);
      else setColumnCount(1);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Get the actual scrolling container
  const getScrollContainer = useCallback((): HTMLElement => {
    const rootElement = document.getElementById('root');
    if (rootElement) return rootElement;
    let element = containerRef.current?.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
      if (hasScroll && element.scrollHeight > element.clientHeight) return element;
      element = element.parentElement;
    }
    return document.body;
  }, []);

  // Recompute the cached container offset (mount, resize, list-size change)
  const recomputeContainerOffset = useCallback(() => {
    if (!containerRef.current) return;
    const scrollContainer = getScrollContainer();
    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollContainerRect = scrollContainer.getBoundingClientRect();
    containerOffsetRef.current =
      containerRect.top - scrollContainerRect.top + scrollContainer.scrollTop;
  }, [getScrollContainer]);

  useEffect(() => {
    recomputeContainerOffset();
    window.addEventListener('resize', recomputeContainerOffset);
    return () => window.removeEventListener('resize', recomputeContainerOffset);
  }, [recomputeContainerOffset, courses.length]);

  // Measure first rendered card to derive accurate row height (incl. CSS gap)
  useEffect(() => {
    if (courses.length === 0) return;
    const rafId = requestAnimationFrame(() => {
      if (!sampleCardRef.current) return;
      const height = sampleCardRef.current.offsetHeight;
      // Tailwind: gap-2 (8px) on mobile, gap-6 (24px) at sm+
      const gap = window.innerWidth >= 640 ? 24 : 8;
      const measured = height + gap;
      if (measured > 0 && Math.abs(measured - rowHeight) > 4) {
        setRowHeight(measured);
      }
    });
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnCount, courses.length === 0]);

  // Update visible range on scroll (row-aware) — reads dynamic state from refs
  // so the callback identity is stable across pagination and re-renders.
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollContainer = getScrollContainer();
    const scrollTop = scrollContainer.scrollTop;
    const viewportHeight = scrollContainer.clientHeight;

    // Use cached offset — no per-frame layout reads
    const scrollRelative = Math.max(0, scrollTop - containerOffsetRef.current);

    const rh = rowHeightRef.current;
    const cc = columnCountRef.current;
    const cl = coursesLengthRef.current;

    // Calculate in rows, then convert to item indices
    const startRow = Math.max(0, Math.floor(scrollRelative / rh) - BUFFER_ROWS);
    const visibleRows = Math.ceil(viewportHeight / rh);
    const totalRows = Math.ceil(cl / cc);
    const endRow = Math.min(totalRows, startRow + visibleRows + BUFFER_ROWS * 2);

    const startIndex = startRow * cc;
    const endIndex = Math.min(cl, endRow * cc);

    // Always show at least 10 items initially
    const finalEnd = Math.max(endIndex, Math.min(10, cl));

    setVisibleRange((prev) => {
      if (prev.start === startIndex && prev.end === finalEnd) return prev;
      return { start: startIndex, end: finalEnd };
    });
  }, [getScrollContainer]);

  // Throttled scroll handler — stable now that updateVisibleRange identity is stable
  useEffect(() => {
    let rafId: number | null = null;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          updateVisibleRange();
          ticking = false;
        });
        ticking = true;
      }
    };

    const initTimer = setTimeout(() => updateVisibleRange(), 100);
    const scrollContainer = getScrollContainer();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(initTimer);
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateVisibleRange, getScrollContainer]);

  // Recalculate on courses change — invokes the stable callback, no teardown
  useEffect(() => {
    const timer = setTimeout(() => updateVisibleRange(), 50);
    return () => clearTimeout(timer);
  }, [courses.length, updateVisibleRange]);

  // Stable card click handler — accepts course ID, partial-applied at call site
  const handleCardClick = useCallback((courseId: string) => {
    onCourseClick?.();
    navigate(`/courses/${courseId}`);
  }, [onCourseClick, navigate]);

  // Total height accounts for columns
  const totalRows = Math.ceil(courses.length / columnCount);
  const totalHeight = totalRows * rowHeight;
  const offsetRow = Math.floor(visibleRange.start / columnCount);
  const offsetY = offsetRow * rowHeight;

  if (courses.length === 0) return null;

  // For small lists (< 25 items), don't virtualize — render all
  if (courses.length < 25) {
    return (
      <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
          {courses.map((course, i) => (
            <div key={course.id} className="mb-0" ref={i === 0 ? sampleCardRef : undefined}>
              <UnifiedCourseCard
                course={cardModelMap.get(course.id) ?? fromGolfCourse(course)}
                showRankBadges={true}
                showRating={true}
                showGhostRank={showGhostRank}
                activeListSlug={activeListSlug}
                onClick={() => handleCardClick(course.id)}
              />
            </div>
          ))}
        </div>
        {footer && <div className="pt-8">{footer}</div>}
      </div>
    );
  }

  // Virtualized rendering for larger lists
  const visibleCourses = courses.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0"
    >
      <div style={{ height: totalHeight, position: 'relative', zIndex: 0 }}>
        <div
          className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 will-change-transform"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleCourses.map((course, i) => (
            <div key={course.id} className="mb-0" ref={i === 0 ? sampleCardRef : undefined}>
              <UnifiedCourseCard
                course={cardModelMap.get(course.id) ?? fromGolfCourse(course)}
                showRankBadges={true}
                showRating={true}
                showGhostRank={showGhostRank}
                activeListSlug={activeListSlug}
                onClick={() => handleCardClick(course.id)}
              />
            </div>
          ))}
        </div>
      </div>
      {footer && <div className="pt-8 relative z-10 bg-background">{footer}</div>}
    </div>
  );
};

export default React.memo(VirtualizedCourseList);
