import React from 'react';
import { cn } from '@/lib/utils';

export type VideoCategory = 'all' | 'funny' | 'challenges' | 'course-vlogs' | 'reviews' | 'tips' | 'tour-pro' | 'gear';

interface VideoFilterChipsProps {
  selected: VideoCategory;
  onSelect: (category: VideoCategory) => void;
  className?: string;
}

const FILTER_OPTIONS: { value: VideoCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'funny', label: 'Funny' },
  { value: 'challenges', label: 'Challenges' },
  { value: 'course-vlogs', label: 'Course Vlogs' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'tips', label: 'Tips' },
  { value: 'tour-pro', label: 'Tour / Pro' },
  { value: 'gear', label: 'Gear' },
];

/**
 * VideoFilterChips - Horizontal scrolling filter chips for Videos tab
 * Filters the feed by category/tag
 */
export const VideoFilterChips: React.FC<VideoFilterChipsProps> = ({
  selected,
  onSelect,
  className,
}) => {
  return (
    <div className={cn("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-2 px-5 pb-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              selected === option.value
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoFilterChips;
