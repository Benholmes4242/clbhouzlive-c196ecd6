import { useState } from 'react';
import { useSeasonImprovementLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { TrendingDown } from 'lucide-react';
import { formatHcp } from '@/lib/formatHcp';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';

export function SeasonImprovementLeaderboard() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: entries, isLoading } = useSeasonImprovementLeaderboard({ scope });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!entries?.length) {
    return (
      <>
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No season data yet"
          description="Update your handicap to track your season progress!"
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
            <div className="flex items-center gap-1 text-[#334E3D]">
              <TrendingDown className="h-4 w-4" />
              <LeaderboardStat
                value={`-${entry.improvement.toFixed(1)}`}
                positive
              />
            </div>
            <LeaderboardStat
              value={formatHcp(entry.current_handicap)}
              label="season"
            />
          </LeaderboardRow>
        ))}
      </div>
    </div>
  );
}
