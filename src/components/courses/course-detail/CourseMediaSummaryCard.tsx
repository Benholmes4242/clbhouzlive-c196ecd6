import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CourseMediaSummaryCardProps {
  photoCount: number;
  videoCount: number;
  userMediaCount: number;
  lastMediaCreatedAt: string | null;
  onUserMediaClick?: () => void;
  subtitle?: string; // Dynamic subtitle based on filter mode
}

export const CourseMediaSummaryCard: React.FC<CourseMediaSummaryCardProps> = ({
  photoCount,
  videoCount,
  userMediaCount,
  lastMediaCreatedAt,
  onUserMediaClick,
  subtitle,
}) => {
  const totalCount = photoCount + videoCount;
  const hasMedia = totalCount > 0;
  const hasUserMedia = userMediaCount > 0;

  return (
    <div className="rounded-xl bg-white shadow-sm p-6 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
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
          <div className="text-xs text-slate-500 mt-1">
            {subtitle || (hasMedia && lastMediaCreatedAt
              ? `Last added ${formatDistanceToNow(new Date(lastMediaCreatedAt), { addSuffix: true })}`
              : 'Be the first to share a moment from this course.')}
          </div>
        </div>

        {hasUserMedia && (
          <button
            onClick={onUserMediaClick}
            className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            FROM YOU: {userMediaCount}
          </button>
        )}
      </div>
    </div>
  );
};
