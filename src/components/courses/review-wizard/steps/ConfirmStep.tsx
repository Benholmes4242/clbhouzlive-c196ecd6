/**
 * Step 4: Review & Submit (Confirmation)
 * A* Polish: text-contrast rating colors, media thumbnails, edit actions,
 * breakdown bars, review tags, staggered animations, amber accent strips
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Image as ImageIcon, Video, Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreTier, type ScoreTier } from '@/utils/getScoreTier';
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

/**
 * 2-tier rating text color: amber for Outstanding (9.0+), slate for everything else.
 */
function getRatingTextColor(score: number): string {
  return score >= 9.0 ? 'text-amber-500' : 'text-slate-600';
}

/** Fill color for breakdown bars: amber 9.0+, slate below */
function getRatingFillColor(score: number): string {
  return score >= 9.0 ? 'bg-amber-500' : 'bg-slate-400';
}

/** Whether score qualifies for Outstanding tier */
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

/** Small inline bar for breakdown scores — tier-aware fill */
function BreakdownBar({ value }: { value: number }) {
  const percent = (value / 10) * 100;
  const fillClass = getRatingFillColor(value);
  return (
    <div className="w-full h-1.5 rounded-full bg-muted/30 mt-1">
      <div
        className={cn("h-full rounded-full transition-all duration-300", fillClass)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Edit button positioned top-right of a card */
function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-2.5 right-2.5 flex items-center gap-1 text-primary text-[11px] font-medium hover:opacity-70 transition-opacity"
      aria-label={label}
    >
      <Pencil className="h-3 w-3" />
      Edit
    </button>
  );
}

// Card entrance animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.25, ease: [0, 0, 0.2, 1] as const },
  }),
};

const BREAKDOWN_LABELS: Record<keyof ReviewBreakdowns, string> = {
  design: 'Design',
  condition: 'Condition',
  clubhouse: 'Clubhouse',
  facilities: 'Facilities',
};

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

  // Build summary stats for bottom message
  const statParts: string[] = [];
  const breakdownCount = Object.values(breakdowns).filter(v => v !== null).length;
  if (breakdownCount > 0) statParts.push(`${breakdownCount} category rating${breakdownCount > 1 ? 's' : ''}`);
  if (totalMedia > 0) statParts.push(`${totalMedia} photo${totalMedia > 1 ? 's' : ''}`);
  if (hasReviewText) statParts.push('a written verdict');

  // Thumbnails for media preview (first 4)
  const mediaThumbnails = media.slice(0, 4);
  const remainingMedia = totalMedia - mediaThumbnails.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="shrink-0 px-4 pt-6 pb-8"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          {isEditMode ? 'Update Review' : 'Final Verdict'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode ? 'Review your changes' : 'Review your verdict'}
        </p>
      </div>

      {/* Content cards - staggered entrance */}
      <div className="space-y-3">
        {/* Course header - non-interactive context */}
        {course && (
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={cn("flex items-center gap-3 p-3 bg-card rounded-2xl border border-border/40 shadow-sm border-l-2", rating != null && rating >= 9.0 ? 'border-l-amber-400' : 'border-l-slate-300')}
          >
            {course.thumbnail_image && (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                loading="eager"
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{course.name}</h3>
              {(course.sub_country || course.country) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[course.sub_country, course.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Rating + Media Row */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex gap-3"
        >
          {/* Rating card - tap to edit */}
          <div className={cn("flex-1 p-3 bg-card rounded-2xl border border-border/40 shadow-sm border-l-2 relative", rating != null && rating >= 9.0 ? 'border-l-amber-400' : 'border-l-slate-300')}>
            <EditButton onClick={() => onGoToStep(1)} label="Edit rating" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Rating</p>
            {rating !== null ? (
              <RatingDisplay value={rating} size="lg" />
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </div>

          {/* Media card - tap to edit */}
          <div className={cn("min-w-[110px] flex-shrink-0 p-3 bg-card rounded-2xl border border-border/40 shadow-sm border-l-2 relative", rating != null && rating >= 9.0 ? 'border-l-amber-400' : 'border-l-slate-300')}>
            {totalMedia > 0 && (
              <EditButton onClick={() => onGoToStep(3)} label="Edit media" />
            )}
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Media</p>
            {totalMedia > 0 ? (
              <>
                {/* Thumbnail strip */}
                <div className="flex gap-1 mb-1.5">
                  {mediaThumbnails.map((item, idx) => (
                    <div key={item.id} className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.previewUrl || item.posterUrl || ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {/* +N badge on last thumbnail */}
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
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No photos</span>
            )}
            {hasUploadsInProgress && (
              <div className="flex items-center gap-1 mt-1">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <p className="text-[11px] text-primary">Uploading…</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Review text (if present) */}
        {hasReviewText && (
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={cn("p-3 bg-card rounded-2xl border border-border/40 shadow-sm border-l-2 space-y-1 relative", rating != null && rating >= 9.0 ? 'border-l-amber-400' : 'border-l-slate-300')}
          >
            <EditButton onClick={() => onGoToStep(2)} label="Edit review" />
            {title && (
              <h4 className="font-medium text-sm text-foreground pr-12">{title}</h4>
            )}
            {review && (
              <p className="text-xs text-muted-foreground line-clamp-3">{review}</p>
            )}
          </motion.div>
        )}

        {/* Breakdown ratings */}
        {hasBreakdowns && (
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={cn("p-3 bg-card rounded-2xl border border-border/40 shadow-sm border-l-2 relative", rating != null && rating >= 9.0 ? 'border-l-amber-400' : 'border-l-slate-300')}
          >
            <EditButton onClick={() => onGoToStep(1)} label="Edit detailed ratings" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2.5">Detailed Ratings</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {(Object.entries(breakdowns) as [keyof ReviewBreakdowns, number | null][]).map(
                ([key, value]) =>
                  value !== null && (
                    <div key={key}>
                      <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground text-xs">{BREAKDOWN_LABELS[key]}</span>
                        <span className={cn(
                          "font-semibold tabular-nums text-sm",
                          getRatingTextColor(value)
                        )}>
                          {value.toFixed(1)}
                        </span>
                      </div>
                      <BreakdownBar value={value} />
                    </div>
                  )
              )}
            </div>
          </motion.div>
        )}

        {/* Review tags */}
        {hasTags && (
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="flex flex-wrap gap-1.5"
          >
            {selectedTags.map(tag => (
              <span
                key={tag.id || tag.username}
                className="bg-muted/30 text-muted-foreground text-[11px] rounded-full px-2.5 py-1"
              >
                @{tag.username}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Review completeness summary */}
      {statParts.length > 0 && (
        <motion.p
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="text-[12px] text-muted-foreground/50 text-center mt-6"
        >
          Your review includes {statParts.join(', ')}
        </motion.p>
      )}

      {/* Motivational prompt */}
      <motion.p
        custom={6}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="text-[12px] text-muted-foreground/50 text-center mt-2"
      >
        Your review helps fellow golfers discover great courses
      </motion.p>
    </motion.div>
  );
}