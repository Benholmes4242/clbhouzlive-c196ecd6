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
        <div className="space-y-1">
          {/* Title */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Course Media
          </p>

          {/* Counts */}
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900 tabular-nums">{photoCount}</span>
            {' '}{photoCount === 1 ? 'photo' : 'photos'}
            {' · '}
            <span className="font-semibold text-gray-900 tabular-nums">{videoCount}</span>
            {' '}{videoCount === 1 ? 'video' : 'videos'}
          </p>

          {/* Contributors */}
          {contributorsCount > 0 && (
            <p className="text-xs text-gray-400">
              Shared by {contributorsCount} {contributorsCount === 1 ? 'golfer' : 'golfers'}
            </p>
          )}
        </div>

        {/* Add media CTA - primary button style */}
        {onAddMedia && (
          <button
            type="button"
            onClick={onAddMedia}
            className="flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] text-gray-700 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors shadow-sm ring-1 ring-gray-200 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Add media
          </button>
        )}
      </div>
    </section>
  );
};
