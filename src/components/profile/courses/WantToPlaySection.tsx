/**
 * WantToPlaySection - Aspirational planning surface for courses
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
  onReview: () => void;
  onRemove: () => void;
  onClick: () => void;
}

const BATCH_SIZE = 5;

const WantToPlayCard: React.FC<WantToPlayCardProps> = ({
  course,
  isOwnProfile,
  onReview,
  onRemove,
  onClick,
}) => {
  const isTop100 = !!(course.global_rank || course.regional_rank || course.usa_rank);
  const addedAgo = formatDistanceToNow(new Date(course.added_at), { addSuffix: true });

  const handleReview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReview();
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
      className="rounded-xl overflow-hidden cursor-pointer transition-all group"
      style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
    >
      <div className="flex">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 self-stretch">
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.course_name}
              loading="lazy"
              decoding="async"
              className="w-20 h-full object-cover rounded-l-xl transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-20 h-full flex items-center justify-center rounded-l-xl" style={{ background: 'rgba(15,23,42,0.06)' }}>
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          
          {isTop100 && (
            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#F7931E' }}>
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

        {/* Actions */}
        {isOwnProfile && (
          <div className="flex items-center gap-1.5 px-2">
            <button
              onClick={handleReview}
              className="text-[11px] font-semibold px-2.5 rounded-lg transition-colors min-h-[44px] active:scale-[0.97]"
              style={{ background: 'rgba(247,147,30,0.10)', color: '#F7931E' }}
              title="Review this course"
            >
              Review
            </button>
            <button
              onClick={handleRemove}
              className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center transition-colors active:scale-[0.95]"
              style={{ background: 'rgba(15,23,42,0.05)' }}
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

  const handleReview = (course: WantToPlayCourse) => {
    navigate(`/courses/${course.course_id}/rate`);
  };

  const handleRemove = (course: WantToPlayCourse) => {
    remove(course.course_id);
    toast.success(`Removed from bucket list`);
  };

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
      <div className={cn("", className)}>
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
      <section className={cn("", className)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Bucket List</span>
            </div>
            <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900 }}>
              Courses to Play
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              0 courses on the bucket list
            </p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
              <Bookmark className="w-6 h-6 text-muted-foreground" />
            </div>
            
            <h3 className="text-base font-semibold text-foreground mb-1">
              {isOwnProfile ? "Start Your Bucket List" : "No Courses Saved"}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {isOwnProfile 
                ? "Save courses you want to play to build your bucket list"
                : "No courses on the bucket list yet."}
            </p>
            
            {isOwnProfile && (
              <button
                onClick={() => navigate('/courses')}
                className="px-5 py-2.5 text-sm font-semibold rounded-full transition-colors min-h-[44px] active:scale-[0.97]"
                style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
              >
                Explore Courses
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

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
    <section className={cn("", className)}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Bucket List</span>
          </div>
          <h2 className="text-[17px] text-foreground" style={{ fontWeight: 900 }}>
            Courses to Play
          </h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {totalCourses} {totalCourses === 1 ? 'course' : 'courses'} on the bucket list
          </p>
        </div>
        {totalBatches > 1 && (
          <span className="text-xs text-muted-foreground">
            {startIndex + 1}–{endIndex} of {totalCourses}
          </span>
        )}
      </div>

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
                onReview={() => handleReview(course)}
                onRemove={() => handleRemove(course)}
                onClick={() => handleCourseClick(course.course_id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Batch navigation */}
      {totalBatches > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            onClick={handlePrevBatch}
            disabled={!hasPrevBatch}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-colors',
              !hasPrevBatch
                ? 'cursor-not-allowed'
                : 'active:scale-[0.95]'
            )}
            style={{
              background: 'rgba(15,23,42,0.05)',
              border: '1px solid rgba(15,23,42,0.07)',
              color: !hasPrevBatch ? 'rgba(15,23,42,0.20)' : '#64748B',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalBatches }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > batchIndex ? 'right' : 'left');
                  setBatchIndex(idx);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  idx === batchIndex ? 'w-5' : 'w-1.5'
                )}
                style={{ backgroundColor: idx === batchIndex ? '#0F172A' : 'rgba(15,23,42,0.20)' }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNextBatch}
            disabled={!hasNextBatch}
            className={cn(
              'min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-colors',
              !hasNextBatch
                ? 'cursor-not-allowed'
                : 'active:scale-[0.95]'
            )}
            style={{
              background: 'rgba(15,23,42,0.05)',
              border: '1px solid rgba(15,23,42,0.07)',
              color: !hasNextBatch ? 'rgba(15,23,42,0.20)' : '#64748B',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
