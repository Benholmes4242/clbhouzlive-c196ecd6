import React from 'react';
import { Plus } from 'lucide-react';

interface CourseMediaSummaryCardProps {
  photoCount: number;
  videoCount: number;
  contributorsCount?: number;
  contributors?: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  courseName?: string;
  onAddMedia?: () => void;
}

export const CourseMediaSummaryCard: React.FC<CourseMediaSummaryCardProps> = ({
  photoCount,
  videoCount,
  contributorsCount = 0,
  courseName,
  onAddMedia,
}) => {
  return (
    <section className="px-4 pt-6">
      {/* Header row with title + Add media CTA */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          {/* Heading with amber accent bar — matches About tab SectionHeading */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-gradient-to-r from-amber-400 to-transparent" />
            <h2 className="text-[22px] font-bold tracking-[-0.3px] text-foreground">Course Media</h2>
          </div>

          {/* Counts */}
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{photoCount}</span>
            {' '}{photoCount === 1 ? 'photo' : 'photos'}
            {' · '}
            <span className="font-semibold text-foreground tabular-nums">{videoCount}</span>
            {' '}{videoCount === 1 ? 'video' : 'videos'}
          </p>

          {/* Contributors */}
          {contributorsCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Shared by {contributorsCount} {contributorsCount === 1 ? 'golfer' : 'golfers'}
            </p>
          )}
        </div>

        {/* Add media CTA - primary button style */}
        {onAddMedia && (
          <button
            type="button"
            onClick={onAddMedia}
            className="flex items-center gap-2 px-4 py-2 bg-background text-foreground text-sm font-medium rounded-full hover:bg-background/80 transition-colors shadow-sm ring-1 ring-border active:scale-[0.97] min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Add media
          </button>
        )}
      </div>
    </section>
  );
};