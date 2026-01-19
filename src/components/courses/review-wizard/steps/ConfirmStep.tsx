/**
 * Step 4: Review & Submit (Confirmation)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ReviewWizardCourse, ReviewBreakdowns, ReviewMediaItem } from '../types';

interface ConfirmStepProps {
  course: ReviewWizardCourse | null;
  rating: number | null;
  breakdowns: ReviewBreakdowns;
  title: string;
  review: string;
  media: ReviewMediaItem[];
  addToTop10: boolean;
  top10Position: number | null;
  hasUploadsInProgress: boolean;
  onTop10Change: (add: boolean, position: number | null) => void;
}

export function ConfirmStep({
  course,
  rating,
  breakdowns,
  title,
  review,
  media,
  addToTop10,
  top10Position,
  hasUploadsInProgress,
  onTop10Change,
}: ConfirmStepProps) {
  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;
  const hasBreakdowns = Object.values(breakdowns).some(v => v !== null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 p-4"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Review your submission
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Make sure everything looks good before submitting
        </p>
      </div>

      {/* Course header */}
      {course && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          {course.thumbnail_image && (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{course.name}</h3>
            {(course.sub_country || course.country) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[course.sub_country, course.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Rating */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  rating && star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted"
                )}
              />
            ))}
          </div>
        </div>

        {/* Media */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Media</p>
          <div className="flex items-center gap-3 text-sm">
            {imageCount > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                {imageCount}
              </span>
            )}
            {videoCount > 0 && (
              <span className="flex items-center gap-1">
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
        </div>
      </div>

      {/* Review preview */}
      {(title || review) && (
        <div className="p-4 bg-muted/30 rounded-xl space-y-2">
          {title && (
            <h4 className="font-medium text-foreground">{title}</h4>
          )}
          {review && (
            <p className="text-sm text-muted-foreground line-clamp-3">{review}</p>
          )}
        </div>
      )}

      {/* Breakdowns */}
      {hasBreakdowns && (
        <div className="p-4 bg-muted/30 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Detailed Ratings</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {breakdowns.design !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Design</span>
                <span className="font-medium">{breakdowns.design}/5</span>
              </div>
            )}
            {breakdowns.condition !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Condition</span>
                <span className="font-medium">{breakdowns.condition}/5</span>
              </div>
            )}
            {breakdowns.clubhouse !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clubhouse</span>
                <span className="font-medium">{breakdowns.clubhouse}/5</span>
              </div>
            )}
            {breakdowns.facilities !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facilities</span>
                <span className="font-medium">{breakdowns.facilities}/5</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top 10 option */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Add to your Top 10?</p>
            <p className="text-xs text-muted-foreground">Showcase your favorite courses</p>
          </div>
          <Switch
            checked={addToTop10}
            onCheckedChange={(checked) => onTop10Change(checked, checked ? 10 : null)}
          />
        </div>

        {addToTop10 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Select
              value={top10Position?.toString() || ''}
              onValueChange={(value) => onTop10Change(true, parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => (
                  <SelectItem key={pos} value={pos.toString()}>
                    #{pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
