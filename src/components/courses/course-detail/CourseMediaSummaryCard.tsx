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
  const hasMedia = photoCount > 0 || videoCount > 0;

  // Empty state
  if (!hasMedia) {
    return (
      <section className="px-4 pt-6 pb-6">
        <div className="rounded-sq-lg border border-border/60 bg-card px-4 py-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Camera className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No media yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be the first to share photos or videos of {courseName || 'this course'}.
          </p>
          {onAddMedia && (
            <button
              type="button"
              onClick={onAddMedia}
              className="mt-4 inline-flex items-center gap-1.5 rounded-sq-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              Add a photo or video
            </button>
          )}
        </div>
      </section>
    );
  }

  // Structured header when there is media
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
          <p className="text-sm font-medium text-foreground tabular-nums">
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
            className="flex items-center gap-1.5 rounded-sq-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add media
          </button>
        )}
      </div>
    </section>
  );
};
