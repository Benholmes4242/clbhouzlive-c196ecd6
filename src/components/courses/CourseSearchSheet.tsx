import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Search } from 'lucide-react';
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
            className="fixed inset-0 z-[10010] touch-none"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
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
            className={`
              fixed z-[10011] overflow-hidden
              ${isMobile 
                ? 'inset-x-0 bottom-0 rounded-t-[24px]' 
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl'
              }
              flex flex-col
            `}
            style={{
              background: '#F8FAFC',
              maxHeight: '65vh',
              paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Handle bar - design system spec */}
            {isMobile && (
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1 bg-[#e2e8f0] rounded-full" />
              </div>
            )}

            {/* Header - unified design system */}
            <div className="px-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Choose Golf Club
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Search input - consistent styling */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a golf course..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted/30 border-0 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div 
              ref={resultsRef}
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-2"
            >
              {loading ? (
                <SkeletonList rows={6} />
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-[14px] mb-3" style={{ color: '#64748b' }}>Trouble loading courses</p>
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
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/30 mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {query ? "No courses found" : "Search for a course"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {query ? "Try a different search term" : "Start typing to find courses"}
                  </p>
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
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={!isAlreadyAdded ? { scale: 0.98 } : {}}
      className={`
        p-3 rounded-xl cursor-pointer transition-all duration-150
        ${isFocused ? 'ring-2 ring-slate-200' : ''}
        ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        background: isFocused ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
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
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            style={{ border: '1px solid rgba(0, 0, 0, 0.04)' }}
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0, 0, 0, 0.04)' }}
          >
            <MapPin className="w-5 h-5" style={{ color: '#94a3b8' }} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[14px] truncate" style={{ color: '#1e293b' }}>
            {course.name}
          </div>
          <div className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{ color: '#64748b' }}>
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
            {course.rating && (
              <span className="font-semibold" style={{ color: '#1e293b' }}>• {course.rating.toFixed(1)}</span>
            )}
          </div>
        </div>

        {isAlreadyAdded && (
          <div 
            className="text-[11px] font-medium px-2 py-1 rounded-lg"
            style={{ background: 'rgba(0, 0, 0, 0.04)', color: '#94a3b8' }}
          >
            Added
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div 
            className="w-12 h-12 rounded-xl flex-shrink-0"
            style={{ 
              background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          <div className="flex-1 space-y-2">
            <div 
              className="h-4 rounded-lg w-3/4"
              style={{ 
                background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
            <div 
              className="h-3 rounded-lg w-1/2"
              style={{ 
                background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
