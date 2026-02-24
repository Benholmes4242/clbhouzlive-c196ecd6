import { HandicapPodiumSlot } from './HandicapPodiumSlot';
import type { LowestHandicapEntry, HandicapImprovementEntry, SeasonImprovementEntry } from '@/types/leaderboards';

type PodiumEntry = LowestHandicapEntry | HandicapImprovementEntry | SeasonImprovementEntry;

interface HandicapPodiumProps {
  entries: PodiumEntry[];
  currentUserId?: string;
  mode: 'lowest' | 'improved' | 'season';
}

function getHandicapValue(entry: PodiumEntry, mode: string): number {
  if ('handicap_index' in entry) return entry.handicap_index;
  if ('current_handicap' in entry) return entry.current_handicap;
  return 0;
}

export function HandicapPodium({ entries, currentUserId, mode }: HandicapPodiumProps) {
  if (entries.length < 3) return null;

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  // Staggered: #1 first, then #2, then #3
  const delays = { 1: 0, 2: 0.1, 3: 0.2 };

  return (
    <div className="w-full pt-4 pb-6 px-4">
      <div className="flex items-start justify-center gap-3">
        {/* 2nd place (left) */}
        <HandicapPodiumSlot
          rank={2}
          userId={second.user_id}
          displayName={second.display_name || 'Unknown'}
          avatarUrl={second.avatar_url}
          handicap={getHandicapValue(second, mode)}
          isCurrentUser={second.user_id === currentUserId}
          animationDelay={delays[2]}
        />

        {/* 1st place (center) */}
        <HandicapPodiumSlot
          rank={1}
          userId={first.user_id}
          displayName={first.display_name || 'Unknown'}
          avatarUrl={first.avatar_url}
          handicap={getHandicapValue(first, mode)}
          isCurrentUser={first.user_id === currentUserId}
          animationDelay={delays[1]}
        />

        {/* 3rd place (right) */}
        <HandicapPodiumSlot
          rank={3}
          userId={third.user_id}
          displayName={third.display_name || 'Unknown'}
          avatarUrl={third.avatar_url}
          handicap={getHandicapValue(third, mode)}
          isCurrentUser={third.user_id === currentUserId}
          animationDelay={delays[3]}
        />
      </div>
    </div>
  );
}
