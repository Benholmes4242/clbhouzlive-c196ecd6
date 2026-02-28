/**
 * Step 4: Review & Submit (Confirmation)
 * Card-based sections with amber-tinted rating card, 2×2 mini cards for categories
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreTier } from '@/utils/getScoreTier';
import type { ReviewWizardCourse, ReviewBreakdowns, ReviewMediaItem, ReviewTaggableEntity } from '../types';

interface ConfirmStepProps {
  course: ReviewWizardCourse | null;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  selectedTags: ReviewTaggableEntity[];
  hasUploadsInProgress: boolean;
  isEditMode?: boolean;
  onGoToStep: (step: 1 | 2 | 3) => void;
}

const BREAKDOWN_LABELS: Record<keyof ReviewBreakdowns, string> = {
  design: 'Design',
  condition: 'Condition',
  clubhouse: 'Clubhouse',
  facilities: 'Facilities',
};

const staggerDelay = (i: number) => ({
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.08, type: "spring" as const, stiffness: 300, damping: 25 },
  },
});

export function ConfirmStep({
  course,
  rating,
  breakdowns,
  title,
  review,
  media,
  selectedTags,
  hasUploadsInProgress,
  isEditMode = false,
  onGoToStep,
}: ConfirmStepProps) {
  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;
  const totalMedia = imageCount + videoCount;
  const hasBreakdowns = Object.values(breakdowns).some(v => v !== null);
  const hasTags = selectedTags.length > 0;
  const hasReviewText = !!(title || review);
  const tierData = rating !== null ? getScoreTier(rating) : null;

  const mediaThumbnails = media.slice(0, 5);
  const remainingMedia = totalMedia - mediaThumbnails.length;

  let sectionIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="shrink-0 px-4 pt-4 pb-8 min-h-full"
      style={{ background: 'transparent' }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <p className="text-sm text-muted-foreground">Almost there</p>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {isEditMode ? 'Review your changes' : 'Review your verdict'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Course card */}
        {course && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="flex items-center gap-3 py-3"
          >
            {course.thumbnail_image && (
              <img src={course.thumbnail_image} alt={course.name} loading="eager" className="w-12 h-12 rounded-xl object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] text-foreground truncate">{course.name}</h3>
              {(course.sub_country || course.country) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[course.sub_country, course.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Overall rating card — amber-tinted */}
        {rating !== null && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
              border: '1.5px solid rgba(245,158,11,0.12)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Your rating</p>
              <button
                type="button"
                onClick={() => onGoToStep(1)}
                className="text-xs font-medium active:scale-[0.97] transition-all"
                style={{ color: '#f59e0b' }}
              >
                Edit
              </button>
            </div>
            <div className="text-center">
              <span className="text-4xl font-bold tabular-nums" style={{ color: tierData?.accent ?? '#f59e0b' }}>
                {rating.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground font-medium ml-1">/10</span>
              {tierData && (
                <p className="text-sm text-muted-foreground mt-1">{tierData.label}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Category ratings — 2×2 grid of mini cards */}
        {hasBreakdowns && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</p>
              <button
                type="button"
                onClick={() => onGoToStep(1)}
                className="text-xs font-medium active:scale-[0.97] transition-all"
                style={{ color: '#f59e0b' }}
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.entries(breakdowns) as [keyof ReviewBreakdowns, number | null][]).map(
                ([key, value]) =>
                  value !== null && (
                    <div
                      key={key}
                      className="rounded-xl p-3"
                      style={{ background: 'hsl(var(--muted) / 0.5)' }}
                    >
                      <p className="text-xs text-muted-foreground">{BREAKDOWN_LABELS[key]}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-lg font-bold tabular-nums"
                          style={{ color: getScoreTier(value).accent }}
                        >
                          {value.toFixed(1)}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${(value / 10) * 100}%`,
                              background: getScoreTier(value).accent,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
              )}
            </div>
          </motion.div>
        )}

        {/* Review text */}
        {hasReviewText && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="rounded-2xl p-4"
            style={{ background: 'hsl(var(--muted) / 0.5)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Review</p>
              <button
                type="button"
                onClick={() => onGoToStep(2)}
                className="text-xs font-medium active:scale-[0.97] transition-all"
                style={{ color: '#f59e0b' }}
              >
                Edit
              </button>
            </div>
            {title && <p className="font-semibold text-foreground text-[15px]">{title}</p>}
            {review && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{review}</p>}
          </motion.div>
        )}

        {/* Media */}
        {totalMedia > 0 && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Media</p>
              <button
                type="button"
                onClick={() => onGoToStep(3)}
                className="text-xs font-medium active:scale-[0.97] transition-all"
                style={{ color: '#f59e0b' }}
              >
                Edit
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {mediaThumbnails.map((item, idx) => (
                <div key={item.id} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: 'hsl(var(--muted))' }}>
                  <img src={item.previewUrl || item.posterUrl || ''} alt="" className="w-full h-full object-cover" />
                  {idx === mediaThumbnails.length - 1 && remainingMedia > 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">+{remainingMedia}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {imageCount > 0 && `${imageCount} photo${imageCount > 1 ? 's' : ''}`}
              {imageCount > 0 && videoCount > 0 && ', '}
              {videoCount > 0 && `${videoCount} video${videoCount > 1 ? 's' : ''}`}
            </p>
            {hasUploadsInProgress && (
              <div className="flex items-center gap-1 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#f59e0b' }} />
                <p className="text-[11px]" style={{ color: '#f59e0b' }}>Uploading…</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Review tags */}
        {hasTags && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="flex flex-wrap gap-1.5"
          >
            {selectedTags.map(tag => (
              <span key={tag.id || tag.username} className="text-[11px] rounded-full px-2.5 py-1" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                @{tag.username}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.p
        custom={sectionIndex}
        initial="hidden"
        animate="visible"
        variants={staggerDelay(sectionIndex++)}
        className="text-xs text-muted-foreground/60 text-center mt-6"
      >
        Your review helps fellow golfers discover great courses
      </motion.p>
    </motion.div>
  );
}
