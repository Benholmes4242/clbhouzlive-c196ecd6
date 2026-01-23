import { useState } from 'react';
import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';

export function LowestHandicapLeaderboard() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: entries, isLoading } = useLowestHandicapLeaderboard({ scope });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!entries?.length) {
    return (
      <>
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No handicaps recorded"
          description="Add your handicap to your profile to appear here!"
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <LeaderboardScopeSelector value={scope} onChange={setScope} />

      <div className="space-y-1">
        {entries.map((entry) => (
          <LeaderboardRow
            key={entry.user_id}
            rank={entry.rank}
            userId={entry.user_id}
            displayName={entry.display_name}
            profilePhotoUrl={entry.avatar_url}
            isCurrentUser={entry.user_id === user?.id}
          >
            <LeaderboardStat
              value={entry.handicap_index >= 0 
                ? `+${entry.handicap_index.toFixed(1)}` 
                : entry.handicap_index.toFixed(1)
              }
              highlight
            />
          </LeaderboardRow>
        ))}
      </div>
    </div>
  );
}
