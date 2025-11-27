import React from 'react';

interface CourseMediaSummaryCardProps {
  photoCount: number;
  videoCount: number;
}

export const CourseMediaSummaryCard: React.FC<CourseMediaSummaryCardProps> = ({
  photoCount,
  videoCount,
}) => {
  return (
    <div className="rounded-xl bg-white shadow-sm p-6 mb-4">
      <div className="text-xs font-medium text-slate-500 tracking-wide mb-1">
        COURSE MEDIA
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-base font-semibold text-slate-900">
          {photoCount} photo{photoCount !== 1 ? 's' : ''}
        </span>
        <span className="text-base font-semibold text-slate-900">
          {videoCount} video{videoCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
