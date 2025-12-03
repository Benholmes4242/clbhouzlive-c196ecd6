import React from 'react';
import { Squircle } from '@/components/ui/squircle';

interface UserProgress {
  totalTop100Courses: number;
}

interface Top100ListUserStripProps {
  userProgress: UserProgress;
  userAvatarUrl?: string | null;
  userName?: string;
}

export const Top100ListUserStrip: React.FC<Top100ListUserStripProps> = ({
  userProgress,
  userAvatarUrl,
  userName,
}) => {
  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white shadow-sm px-4 py-3 flex items-center gap-3 border border-slate-100">
      {/* Avatar with squircle shape */}
      <Squircle width={48} height={48}>
        {userAvatarUrl ? (
          <img
            src={userAvatarUrl}
            alt={userName || 'User avatar'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium text-lg">
            {userName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </Squircle>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-slate-500">Your position</div>
        <div className="text-[15px] font-semibold text-slate-900">
          {userProgress.totalTop100Courses} Top 100 courses
        </div>
      </div>
    </div>
  );
};
