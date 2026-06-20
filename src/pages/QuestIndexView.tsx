/**
 * QuestIndexView - Full course index with search, filters, and actions
 * Phase 3: Real data + interactive actions
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Search, MapPin, CheckCircle, Star, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Input } from '@/components/ui/input';
import { formatRatingValue } from '@/utils/formatters';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuestCourses, QuestCourse } from '@/hooks/useQuestCourses';
import { useQuestOnboarding } from '@/hooks/useQuestOnboarding';

// Filter types
type StatusFilter = 'all' | 'played' | 'unplayed' | 'wishlist';
type SortOption = 'recent' | 'alphabetical' | 'rating';

const REGIONS = ['All Regions', 'GB & Ireland', 'Continental Europe', 'USA', 'Worldwide'];

// Filter pill component
const FilterPill: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}> = ({ label, isActive, onClick, count }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5"
    style={{
      background: isActive ? 'var(--dgp-accent-green)' : 'var(--dgp-glass-surface)',
      color: isActive ? '#000' : 'var(--dgp-text-secondary)',
      border: '1px solid',
      borderColor: isActive ? 'var(--dgp-accent-green)' : 'var(--dgp-glass-stroke)',
    }}
  >
    {label}
    {count !== undefined && (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full"
        style={{
          background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--dgp-glass-stroke)',
        }}
      >
        {count}
      </span>
    )}
  </button>
);

// Course row component with actions (RATINGS-ONLY: "played" toggle opens rating modal)
const CourseRow: React.FC<{
  course: QuestCourse;
  onToggleWishlist: (courseId: string, wishlist: boolean) => void;
  onRate: (course: QuestCourse) => void;
}> = ({ course, onToggleWishlist, onRate }) => (
  <div
    className="flex items-center gap-3 py-3 border-b"
    style={{ borderColor: 'var(--dgp-divider)' }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--dgp-glass-surface)' }}
    >
      <MapPin className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          {course.name}
        </p>
        {course.rating && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="w-3 h-3 fill-current" style={{ color: 'var(--dgp-accent-gold)' }} />
            <span className="text-xs" style={{ color: 'var(--dgp-accent-gold)' }}>
              {formatRatingValue(course.rating)}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
        {course.country} · {course.region}
      </p>
    </div>
    
    {/* Actions */}
    <div className="flex items-center gap-1 flex-shrink-0">
      {/* Wishlist toggle */}
      <button
        onClick={() => onToggleWishlist(course.id, !course.isWishlist)}
        className="p-2 rounded-lg transition-colors"
        style={{
          background: course.isWishlist ? 'rgba(200, 176, 106, 0.2)' : 'transparent',
        }}
        aria-label={course.isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {course.isWishlist ? (
          <BookmarkCheck className="w-4 h-4" style={{ color: 'var(--dgp-accent-gold)' }} />
        ) : (
          <Bookmark className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
        )}
      </button>
      
      {/* Rate button - RATINGS-ONLY: this is now the primary way to "play" a course */}
      <button
        onClick={() => onRate(course)}
        className="p-2 rounded-lg transition-colors"
        style={{
          background: course.isRated ? 'rgba(110, 146, 119, 0.2)' : 'transparent',
        }}
        aria-label={course.isRated ? 'Edit rating' : 'Rate this course'}
      >
        <Star
          className={`w-4 h-4 ${course.isRated ? 'fill-current' : ''}`}
          style={{ color: course.isRated ? 'var(--dgp-accent-green)' : 'var(--dgp-text-muted)' }}
        />
      </button>
    </div>
  </div>
);

