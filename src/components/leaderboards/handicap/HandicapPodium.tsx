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

export function HandicapPodium({ entries, currentUserId, mode }: HandicapPodiumProps) {
  if (entries.length < 3) {
    return null;
  }

  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  // Animation delays for staggered entrance (2nd → 1st → 3rd) - matching Championship
  const delays = { 2: 0, 1: 0.15, 3: 0.3 };

  return (
    <div className="w-full pt-6 pb-4 overflow-visible">
      {/* Podium Layout: 2nd - 1st (elevated) - 3rd - exact match to TrophyPodium */}
      <div className="flex items-end justify-between">
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

        {/* 1st place (center, elevated) */}
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
