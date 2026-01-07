import React from 'react';
import { Camera, Plus } from 'lucide-react';

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
  // This component only renders when there IS media (empty state handled by parent)
  return (
    <section className="px-4 pt-6">
      {/* Header row with title + Add media CTA */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          {/* Title */}
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Course media
          </p>

          {/* Counts - 8px below title */}
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
            {' · '}
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </p>

          {/* Contributors - 8px below counts */}
          {contributorsCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Shared by {contributorsCount} {contributorsCount === 1 ? 'golfer' : 'golfers'}
            </p>
          )}
        </div>

        {/* Add media CTA (right side) */}
        {onAddMedia && (
          <button
            type="button"
            onClick={onAddMedia}
            className="flex items-center gap-1.5 rounded-sq-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-slate-50 active:scale-[0.97] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add media
          </button>
        )}
      </div>
    </section>
  );
};
