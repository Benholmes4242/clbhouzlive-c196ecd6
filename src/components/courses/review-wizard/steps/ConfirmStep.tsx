/**
 * Step 4: Review & Submit (Confirmation)
 * Card-free layout with amber dividers, section labels + Edit links on background
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Pencil, Loader2, Sparkles } from 'lucide-react';
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

function getRatingTextColor(score: number): string {
  return score >= 9.0 ? 'text-amber-500' : 'text-foreground/60';
}

function isOutstandingScore(score: number): boolean {
  return score >= 9.0;
}

function RatingDisplay({ value, size = 'lg' }: { value: number; size?: 'sm' | 'lg' }) {
  const tier = getScoreTier(value);
  const textColor = getRatingTextColor(value);
  const outstanding = isOutstandingScore(value);

  return (
    <div className="flex items-baseline gap-1">
      <span
        className={cn(
          "font-bold tabular-nums",
          size === 'lg' ? "text-2xl" : "text-base",
          !outstanding && textColor
        )}
        style={
          outstanding
            ? {
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
            : undefined
        }
      >
        {value.toFixed(1)}
      </span>
      <span className={cn(
        "text-muted-foreground",
        size === 'lg' ? "text-sm" : "text-[10px]"
      )}>
        /10
      </span>
      {size === 'lg' && (
        <span
          className={cn(
            "ml-1 text-sm font-medium uppercase tracking-wide",
            !outstanding && textColor
          )}
          style={
            outstanding
              ? {
                  background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }
              : undefined
          }
        >
          {tier.label}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ label, onEdit, editLabel }: { label: string; onEdit: () => void; editLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:opacity-70 transition-opacity active:scale-[0.97]"
        aria-label={editLabel}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}

/** Section divider */
function SectionDivider() {
  return <div className="h-px bg-border" />;
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

  const statParts: string[] = [];
  const breakdownCount = Object.values(breakdowns).filter(v => v !== null).length;
  if (breakdownCount > 0) statParts.push(`${breakdownCount} category rating${breakdownCount > 1 ? 's' : ''}`);
  if (totalMedia > 0) statParts.push(`${totalMedia} photo${totalMedia > 1 ? 's' : ''}`);
  if (hasReviewText) statParts.push('a written verdict');

  const mediaThumbnails = media.slice(0, 4);
  const remainingMedia = totalMedia - mediaThumbnails.length;

  let sectionIndex = 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="shrink-0 px-4 pt-6 pb-8 min-h-full"
      style={{ background: 'transparent' }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-primary">Looking good</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {isEditMode ? 'Review your changes' : 'Review your verdict'}
        </h2>
      </div>

      {/* Content sections — card-free, on background with dividers */}
      <div>
        {/* Course summary row */}
        {course && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="flex items-center gap-3 py-3"
          >
            {course.thumbnail_image && (
              <img src={course.thumbnail_image} alt={course.name} loading="eager" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{course.name}</h3>
              {(course.sub_country || course.country) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {[course.sub_country, course.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        <SectionDivider />

        {/* Rating summary */}
        <motion.div
          custom={sectionIndex}
          initial="hidden"
          animate="visible"
          variants={staggerDelay(sectionIndex++)}
          className="py-4"
        >
          <SectionHeader label="Your Rating" onEdit={() => onGoToStep(1)} editLabel="Edit rating" />
          {rating !== null ? (
            <RatingDisplay value={rating} size="lg" />
          ) : (
            <span className="text-muted-foreground">Not set</span>
          )}
        </motion.div>

        <SectionDivider />

        {/* Media summary */}
        {totalMedia > 0 && (
          <>
            <motion.div
              custom={sectionIndex}
              initial="hidden"
              animate="visible"
              variants={staggerDelay(sectionIndex++)}
              className="py-4"
            >
              <SectionHeader label="Media" onEdit={() => onGoToStep(3)} editLabel="Edit media" />
              <div className="flex gap-1 mb-1.5">
                {mediaThumbnails.map((item, idx) => (
                  <div key={item.id} className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={item.previewUrl || item.posterUrl || ''} alt="" className="w-full h-full object-cover" />
                    {idx === mediaThumbnails.length - 1 && remainingMedia > 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-[11px] font-semibold">+{remainingMedia}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {imageCount > 0 && `${imageCount} photo${imageCount > 1 ? 's' : ''}`}
                {imageCount > 0 && videoCount > 0 && ', '}
                {videoCount > 0 && `${videoCount} video${videoCount > 1 ? 's' : ''}`}
              </p>
              {hasUploadsInProgress && (
                <div className="flex items-center gap-1 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <p className="text-[11px] text-primary">Uploading…</p>
                </div>
              )}
            </motion.div>

            <SectionDivider />
          </>
        )}

        {/* Review text */}
        {hasReviewText && (
          <>
            <motion.div
              custom={sectionIndex}
              initial="hidden"
              animate="visible"
              variants={staggerDelay(sectionIndex++)}
              className="py-4"
            >
              <SectionHeader label="Review" onEdit={() => onGoToStep(2)} editLabel="Edit review" />
              {title && <h4 className="font-medium text-sm text-foreground">{title}</h4>}
              {review && <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">{review}</p>}
            </motion.div>

            <SectionDivider />
          </>
        )}

        {/* Breakdown ratings */}
        {hasBreakdowns && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="py-4"
          >
            <SectionHeader label="Detailed Ratings" onEdit={() => onGoToStep(1)} editLabel="Edit detailed ratings" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {(Object.entries(breakdowns) as [keyof ReviewBreakdowns, number | null][]).map(
                ([key, value]) =>
                  value !== null && (
                    <div key={key}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground text-xs">{BREAKDOWN_LABELS[key]}</span>
                        <span className={cn("font-semibold tabular-nums text-sm", getRatingTextColor(value))}>
                          {value.toFixed(1)}
                        </span>
                      </div>
                      {/* Mini track bar */}
                      <div className="w-full h-1.5 rounded-full mt-1 bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(value / 10) * 100}%`,
                            background: value >= 9 ? 'linear-gradient(to right, #F59E0B, #D97706)' : 'hsl(var(--primary))',
                          }}
                        />
                      </div>
                    </div>
                  )
              )}
            </div>
          </motion.div>
        )}

        {/* Review tags */}
        {hasTags && (
          <motion.div
            custom={sectionIndex}
            initial="hidden"
            animate="visible"
            variants={staggerDelay(sectionIndex++)}
            className="flex flex-wrap gap-1.5 py-3"
          >
            {selectedTags.map(tag => (
              <span key={tag.id || tag.username} className="bg-muted text-muted-foreground text-[11px] rounded-full px-2.5 py-1">
                @{tag.username}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Summary */}
      {statParts.length > 0 && (
        <motion.p
          custom={sectionIndex}
          initial="hidden"
          animate="visible"
          variants={staggerDelay(sectionIndex++)}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          Your review includes {statParts.join(', ')}
        </motion.p>
      )}
      <motion.p
        custom={sectionIndex}
        initial="hidden"
        animate="visible"
        variants={staggerDelay(sectionIndex++)}
        className="text-xs text-muted-foreground/60 text-center mt-2"
      >
        Your review helps fellow golfers discover great courses
      </motion.p>
    </motion.div>
  );
}
