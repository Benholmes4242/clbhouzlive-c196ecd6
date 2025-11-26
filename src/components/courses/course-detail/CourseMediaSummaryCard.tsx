import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CourseMediaSummaryCardProps {
  photoCount: number;
  videoCount: number;
  userMediaCount: number;
  lastMediaCreatedAt: string | null;
  onUserMediaClick?: () => void;
}

export const CourseMediaSummaryCard: React.FC<CourseMediaSummaryCardProps> = ({
  photoCount,
  videoCount,
  userMediaCount,
  lastMediaCreatedAt,
  onUserMediaClick,
}) => {
  const totalCount = photoCount + videoCount;
  const hasMedia = totalCount > 0;
  const hasUserMedia = userMediaCount > 0;

  return (
    <div className="mt-6 rounded-3xl bg-white shadow-sm px-4 py-6 sm:px-5 sm:py-7">
      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500">
            Course Media
          </h3>
          
          {/* Main stat row */}
          <div className="mt-3 flex items-center gap-2 text-xl sm:text-2xl font-semibold text-slate-900">
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
            <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>
            <span className="text-slate-300">·</span>
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
            <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Secondary info */}
          <p className="mt-2 text-sm text-slate-500">
            {hasMedia && lastMediaCreatedAt
              ? `Last added ${formatDistanceToNow(new Date(lastMediaCreatedAt), { addSuffix: true })}`
              : 'Be the first to share a moment from this course.'}
          </p>
        </div>

        {/* User media pill */}
        {hasUserMedia && (
          <button
            onClick={onUserMediaClick}
            className="inline-flex items-center justify-center rounded-full px-3 py-1 border text-xs font-semibold uppercase bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            From you: {userMediaCount}
          </button>
        )}
      </div>
    </div>
  );
};
