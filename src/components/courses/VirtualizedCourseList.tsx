/**
 * Phase 2 Perf: Virtualized course list for better scroll performance
 * Only renders visible items + buffer, reducing DOM nodes significantly
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import CourseCard from './CourseCard';

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
}

const ITEM_HEIGHT = 280; // Mobile card height
const ITEM_HEIGHT_SM = 256; // Desktop card height (16rem = 256px)
const BUFFER_SIZE = 3; // Number of items to render above/below viewport

const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  onCourseClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [itemHeight, setItemHeight] = useState(ITEM_HEIGHT);
  const [isMobile, setIsMobile] = useState(true);

  // Detect viewport size and update item height
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640; // sm breakpoint
      setIsMobile(mobile);
      setItemHeight(mobile ? ITEM_HEIGHT : ITEM_HEIGHT_SM);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect and use the correct scrolling container
  const getScrollContainer = useCallback(() => {
    // Find the actual scrolling element (parent with overflow)
    let element = containerRef.current?.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
      if (hasScroll && element.scrollHeight > element.clientHeight) {
        return element;
      }
      element = element.parentElement;
    }
    // Fallback to window if no scrolling parent found
    return window;
  }, []);

  // Update visible range on scroll
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollContainer = getScrollContainer();
    const isWindow = scrollContainer === window;
    
    const scrollTop = isWindow ? window.scrollY : (scrollContainer as HTMLElement).scrollTop;
    const viewportHeight = isWindow ? window.innerHeight : (scrollContainer as HTMLElement).clientHeight;
    
    // Find container's offset from top of scroll container
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerTop = isWindow 
      ? containerRect.top + scrollTop
      : containerRect.top + scrollTop - (scrollContainer as HTMLElement).getBoundingClientRect().top;
    
    // Calculate scroll position relative to container start
    const scrollRelative = Math.max(0, scrollTop - containerTop);
    
    // Calculate visible indices with buffer
    const startIndex = Math.max(0, Math.floor(scrollRelative / itemHeight) - BUFFER_SIZE);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const endIndex = Math.min(
      courses.length,
      startIndex + visibleCount + (BUFFER_SIZE * 2)
    );

    // Always show at least 10 items initially
    const finalEnd = Math.max(endIndex, 10);

    setVisibleRange({ start: startIndex, end: finalEnd });
  }, [courses.length, itemHeight, getScrollContainer]);

  // Throttled scroll handler - attach to correct scrolling container
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

    // Initial calculation - delay to ensure container is positioned
    const initTimer = setTimeout(() => {
      updateVisibleRange();
    }, 100);

    // Attach listener to actual scrolling container
    const scrollContainer = containerRef.current?.parentElement ?? window;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true } as any);
    
    return () => {
      clearTimeout(initTimer);
      scrollContainer.removeEventListener('scroll', handleScroll as any);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateVisibleRange]);

  // Recalculate on courses change and window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      updateVisibleRange();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [courses, updateVisibleRange]);

  const totalHeight = courses.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  // Only render when we have courses
  if (courses.length === 0) {
    return null;
  }

  // For very small lists (< 20 items), don't virtualize
  if (courses.length < 20) {
    return (
      <div className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0">
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
          {courses.map((course) => (
            <div key={course.id} className="mb-4 sm:mb-0">
              <CourseCard 
                course={course}
                showRankBadge={!!course.global_rank}
                onClick={onCourseClick}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Virtualized rendering for larger lists
  const visibleCourses = courses.slice(visibleRange.start, visibleRange.end);

  return (
    <div 
      ref={containerRef}
      className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0"
      style={{ height: totalHeight }}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6 will-change-transform"
        style={{
          transform: `translateY(${offsetY}px)`,
        }}
      >
        {visibleCourses.map((course) => (
          <div 
            key={course.id} 
            className="mb-4 sm:mb-0"
            style={{ height: itemHeight }}
          >
            <CourseCard 
              course={course}
              showRankBadge={!!course.global_rank}
              onClick={onCourseClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedCourseList);
