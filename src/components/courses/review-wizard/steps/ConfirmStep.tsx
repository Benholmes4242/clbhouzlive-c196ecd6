/**
 * Step 4: Review & Submit (Confirmation)
 * Shows numeric rating with /10 scale and tier color
 * Uses semantic tokens for typography
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreTier } from '@/utils/getScoreTier';
import type { ReviewWizardCourse, ReviewBreakdowns, ReviewMediaItem } from '../types';

interface ConfirmStepProps {
  course: ReviewWizardCourse | null;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  hasUploadsInProgress: boolean;
}

/**
 * Get color for a rating value based on tier
 * NEW: Fair → Excellent use Gray, Outstanding uses Amber gradient
 */
function getRatingColor(value: number): { color: string; isGradient: boolean; gradientEnd?: string } {
  const tier = getScoreTier(value);
  if (tier.tier === 'outstanding') {
    return { color: '#f59e0b', isGradient: true, gradientEnd: '#fbbf24' };
  }
  // All other tiers use Gray
  return { color: '#d1d5db', isGradient: false };
}

function RatingDisplay({ value, size = 'lg' }: { value: number; size?: 'sm' | 'lg' }) {
  const { color, isGradient } = getRatingColor(value);
  const tier = getScoreTier(value);
  
  return (
    <div className="flex items-baseline gap-1">
      <span 
        className={cn(
          "font-bold tabular-nums",
          size === 'lg' ? "text-2xl" : "text-lg"
        )}
        style={
          isGradient
            ? {
                background: color,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
            : { color }
        }
      >
        {value.toFixed(1)}
      </span>
      <span className={cn(
        "text-muted-foreground",
        size === 'lg' ? "text-sm" : "text-xs"
      )}>
        /10
      </span>
      {size === 'lg' && (
        <span 
          className="ml-1 text-sm font-medium uppercase tracking-wide"
          style={
            isGradient
              ? {
                  background: color,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }
              : { color }
          }
        >
          {tier.label}
        </span>
      )}
    </div>
  );
}

export function ConfirmStep({
  course,
  rating,
  breakdowns,
  title,
  review,
  media,
  hasUploadsInProgress,
}: ConfirmStepProps) {
  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;
  const hasBreakdowns = Object.values(breakdowns).some(v => v !== null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="shrink-0 px-4 pt-6"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Final Verdict
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything ready to go?
        </p>
      </div>

      {/* Content cards - natural spacing */}
      <div className="space-y-3">
        {/* Course header - compact */}
        {course && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-border/40 shadow-sm">
            {course.thumbnail_image && (
              <img
                src={course.thumbnail_image}
                alt={course.name}
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
          </div>
        )}

        {/* Rating + Media Row */}
        <div className="flex gap-3">
          <div className="flex-1 p-3 bg-white rounded-2xl border border-border/40 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Rating</p>
            {rating !== null ? (
              <RatingDisplay value={rating} size="lg" />
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </div>

          <div className="min-w-[96px] flex-shrink-0 p-3 bg-white rounded-2xl border border-border/40 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Media</p>
            <div className="flex items-center gap-2 text-sm">
              {imageCount > 0 && (
                <span className="flex items-center gap-1 text-foreground">
                  <ImageIcon className="h-4 w-4" />
                  {imageCount}
                </span>
              )}
              {videoCount > 0 && (
                <span className="flex items-center gap-1 text-foreground">
                  <Video className="h-4 w-4" />
                  {videoCount}
                </span>
              )}
              {imageCount === 0 && videoCount === 0 && (
                <span className="text-muted-foreground">None</span>
              )}
              {hasUploadsInProgress && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            {hasUploadsInProgress && (
              <p className="text-xs text-primary mt-1">
                Still uploading — you can submit now
              </p>
            )}
          </div>
        </div>

        {/* Review text (if present) */}
        {(title || review) && (
          <div className="p-3 bg-white rounded-2xl border border-border/40 shadow-sm space-y-1">
            {title && (
              <h4 className="font-medium text-sm text-foreground">{title}</h4>
            )}
            {review && (
              <p className="text-xs text-muted-foreground line-clamp-2">{review}</p>
            )}
          </div>
        )}

        {/* Detailed ratings (if present) */}
        {hasBreakdowns && (
          <div className="p-3 bg-white rounded-2xl border border-border/40 shadow-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Detailed Ratings</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {breakdowns.design !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Design</span>
                  <RatingDisplay value={breakdowns.design} size="sm" />
                </div>
              )}
              {breakdowns.condition !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Condition</span>
                  <RatingDisplay value={breakdowns.condition} size="sm" />
                </div>
              )}
              {breakdowns.clubhouse !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Clubhouse</span>
                  <RatingDisplay value={breakdowns.clubhouse} size="sm" />
                </div>
              )}
              {breakdowns.facilities !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Facilities</span>
                  <RatingDisplay value={breakdowns.facilities} size="sm" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
