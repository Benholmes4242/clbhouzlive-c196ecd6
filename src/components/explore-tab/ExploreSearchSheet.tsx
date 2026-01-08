/**
 * ExploreSearchSheet - Bottom sheet for search with auto-focus
 * 
 * Shows two result groups: Courses and Regions
 * 
 * Polish: keyboard safe area, visible close button on all devices, fast open
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Search, MapPin, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useExploreSearch } from '@/hooks/useExploreData';
import { RegionKey } from '@/hooks/useExploreMoments';
import { Skeleton } from '@/components/ui/skeleton';

interface ExploreSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Region metadata for search results
const REGION_DATA: Record<RegionKey, { title: string; slug: string }> = {
  GBI: { title: 'Great Britain & Ireland', slug: 'gbi' },
  EU: { title: 'Continental Europe', slug: 'eu' },
  USA: { title: 'United States', slug: 'usa' },
  ROW: { title: 'Rest of World', slug: 'row' },
};

export const ExploreSearchSheet: React.FC<ExploreSearchSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  
  const { data: searchResults, isLoading } = useExploreSearch(query);

  // Auto-focus input when sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure sheet animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clear query when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCourseClick = useCallback((courseId: string) => {
    onClose();
    // Small delay to let sheet close animation start
    setTimeout(() => {
      navigate(`/courses/${courseId}`);
    }, 50);
  }, [navigate, onClose]);

  const handleRegionClick = useCallback((regionKey: RegionKey) => {
    onClose();
    setTimeout(() => {
      navigate(`/discover/explore/region/${REGION_DATA[regionKey].slug}`);
    }, 50);
  }, [navigate, onClose]);

  // Filter regions based on query
  const matchingRegions = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return (Object.entries(REGION_DATA) as [RegionKey, { title: string; slug: string }][])
      .filter(([_, data]) => 
        data.title.toLowerCase().includes(q) || 
        data.slug.toLowerCase().includes(q)
      )
      .map(([key, data]) => ({ key, ...data }));
  }, [query]);

  const courses = searchResults?.courses || [];
  const hasResults = courses.length > 0 || matchingRegions.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header with handle and close button */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="w-8" /> {/* Spacer for centering */}
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-alt transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses or regions..."
                  className="w-full pl-10 pr-10 py-3 bg-surface-alt rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Results */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {query.length < 2 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Start typing to search courses and regions
                  </p>
                </div>
              ) : isLoading ? (
                <div className="px-4 py-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !hasResults ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for "{query}"
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Regions */}
                  {matchingRegions.length > 0 && (
                    <div className="px-4 py-3">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Regions
                      </h3>
                      <div className="space-y-1">
                        {matchingRegions.map(region => (
                          <button
                            key={region.key}
                            onClick={() => handleRegionClick(region.key)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-alt active:bg-surface-alt transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Flag className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-foreground">{region.title}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Courses */}
                  {courses.length > 0 && (
                    <div className="px-4 py-3">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Courses
                      </h3>
                      <div className="space-y-1">
                        {courses.map(course => (
                          <button
                            key={course.id}
                            onClick={() => handleCourseClick(course.id)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-alt active:bg-surface-alt transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-surface-alt overflow-hidden flex-shrink-0">
                              {course.thumbnail_image ? (
                                <img 
                                  src={course.thumbnail_image} 
                                  alt={course.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-800/50 to-slate-900/50" />
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{course.name}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{course.sub_country || course.country}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Bottom safe area padding */}
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExploreSearchSheet;
