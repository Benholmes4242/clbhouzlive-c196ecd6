import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type VideoCategory = 'all' | 'funny' | 'challenge' | 'course-vlog' | 'tips-coaching' | 'review' | 'other';

interface VideoFilterChipsProps {
  selected: VideoCategory;
  onSelect: (category: VideoCategory) => void;
  className?: string;
}

const FILTER_OPTIONS: { value: VideoCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'funny', label: 'Funny' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'course-vlog', label: 'Course Vlog' },
  { value: 'tips-coaching', label: 'Tips & Coaching' },
  { value: 'review', label: 'Review' },
  { value: 'other', label: 'Other' },
];

/**
 * VideoFilterChips - Functional filter pills for Videos tab
 * Filters by primary_category, single-select, exclusive
 * Selected = filled grey, Unselected = outlined grey (no orange)
 */
export const VideoFilterChips: React.FC<VideoFilterChipsProps> = ({
  selected,
  onSelect,
  className,
}) => {
  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-2 px-5 pb-2">
        {FILTER_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <motion.button
              key={option.value}
              onClick={() => onSelect(option.value)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.1 }}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                isSelected
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground border border-border/60 hover:bg-muted/40 hover:text-foreground"
              )}
            >
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default VideoFilterChips;
