import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseSearch, getSuggestions } from '@/hooks/useCourseSearch';
import { getFlagCode } from '@/utils/countryFlags';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
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

  const isSearchMode = query.trim().length > 0;

  // Sort suggestions: un-added first, then already-added
  const sortedSuggestions = React.useMemo(() => {
    if (!suggestions.length) return [];
    const notAdded = suggestions.filter(s => !existingCourseIds.includes(s.id));
    const added = suggestions.filter(s => existingCourseIds.includes(s.id));
    return [...notAdded, ...added];
  }, [suggestions, existingCourseIds]);

  const items = isSearchMode ? searchResults : sortedSuggestions;

  // Load suggestions when sheet opens
  useEffect(() => {
    if (isOpen && userId) {
      getSuggestions(userId).then(setSuggestions).catch(() => setSuggestions([]));
    }
  }, [isOpen, userId]);

  // Body scroll lock & focus management
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement;
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
      setSelectingId(null);
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

  // Handle course selection with brief flash delay
  const handleSelectCourse = useCallback((course: Course) => {
    if (existingCourseIds.includes(course.id)) return;
    
    setSelectingId(course.id);
    setTimeout(() => {
      onSelectCourse(course);
      onClose();
    }, 200);
  }, [existingCourseIds, onSelectCourse, onClose]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const children = resultsRef.current.children;
      const resultElements = Array.from(children).filter(el => el.getAttribute('role') === 'button');
      const item = resultElements[focusedIndex] as HTMLElement;
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
            className="fixed inset-0 z-[10010] touch-none bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
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
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "fixed z-[10011] overflow-hidden flex flex-col light",
              isMobile 
                ? 'inset-x-0 bottom-0 rounded-t-[20px]' 
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl',
              "shadow-[0_-4px_32px_rgba(0,0,0,0.1)]"
            )}
            style={{
              maxHeight: '65vh',
              paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Handle bar */}
            {isMobile && (
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Header */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>
                  Choose Golf Club
                </h3>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-colors active:opacity-60"
                  style={{ backgroundColor: '#F5F5F7', color: '#7A7A7A' }}
                  aria-label="Close search"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              
              {/* Search input */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
                  style={{ color: isFocused ? '#f59e0b' : '#AEAEB2' }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a golf course..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full h-11 pl-10 pr-10 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    backgroundColor: '#F5F5F7',
                    color: '#1A1A1A',
                    caretColor: '#f59e0b',
                    border: isFocused ? '1.5px solid #f59e0b' : '1.5px solid rgba(0,0,0,0.07)',
                    boxShadow: isFocused ? '0 0 0 3px rgba(245,158,11,0.10)' : 'none',
                  }}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: '#AEAEB2' }}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="relative flex-1 overflow-hidden">
              <div 
                ref={resultsRef}
                className="h-full overflow-y-auto overscroll-contain px-3 py-2"
              >
                {loading ? (
                  <SkeletonList rows={6} />
                ) : error ? (
                  <div className="p-8 text-center">
                    <p className="text-sm mb-3" style={{ color: '#7A7A7A' }}>Trouble loading courses</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#f59e0b' }}
                    >
                      Retry
                    </button>
                  </div>
                ) : items?.length ? (
                  <div>
                    {/* Suggestions label */}
                    {!isSearchMode && (
                      <p
                        className="uppercase tracking-[1.5px] mb-2 mt-1 px-1"
                        style={{ fontSize: '11px', fontWeight: 600, color: '#AEAEB2' }}
                      >
                        Your courses
                      </p>
                    )}
                    {items.map((course, index) => (
                      <ResultRow
                        key={course.id}
                        course={course}
                        index={index}
                        onClick={() => handleSelectCourse(course)}
                        isFocused={index === focusedIndex}
                        onMouseEnter={() => setFocusedIndex(index)}
                        isAlreadyAdded={existingCourseIds.includes(course.id)}
                        isSelecting={selectingId === course.id}
                        isLast={index === items.length - 1}
                        animate={!loading}
                      />
                    ))}
                    <div className="h-6" />
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(245,158,11,0.10)' }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: '#f59e0b' }} />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A' }}>
                      {query ? "No courses found" : "Search for a course"}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 400, color: '#AEAEB2', marginTop: '4px' }}>
                      {query ? "Try a different search term" : "Start typing to find courses"}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom scroll fade */}
              {items && items.length > 4 && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, #FFFFFF, transparent)' }}
                />
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
  index: number;
  onClick: () => void;
  isFocused: boolean;
  onMouseEnter: () => void;
  isAlreadyAdded?: boolean;
  isSelecting?: boolean;
  isLast?: boolean;
  animate?: boolean;
}

function ResultRow({ course, index, onClick, isFocused, onMouseEnter, isAlreadyAdded, isSelecting, isLast, animate }: ResultRowProps) {
  const [imgError, setImgError] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.05, 0.3) }}
      whileTap={!isAlreadyAdded ? { scale: 0.98 } : {}}
      className={cn(
        "p-3 rounded-xl cursor-pointer transition-all duration-150",
        isAlreadyAdded && "opacity-50 cursor-not-allowed",
      )}
      style={{
        backgroundColor: isSelecting
          ? 'rgba(245,158,11,0.10)'
          : isFocused
            ? 'rgba(245,158,11,0.06)'
            : 'transparent',
      }}
      onClick={isAlreadyAdded ? undefined : onClick}
      onKeyDown={isAlreadyAdded ? undefined : handleKeyDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-center gap-3">
        {course.thumbnail_image && !imgError ? (
          <img 
            src={course.thumbnail_image} 
            alt="" 
            className="w-12 h-12 object-cover flex-shrink-0"
            style={{
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-12 h-12 flex items-center justify-center flex-shrink-0"
            style={{
              borderRadius: '10px',
              backgroundColor: 'rgba(245,158,11,0.08)',
            }}
          >
            <MapPin className="w-5 h-5" style={{ color: '#f59e0b' }} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="truncate" style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A' }}>
            {course.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: '13px', color: '#7A7A7A' }}>
            {(() => {
              const flagCode = getFlagCode(course.country);
              return flagCode ? (
                <img 
                  src={`https://flagicons.lipis.dev/flags/4x3/${flagCode.toLowerCase()}.svg`}
                  alt={`${course.country} flag`}
                  className="w-4 h-3 rounded-sm object-cover"
                />
              ) : null;
            })()}
            <span className="truncate">{course.sub_country || course.region}</span>
            {course.rating != null && (
              <span>
                •{' '}
                <span style={{ color: course.rating >= 9.0 ? '#d97706' : '#78716C', fontWeight: 600 }}>
                  {course.rating.toFixed(1)}
                </span>
                <span style={{ color: '#AEAEB2', fontWeight: 400, fontSize: '11px', marginLeft: '2px' }}>/ 10</span>
              </span>
            )}
          </div>
        </div>

        {isAlreadyAdded && (
          <div
            className="flex items-center gap-1 px-2 py-0.5"
            style={{
              backgroundColor: 'rgba(245,158,11,0.10)',
              color: '#d97706',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '980px',
            }}
          >
            <Check className="w-3 h-3" style={{ color: '#f59e0b' }} />
            Added
          </div>
        )}
      </div>

      {/* Inset divider */}
      {!isLast && (
        <div className="ml-[60px] mt-3" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }} />
      )}
    </motion.div>
  );
}

function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 flex-shrink-0 animate-pulse" style={{ borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.06)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded-lg w-3/4 animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <div className="h-3 rounded-lg w-1/2 animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
