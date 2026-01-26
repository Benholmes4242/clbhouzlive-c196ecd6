import { useState } from 'react';
import { useSeasonImprovementLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { TrendingDown } from 'lucide-react';
import { formatHcp } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
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
    return (
      <div className="px-4">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardLoading />
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="px-4 space-y-4">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No season data yet"
          description="Update your handicap to track your season progress!"
        />
      </div>
    );
  }

  // Find current user's entry and rank
  const currentUserEntry = entries.find(e => e.user_id === user?.id);
  const userRank = currentUserEntry?.rank;
  const userImprovement = currentUserEntry?.improvement;

  // Entries for list (skip first 3 if we have podium)
  const listEntries = entries.length >= 3 ? entries.slice(3) : entries;

  return (
    <div className="space-y-0">
      <div className="px-4">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
      </div>

      {/* Podium for Top 3 */}
      {entries.length >= 3 && (
        <HandicapPodium
          entries={entries.slice(0, 3)}
          currentUserId={user?.id}
          mode="season"
        />
      )}

      {/* Insight Banner */}
      <HandicapInsightBanner 
        userRank={userRank} 
        improvement30d={userImprovement}
        mode="season" 
      />

      {/* Rankings List (4th onwards) */}
      {listEntries.length > 0 && (
        <div className="space-y-1">
          {listEntries.map((entry) => (
            <LeaderboardRow
              key={entry.user_id}
              rank={entry.rank}
              userId={entry.user_id}
              displayName={entry.display_name || 'Unknown'}
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
      )}
    </div>
  );
}