/**
 * Step 4: Review & Submit (Confirmation)
 * Shows numeric rating with /10 scale and tier color
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
 * NEW: Fair → Excellent use slate, Outstanding uses gold gradient
 */
function getRatingColor(value: number): { color: string; isGradient: boolean } {
  const tier = getScoreTier(value);
  if (tier.tier === 'outstanding') {
    return { color: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', isGradient: true };
  }
  // All other tiers use slate
  return { color: '#64748b', isGradient: false };
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
        "text-[#64748b]",
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
      className="shrink-0 px-4"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg font-semibold text-[#1e293b]">
          Review your submission
        </h2>
        <p className="text-sm text-[#64748b]">
          Make sure everything looks good
        </p>
      </div>

      {/* Content cards - natural spacing */}
      <div className="space-y-3">
        {/* Course header - compact */}
        {course && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            {course.thumbnail_image && (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[#1e293b] truncate">{course.name}</h3>
              {(course.sub_country || course.country) && (
                <p className="text-xs text-[#64748b] flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[course.sub_country, course.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rating + Media Row */}
        <div className="flex gap-3">
          <div className="flex-1 p-3 bg-white rounded-xl">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">Your Rating</p>
            {rating !== null ? (
              <RatingDisplay value={rating} size="lg" />
            ) : (
              <span className="text-[#64748b]">Not set</span>
            )}
          </div>

          <div className="w-24 p-3 bg-white rounded-xl">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wide mb-1">Media</p>
            <div className="flex items-center gap-2 text-sm">
              {imageCount > 0 && (
                <span className="flex items-center gap-1 text-[#1e293b]">
                  <ImageIcon className="h-4 w-4" />
                  {imageCount}
                </span>
              )}
              {videoCount > 0 && (
                <span className="flex items-center gap-1 text-[#1e293b]">
                  <Video className="h-4 w-4" />
                  {videoCount}
                </span>
              )}
              {imageCount === 0 && videoCount === 0 && (
                <span className="text-[#64748b]">None</span>
              )}
              {hasUploadsInProgress && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            {hasUploadsInProgress && (
              <p className="text-[10px] text-primary mt-1">
                Still uploading — you can submit now
              </p>
            )}
          </div>
        </div>

        {/* Review text (if present) */}
        {(title || review) && (
          <div className="p-3 bg-white rounded-xl space-y-1">
            {title && (
              <h4 className="font-medium text-sm text-[#1e293b]">{title}</h4>
            )}
            {review && (
              <p className="text-xs text-[#64748b] line-clamp-2">{review}</p>
            )}
          </div>
        )}

        {/* Detailed ratings (if present) */}
        {hasBreakdowns && (
          <div className="p-3 bg-white rounded-xl">
            <p className="text-[10px] text-[#64748b] uppercase tracking-wide mb-2">Detailed Ratings</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {breakdowns.design !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Design</span>
                  <RatingDisplay value={breakdowns.design} size="sm" />
                </div>
              )}
              {breakdowns.condition !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Condition</span>
                  <RatingDisplay value={breakdowns.condition} size="sm" />
                </div>
              )}
              {breakdowns.clubhouse !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Clubhouse</span>
                  <RatingDisplay value={breakdowns.clubhouse} size="sm" />
                </div>
              )}
              {breakdowns.facilities !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Facilities</span>
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
