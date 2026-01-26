import { useState } from 'react';
import { useHandicapImprovementLeaderboard } from '@/hooks/leaderboards';
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

interface HandicapImprovementLeaderboardProps {
  days?: number;
}

export function HandicapImprovementLeaderboard({ days = 30 }: HandicapImprovementLeaderboardProps) {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: entries, isLoading } = useHandicapImprovementLeaderboard({ 
    days,
    scope,
  });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!entries?.length) {
    return (
      <>
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No improvers yet"
          description={`Log 3 rounds over ${days} days to appear here!`}
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
              label="current"
            />
          </LeaderboardRow>
        ))}
      </div>
    </div>
  );
}
