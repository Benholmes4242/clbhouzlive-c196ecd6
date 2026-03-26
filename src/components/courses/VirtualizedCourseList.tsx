/**
 * Phase 2 Perf: Virtualized course list for better scroll performance
 * Only renders visible items + buffer, reducing DOM nodes significantly
 * 
 * Uses UnifiedCourseCard - the single source of truth for course cards.
 * 
 * Column-aware: calculates heights based on actual grid column count
 * to avoid over-sizing on md:grid-cols-2 / lg:grid-cols-3 layouts.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
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
}

interface VirtualizedCourseListProps {
  courses: Course[];
  onCourseClick?: () => void;
  footer?: React.ReactNode;
  activeListSlug?: string | null;
}

// Row height for scroll calculations (per grid row, not per item)
const ROW_HEIGHT = 300; // Mobile row height
const ROW_HEIGHT_SM = 280; // Desktop row height
const BUFFER_ROWS = 3; // Number of rows to render above/below viewport

const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  onCourseClick,
  footer,
  activeListSlug = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [rowHeight, setRowHeight] = useState(ROW_HEIGHT);
  const [columnCount, setColumnCount] = useState(1);

  // Detect viewport size → update row height + column count
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setRowHeight(w < 640 ? ROW_HEIGHT : ROW_HEIGHT_SM);
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

  // Update visible range on scroll (row-aware)
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollContainer = getScrollContainer();
    const scrollTop = scrollContainer.scrollTop;
    const viewportHeight = scrollContainer.clientHeight;

    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollContainerRect = scrollContainer.getBoundingClientRect();
    const containerTop = containerRect.top - scrollContainerRect.top + scrollTop;

    const scrollRelative = Math.max(0, scrollTop - containerTop);

    // Calculate in rows, then convert to item indices
    const startRow = Math.max(0, Math.floor(scrollRelative / rowHeight) - BUFFER_ROWS);
    const visibleRows = Math.ceil(viewportHeight / rowHeight);
    const totalRows = Math.ceil(courses.length / columnCount);
    const endRow = Math.min(totalRows, startRow + visibleRows + BUFFER_ROWS * 2);

    const startIndex = startRow * columnCount;
    const endIndex = Math.min(courses.length, endRow * columnCount);

    // Always show at least 10 items initially
    const finalEnd = Math.max(endIndex, Math.min(10, courses.length));

    setVisibleRange({ start: startIndex, end: finalEnd });
  }, [courses.length, rowHeight, columnCount, getScrollContainer]);

  // Throttled scroll handler
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

  // Recalculate on courses change
  useEffect(() => {
    const timer = setTimeout(() => updateVisibleRange(), 50);
    return () => clearTimeout(timer);
  }, [courses.length, updateVisibleRange]);

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
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
          {courses.map((course) => (
            <div key={course.id} className="mb-0">
              <UnifiedCourseCard 
                course={fromGolfCourse(course)}
                showRankBadges={true}
                showRating={true}
                activeListSlug={activeListSlug}
                onClick={() => {
                  onCourseClick?.();
                  navigate(`/courses/${course.id}`);
                }}
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
          className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6 will-change-transform"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleCourses.map((course) => (
            <div key={course.id} className="mb-0">
              <UnifiedCourseCard 
                course={fromGolfCourse(course)}
                showRankBadges={true}
                showRating={true}
                onClick={() => {
                  onCourseClick?.();
                  navigate(`/courses/${course.id}`);
                }}
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
