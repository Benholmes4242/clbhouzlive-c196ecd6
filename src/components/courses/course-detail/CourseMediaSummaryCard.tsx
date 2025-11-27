import React from 'react';
import { Squircle } from '@/components/ui/squircle';

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
  contributors = [],
  courseName,
  onAddMedia,
}) => {
  const hasMedia = photoCount > 0 || videoCount > 0;

  // Empty state
  if (!hasMedia) {
    return (
      <section className="px-4 pt-4 pb-6">
        <div className="rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] px-4 py-4 text-center">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500 mb-1.5">
            Course media
          </p>
          <p className="text-sm font-medium text-slate-900 mb-1">
            No photos or videos yet
          </p>
          <p className="text-sm text-slate-500">
            Help other golfers see {courseName || 'this course'} before they play – add your photos or a short video.
          </p>
        </div>
      </section>
    );
  }

  // Structured header when there is media
  return (
    <section className="px-4 pt-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-500">
            Course media
          </p>

          <p className="mt-1 text-sm font-medium text-slate-900">
            {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
            {' · '}
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </p>

          {contributorsCount > 0 && (
            <p className="mt-0.5 text-[12px] text-slate-500">
              Shared by {contributorsCount} {contributorsCount === 1 ? 'golfer' : 'golfers'}
            </p>
          )}
        </div>

        {contributors.length > 0 && (
          <div className="flex -space-x-2">
            {contributors.slice(0, 3).map((user) => (
              <div key={user.id} className="ring-2 ring-white rounded-lg">
                <Squircle width={28} height={28}>
                  <img
                    src={user.avatarUrl || 'https://via.placeholder.com/32'}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Squircle>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
