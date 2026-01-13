/**
 * Phase 2 Perf: Virtualized course list for better scroll performance
 * Only renders visible items + buffer, reducing DOM nodes significantly
 * 
 * Uses UnifiedCourseCard - the single source of truth for course cards.
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
}

// Card height calculation for 16:9 image + meta bar (~100px including padding)
// Mobile: screen width / (16/9) + meta = ~56% of width + 100px
// Increased from 280/260 to prevent metadata cutoff
const ITEM_HEIGHT = 320; // Mobile: 16:9 aspect + full meta bar with location/rating
const ITEM_HEIGHT_SM = 300; // Desktop: slightly shorter due to narrower cards
const BUFFER_SIZE = 3; // Number of items to render above/below viewport

const VirtualizedCourseList: React.FC<VirtualizedCourseListProps> = ({
  courses,
  onCourseClick,
  footer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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

  // Get the actual scrolling container - in this app it's #root, not window
  const getScrollContainer = useCallback((): HTMLElement => {
    // In this app, #root is the scrolling container (see index.css)
    const rootElement = document.getElementById('root');
    if (rootElement) {
      return rootElement;
    }
    
    // Fallback: search up the tree for scrolling parent
    let element = containerRef.current?.parentElement;
    while (element) {
      const style = window.getComputedStyle(element);
      const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
      if (hasScroll && element.scrollHeight > element.clientHeight) {
        return element;
      }
      element = element.parentElement;
    }
    
    // Last resort fallback to document.body
    return document.body;
  }, []);

  // Update visible range on scroll
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollContainer = getScrollContainer();
    const scrollTop = scrollContainer.scrollTop;
    const viewportHeight = scrollContainer.clientHeight;
    
    // Find container's offset from top of scroll container
    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollContainerRect = scrollContainer.getBoundingClientRect();
    const containerTop = containerRect.top - scrollContainerRect.top + scrollTop;
    
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

  // Throttled scroll handler - attach to #root (the actual scrolling container)
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

    // Attach listener to #root (the actual scrolling container in this app)
    const scrollContainer = getScrollContainer();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(initTimer);
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateVisibleRange, getScrollContainer]);

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
        {footer && <div className="pt-8">{footer}</div>}
      </div>
    );
  }

  // Virtualized rendering for larger lists
  // For 25 or fewer courses, skip virtualization and render all at once
  if (courses.length <= 25) {
    return (
      <div 
        ref={containerRef}
        className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0"
      >
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6">
          {courses.map((course) => (
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
        {footer && <div className="pt-8">{footer}</div>}
      </div>
    );
  }

  // For larger lists (>25), use virtualization
  const visibleCourses = courses.slice(visibleRange.start, visibleRange.end);

  // Calculate the height for just the course grid, footer sits after
  const gridHeight = totalHeight;

  return (
    <div 
      ref={containerRef}
      className="w-[100vw] relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] sm:w-full sm:left-auto sm:right-auto sm:ml-0 sm:mr-0"
    >
      {/* Virtualized grid with fixed height - z-index 0 to stay below footer */}
      <div style={{ height: gridHeight, position: 'relative', zIndex: 0 }}>
        <div
          className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 sm:gap-6 will-change-transform"
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleCourses.map((course) => (
            <div 
              key={course.id} 
              className="mb-0"
              style={{ height: itemHeight }}
            >
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
      {/* Footer (pagination) sits after the grid - z-index 10 ensures it appears above cards */}
      {footer && <div className="pt-8 relative z-10 bg-background">{footer}</div>}
    </div>
  );
};

export default React.memo(VirtualizedCourseList);
