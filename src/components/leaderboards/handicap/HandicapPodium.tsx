import { HandicapPodiumSlot } from './HandicapPodiumSlot';
import type { LowestHandicapEntry, HandicapImprovementEntry, SeasonImprovementEntry } from '@/types/leaderboards';

type PodiumEntry = LowestHandicapEntry | HandicapImprovementEntry | SeasonImprovementEntry;

interface HandicapPodiumProps {
  entries: PodiumEntry[];
  currentUserId?: string;
  mode: 'lowest' | 'improved' | 'season';
}

function getHandicapValue(entry: PodiumEntry, mode: string): number {
  if ('handicap_index' in entry) {
    return entry.handicap_index;
  }
  if ('current_handicap' in entry) {
    return entry.current_handicap;
  }
  return 0;
}

// Platform heights matching Championship tab: 48px/32px/24px
const PLATFORM_HEIGHTS = { 1: 'h-12', 2: 'h-8', 3: 'h-6' };

export function HandicapPodium({ entries, currentUserId, mode }: HandicapPodiumProps) {
  if (entries.length < 3) {
    return null;
  }

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  return (
    <div className="relative py-6">
      {/* Podium container - 2nd, 1st, 3rd layout */}
      <div className="flex items-end justify-center gap-4">
        {/* 2nd place (left, lower) */}
        <div className="flex flex-col items-center pt-6">
          <HandicapPodiumSlot
            rank={2}
            userId={second.user_id}
            displayName={second.display_name || 'Unknown'}
            avatarUrl={second.avatar_url}
            handicap={getHandicapValue(second, mode)}
            isCurrentUser={second.user_id === currentUserId}
          />
          {/* Platform bar - matches Championship 32px */}
          <div
            className={`w-20 ${PLATFORM_HEIGHTS[2]} mt-3 rounded-t-lg`}
            style={{ backgroundColor: 'rgba(184, 198, 201, 0.15)' }}
          />
        </div>

        {/* 1st place (center, elevated) */}
        <div className="flex flex-col items-center -mt-4">
          <HandicapPodiumSlot
            rank={1}
            userId={first.user_id}
            displayName={first.display_name || 'Unknown'}
            avatarUrl={first.avatar_url}
            handicap={getHandicapValue(first, mode)}
            isCurrentUser={first.user_id === currentUserId}
          />
          {/* Platform bar - matches Championship 48px */}
          <div
            className={`w-24 ${PLATFORM_HEIGHTS[1]} mt-3 rounded-t-lg`}
            style={{ backgroundColor: 'rgba(193, 168, 76, 0.15)' }}
          />
        </div>

        {/* 3rd place (right, lower) */}
        <div className="flex flex-col items-center pt-6">
          <HandicapPodiumSlot
            rank={3}
            userId={third.user_id}
            displayName={third.display_name || 'Unknown'}
            avatarUrl={third.avatar_url}
            handicap={getHandicapValue(third, mode)}
            isCurrentUser={third.user_id === currentUserId}
          />
          {/* Platform bar - matches Championship 24px */}
          <div
            className={`w-20 ${PLATFORM_HEIGHTS[3]} mt-3 rounded-t-lg`}
            style={{ backgroundColor: 'rgba(139, 115, 85, 0.15)' }}
          />
        </div>
      </div>
    </div>
  );
}