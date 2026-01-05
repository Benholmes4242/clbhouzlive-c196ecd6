/**
 * WantToPlaySection - Aspirational planning surface for courses
 * 
 * Refined per design brief:
 * - Removed star icon
 * - Shows 5 courses at a time with "Next 5" batch navigation
 * - Actions: Rate (navigates to rating flow), Remove
 * - Slides left/right for batch transitions
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Trophy, X, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
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

const BATCH_SIZE = 5;

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
              className="text-[11px] font-medium px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
              title="Rate this course"
            >
              Rate
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
  const [batchIndex, setBatchIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

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

  // Calculate batch navigation
  const totalCourses = wantToPlay.length;
  const totalBatches = Math.ceil(totalCourses / BATCH_SIZE);
  const startIndex = batchIndex * BATCH_SIZE;
  const endIndex = Math.min(startIndex + BATCH_SIZE, totalCourses);
  const currentBatch = wantToPlay.slice(startIndex, endIndex);
  const hasNextBatch = batchIndex < totalBatches - 1;
  const hasPrevBatch = batchIndex > 0;
  const nextBatchCount = Math.min(BATCH_SIZE, totalCourses - endIndex);

  const handleNextBatch = () => {
    if (hasNextBatch) {
      setDirection('right');
      setBatchIndex(prev => prev + 1);
    }
  };

  const handlePrevBatch = () => {
    if (hasPrevBatch) {
      setDirection('left');
      setBatchIndex(prev => prev - 1);
    }
  };

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

  // Animation variants for batch transitions
  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <section className={cn("py-4", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-base font-semibold text-foreground">Want to Play</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCourses} {totalCourses === 1 ? 'course' : 'courses'} on the bucket list
          </p>
        </div>
        {/* Batch indicator for multiple batches */}
        {totalBatches > 1 && (
          <span className="text-xs text-muted-foreground">
            {startIndex + 1}–{endIndex} of {totalCourses}
          </span>
        )}
      </div>

      {/* Course list with batch animation */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={batchIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-2"
          >
            {currentBatch.map((course) => (
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

      {/* Batch navigation */}
      {totalBatches > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          {hasPrevBatch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevBatch}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous 5
            </Button>
          )}
          {hasNextBatch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextBatch}
              className="gap-1 text-xs"
            >
              Next {nextBatchCount} →
            </Button>
          )}
        </div>
      )}
    </section>
  );
};
