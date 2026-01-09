import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseSearch, getSuggestions } from '@/hooks/useCourseSearch';
import { getFlagCode } from '@/utils/countryFlags';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface Course {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  region: string;
  thumbnail_image?: string;
  rating?: number;
  played?: boolean;
}

interface CourseSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  userId?: string;
  existingCourseIds?: string[];
  slotIndex?: number;
}

export function CourseSearchSheet({
  isOpen,
  onClose,
  onSelectCourse,
  userId,
  existingCourseIds = [],
  slotIndex
}: CourseSearchSheetProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const { data: searchResults, loading, error } = useCourseSearch(query, {
    debounceMs: 250,
    limit: 20,
    userId
  });

  const items = query.trim().length > 0 ? searchResults : suggestions;

  // Load suggestions when sheet opens
  useEffect(() => {
    if (isOpen && userId) {
      getSuggestions(userId).then(setSuggestions);
    }
  }, [isOpen, userId]);

  // Body scroll lock & focus management
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement;
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      setTimeout(() => inputRef.current?.focus(), 100);
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    } else {
      setQuery("");
      setSuggestions([]);
      setFocusedIndex(-1);
      returnFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          handleSelectCourse(items[focusedIndex]);
        }
        break;
    }
  }, [items, focusedIndex, onClose]);

  // Handle course selection
  const handleSelectCourse = useCallback((course: Course) => {
    if (existingCourseIds.includes(course.id)) {
      console.log('Course already in Top 10');
      return;
    }
    onSelectCourse(course);
    onClose();
  }, [existingCourseIds, onSelectCourse, onClose]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.children;
      const item = items[focusedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  // Reset focused index when items change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [items]);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10010] touch-none"
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
            style={{ WebkitTouchCallout: 'none' }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={slotIndex !== undefined ? `Add course to position ${slotIndex + 1}` : "Search for a golf course"}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className={`
              fixed z-[10011] overflow-hidden
              ${isMobile 
                ? 'inset-x-0 bottom-0 rounded-t-[24px]' 
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-xl'
              }
              flex flex-col
            `}
            style={{
              background: '#F8FAFC',
              maxHeight: '60vh',
              paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0
            }}
          >
            {/* Grabber handle */}
            {isMobile && (
              <div className="flex justify-center pt-2.5 pb-1.5">
                <div 
                  className="w-8 h-[3px] rounded-full"
                  style={{ background: 'rgba(0, 0, 0, 0.12)' }}
                />
              </div>
            )}

            {/* Header */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[17px] font-semibold" style={{ color: 'var(--hub-text, #1e293b)' }}>
                  Choose Golf Club
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0, 0, 0, 0.05)' }}
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--hub-text-sub, #64748b)' }} />
                </button>
              </div>
              
              <div 
                className="rounded-xl"
                style={{ background: 'white' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a golf course..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 rounded-xl text-[15px] focus:outline-none"
                  style={{ 
                    background: 'white',
                    color: 'var(--hub-text, #1e293b)',
                  }}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Results */}
            <div 
              ref={resultsRef}
              className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
            >
              {loading ? (
                <SkeletonList rows={8} />
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Trouble loading courses</p>
                  <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : items?.length ? (
                <div className="space-y-1">
                  {items.map((course, index) => (
                    <ResultRow
                      key={course.id}
                      course={course}
                      onClick={() => handleSelectCourse(course)}
                      isFocused={index === focusedIndex}
                      onMouseEnter={() => setFocusedIndex(index)}
                      isAlreadyAdded={existingCourseIds.includes(course.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {query ? "No matches found" : "Start typing to search courses"}
                  </p>
                  {!query && !suggestions.length && (
                    <p className="text-xs text-muted-foreground">
                      Your recent courses will appear here
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

interface ResultRowProps {
  course: Course;
  onClick: () => void;
  isFocused: boolean;
  onMouseEnter: () => void;
  isAlreadyAdded?: boolean;
}

function ResultRow({ course, onClick, isFocused, onMouseEnter, isAlreadyAdded }: ResultRowProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`
        p-3 rounded-lg cursor-pointer transition-all
        ${isFocused ? 'ring-2 ring-slate-300' : ''}
        ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        background: isFocused ? 'rgba(100, 116, 139, 0.08)' : 'transparent',
      }}
      onClick={isAlreadyAdded ? undefined : onClick}
      onKeyDown={isAlreadyAdded ? undefined : handleKeyDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-center gap-3">
        {course.thumbnail_image ? (
          <img 
            src={course.thumbnail_image} 
            alt="" 
            className="w-12 h-12 rounded-md object-cover bg-muted flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" style={{ color: '#1e293b' }}>{course.name}</div>
          <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: '#64748b' }}>
            <img 
              src={`https://flagicons.lipis.dev/flags/4x3/${getFlagCode(course.country).toLowerCase()}.svg`}
              alt={`${course.country} flag`}
              className="w-4 h-3 rounded-sm object-cover"
            />
            <span className="truncate">{course.sub_country || course.region}</span>
            {course.rating && (
              <span className="font-medium" style={{ color: '#1e293b' }}>• {course.rating.toFixed(1)}</span>
            )}
          </div>
        </div>

        {isAlreadyAdded && (
          <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            Added
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 rounded-md bg-muted animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
