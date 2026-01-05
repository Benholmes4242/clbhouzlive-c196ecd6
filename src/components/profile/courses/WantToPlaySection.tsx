/**
 * WantToPlaySection - Aspirational planning surface for courses
 * 
 * This replaces the Journey tab functionality while preserving its value.
 * Shows courses the user wants to play - aspirational, social, planning-driven.
 * 
 * Key rules:
 * - A course can ONLY be in one state: played OR want_to_play OR neither
 * - "Played" = has course_ratings row with rating > 0
 * - NO "Played" badges shown here
 * - NO ratings shown here (this is planning, not history)
 * - "Rate this course" navigates to rating page (no DB write here)
 * 
 * Pagination: Shows 5 courses at a time with sliding animation
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Trophy, X, Calendar, ChevronRight, ChevronLeft, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUserWantToPlay, WantToPlayCourse } from '@/hooks/useUserWantToPlay';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface WantToPlaySectionProps {
  userId: string;
  isOwnProfile: boolean;
  className?: string;
}

interface WantToPlayCardProps {
  course: WantToPlayCourse;
  isOwnProfile: boolean;
  onRate: () => void;
  onRemove: () => void;
  onClick: () => void;
}

const PAGE_SIZE = 5;

const WantToPlayCard: React.FC<WantToPlayCardProps> = ({
  course,
  isOwnProfile,
  onRate,
  onRemove,
  onClick,
}) => {
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  const addedAgo = formatDistanceToNow(new Date(course.added_at), { addSuffix: true });

  const handleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRate();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "bg-card border border-border/40 rounded-xl overflow-hidden cursor-pointer",
        "hover:border-border/60 transition-all group"
      )}
    >
      <div className="flex">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.course_name}
              className="w-20 h-20 object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-20 h-20 bg-muted flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Top 100 indicator */}
          {isTop100 && (
            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-amber-500/90 flex items-center justify-center">
              <Trophy className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {course.course_name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {course.sub_country || course.country}
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Added {addedAgo}
            </span>
          </div>
        </div>

        {/* Actions (self view only) - Rate and Remove only, no star */}
        {isOwnProfile && (
          <div className="flex items-center gap-1.5 px-2">
            <button
              onClick={handleRate}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-[10px] font-medium text-primary"
              title="Rate this course"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemove}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              title="Remove"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const WantToPlaySection: React.FC<WantToPlaySectionProps> = ({
  userId,
  isOwnProfile,
  className,
}) => {
  const navigate = useNavigate();
  const { wantToPlay, isLoading, remove } = useUserWantToPlay(userId);
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const totalPages = Math.ceil(wantToPlay.length / PAGE_SIZE);
  const currentPageCourses = wantToPlay.slice(
    pageIndex * PAGE_SIZE,
    (pageIndex + 1) * PAGE_SIZE
  );
  const hasNextPage = pageIndex < totalPages - 1;
  const hasPrevPage = pageIndex > 0;
  const remainingCount = Math.min(PAGE_SIZE, wantToPlay.length - (pageIndex + 1) * PAGE_SIZE);

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleRate = (course: WantToPlayCourse) => {
    navigate(`/courses/${course.course_id}/rate`);
  };

  const handleRemove = (course: WantToPlayCourse) => {
    remove(course.course_id);
    toast.success(`Removed from Want to Play`);
  };

  const goToNextPage = useCallback(() => {
    if (hasNextPage) {
      setDirection(1);
      setPageIndex(prev => prev + 1);
    }
  }, [hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (hasPrevPage) {
      setDirection(-1);
      setPageIndex(prev => prev - 1);
    }
  }, [hasPrevPage]);

  if (isLoading) {
    return (
      <div className={cn("py-4", className)}>
        <div className="h-5 w-32 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (wantToPlay.length === 0) {
    return (
      <section className={cn("py-4", className)}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-semibold text-foreground">Want to Play</h3>
        </div>
        
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Bookmark className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isOwnProfile 
              ? "Save courses you want to play to build your bucket list."
              : "No courses on the bucket list yet."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("py-4", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-base font-semibold text-foreground">Want to Play</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {wantToPlay.length} {wantToPlay.length === 1 ? 'course' : 'courses'} on the bucket list
          </p>
        </div>
      </div>

      {/* Course list with slide animation */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={pageIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-2"
          >
            {currentPageCourses.map((course) => (
              <WantToPlayCard
                key={course.id}
                course={course}
                isOwnProfile={isOwnProfile}
                onRate={() => handleRate(course)}
                onRemove={() => handleRemove(course)}
                onClick={() => handleCourseClick(course.course_id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          {/* Previous button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={!hasPrevPage}
            className="h-8 w-8 p-0 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Page indicator */}
          <span className="text-xs text-muted-foreground">
            {pageIndex + 1} of {totalPages}
          </span>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!hasNextPage}
            className="h-8 px-3 gap-1 rounded-full"
          >
            {hasNextPage ? (
              <>
                Next {remainingCount}
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
};