// Simple rating sheet
const RatingSheet: React.FC<{
  course: QuestCourse | null;
  onClose: () => void;
  onRate: (courseId: string, rating: number) => void;
}> = ({ course, onClose, onRate }) => {
  const [selectedRating, setSelectedRating] = useState(course?.rating || 0);

  const handleSubmit = () => {
    if (course && selectedRating > 0) {
      onRate(course.id, selectedRating);
      onClose();
    }
  };

  return (
    <Sheet open={!!course} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t"
        style={{
          background: 'var(--dgp-bg-surface)',
          borderColor: 'var(--dgp-glass-stroke)',
        }}
      >
        {course && (
          <div className="py-6">
            <SheetHeader className="text-center mb-6">
              <SheetTitle style={{ color: 'var(--dgp-text-primary)' }}>
                Rate {course.name}
              </SheetTitle>
            </SheetHeader>
            
            {/* Star rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(star)}
                  className="p-2"
                >
                  <Star
                    className={`w-8 h-8 transition-all ${
                      star <= selectedRating ? 'fill-current scale-110' : ''
                    }`}
                    style={{
                      color: star <= selectedRating ? 'var(--dgp-accent-gold)' : 'var(--dgp-text-muted)',
                    }}
                  />
                </button>
              ))}
            </div>
            
            <div className="px-4">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={selectedRating === 0}
                style={{
                  background: 'var(--dgp-accent-green)',
                  color: '#000',
                }}
              >
                Submit Rating
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const QuestIndexView: React.FC = () => {
  const navigate = useNavigate();
  const { courses, isLoading, totalPlayed, toggleWishlist } = useQuestCourses();
  const onboarding = useQuestOnboarding(totalPlayed);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [ratingCourse, setRatingCourse] = useState<QuestCourse | null>(null);

  // Track user interaction for idle hint
  const hasInteracted = useRef(false);
  const [showIdleHint, setShowIdleHint] = useState(false);

  // Show idle hint after 8 seconds if no interaction
  useEffect(() => {
    if (!onboarding.shouldShowIndexHint || hasInteracted.current) return;
    
    const timer = setTimeout(() => {
      if (!hasInteracted.current) {
        setShowIdleHint(true);
        toast('Mark a course played or add it to your wishlist', {
          duration: 4000,
          position: 'bottom-center',
          style: {
            background: 'rgba(11, 15, 13, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.8)',
          },
        });
        onboarding.markIndexHintSeen();
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [onboarding]);

  // Track any course interaction
  const handleInteraction = useCallback(() => {
    hasInteracted.current = true;
  }, []);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'played') {
      result = result.filter((c) => c.isPlayed);
    } else if (statusFilter === 'unplayed') {
      result = result.filter((c) => !c.isPlayed);
    } else if (statusFilter === 'wishlist') {
      result = result.filter((c) => c.isWishlist);
    }

    // Region filter
    if (regionFilter !== 'All Regions') {
      result = result.filter((c) => c.region === regionFilter);
    }

    // Sort
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    // 'recent' keeps original order (already sorted by date)

    return result;
  }, [courses, searchQuery, statusFilter, regionFilter, sortBy]);

  // Counts for filter pills
  const counts = useMemo(() => ({
    all: courses.length,
    played: courses.filter(c => c.isPlayed).length,
    unplayed: courses.filter(c => !c.isPlayed).length,
    wishlist: courses.filter(c => c.isWishlist).length,
  }), [courses]);

  const handleRate = useCallback((course: QuestCourse) => {
    handleInteraction();
    setRatingCourse(course);
  }, [handleInteraction]);

  // RATINGS-ONLY: Rating submission handled by modal, no separate markPlayed needed
  const handleCloseRatingModal = useCallback(() => {
    setRatingCourse(null);
  }, []);

  if (isLoading) {
    return (
      <PageRoot className="dgp-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--dgp-accent-gold)', borderTopColor: 'transparent' }}
          />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="dgp-page">
      {/* Header */}
      <div className="sticky top-0 z-50 safe-top" style={{ background: 'var(--dgp-bg-primary)' }}>
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="dgp-nav-button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              Quest Index
            </h1>
            <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
              {totalPlayed} of {courses.length} courses played
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--dgp-text-muted)' }}
            />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              style={{
                background: 'var(--dgp-glass-surface)',
                borderColor: 'var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterPill
            label="All"
            isActive={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            count={counts.all}
          />
          <FilterPill
            label="Played"
            isActive={statusFilter === 'played'}
            onClick={() => setStatusFilter('played')}
            count={counts.played}
          />
          <FilterPill
            label="Unplayed"
            isActive={statusFilter === 'unplayed'}
            onClick={() => setStatusFilter('unplayed')}
            count={counts.unplayed}
          />
          <FilterPill
            label="Wishlist"
            isActive={statusFilter === 'wishlist'}
            onClick={() => setStatusFilter('wishlist')}
            count={counts.wishlist}
          />
        </div>

        {/* Dropdowns */}
        <div className="px-4 pb-3 flex gap-2">
          {/* Region dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: 'var(--dgp-glass-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-secondary)',
              }}
            >
              {regionFilter}
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                background: 'var(--dgp-bg-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
              }}
            >
              {REGIONS.map((region) => (
                <DropdownMenuItem
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {region}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: 'var(--dgp-glass-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-secondary)',
              }}
            >
              {sortBy === 'recent' ? 'Recently Added' : sortBy === 'alphabetical' ? 'A-Z' : 'Highest Rated'}
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                background: 'var(--dgp-bg-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
              }}
            >
              <DropdownMenuItem
                onClick={() => setSortBy('recent')}
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('alphabetical')}
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                Alphabetical
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('rating')}
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                Highest Rated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Course list */}
      <div className="px-4 pb-32">
        <div className="dgp-glass rounded-xl p-4">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                onToggleWishlist={(id, wishlist) => {
                  handleInteraction();
                  toggleWishlist(id, wishlist);
                }}
                onRate={handleRate}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <p style={{ color: 'var(--dgp-text-muted)' }}>
                No courses found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rating sheet */}
      <RatingSheet
        course={ratingCourse}
        onClose={handleCloseRatingModal}
        onRate={handleCloseRatingModal}
      />
    </PageRoot>
  );
};

export default QuestIndexView;
