import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TOP100_TIER_STYLES } from '@/lib/top100RingStyles';
import type { Top100TierId } from '@/lib/top100Club';

interface UserProgress {
  rankAmongFriends?: number | null;
  totalTop100Courses: number;
  currentTierId: Top100TierId;
  currentTierName: string;
  nextTierName?: string | null;
  nextTierRemaining?: number | null;
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
  const tierStyles = TOP100_TIER_STYLES[userProgress.currentTierId] || TOP100_TIER_STYLES.none;
  const initial = userName?.[0]?.toUpperCase() || '?';

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white shadow-sm px-4 py-3 flex items-center gap-3 border border-slate-100">
      {/* Avatar with tier ring */}
      <div
        className="relative rounded-full p-[2px]"
        style={{ background: tierStyles.ringClass }}
      >
        <Avatar className="h-12 w-12 border-2 border-white">
          <AvatarImage src={userAvatarUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
            {initial}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-slate-500">Your position</div>
        <div className="text-[15px] font-semibold text-slate-900">
          #{userProgress.rankAmongFriends ?? 1} · {userProgress.totalTop100Courses} Top 100 courses
        </div>
        <div className="mt-0.5 text-[12px] text-slate-500 truncate">
          {userProgress.currentTierName}
          {userProgress.nextTierName && userProgress.nextTierRemaining != null && (
            <> · {userProgress.nextTierRemaining} more to {userProgress.nextTierName}</>
          )}
        </div>
      </div>
    </div>
  );
};
