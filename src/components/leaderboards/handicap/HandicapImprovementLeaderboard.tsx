import { useHandicapImprovementLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { TrendingDown } from 'lucide-react';
import { formatHcp } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';

interface HandicapImprovementLeaderboardProps {
  days?: number;
  scope: LeaderboardScope;
  clubId?: string | null;
  clubName?: string | null;
}

export function HandicapImprovementLeaderboard({ 
  days = 30, 
  scope,
  clubId,
  clubName,
}: HandicapImprovementLeaderboardProps) {
  const { user } = useSupabaseSession();

  const { data: entries, isLoading } = useHandicapImprovementLeaderboard({ 
    days,
    scope,
    clubId: scope === 'club' ? clubId : undefined,
  });

  if (isLoading) {
    return (
      <div className="px-4">
        <LeaderboardLoading />
      </div>
    );
  }

  if (!entries?.length) {
    return (
      <div className="px-4 space-y-4">
        <LeaderboardEmpty
          title={scope === 'club' ? "No improvers from this club yet" : "No improvers yet"}
          description={
            scope === 'club' && clubName
              ? `No improving golfers from ${clubName} in the last ${days} days`
              : `Log 3 rounds over ${days} days to appear here!`
          }
        />
      </div>
    );
  }

  // Find current user's entry and rank
  const currentUserEntry = entries.find(e => e.user_id === user?.id);
  const userRank = currentUserEntry?.rank;
  const userImprovement = currentUserEntry?.improvement;

  // Show ALL entries in the list (podium players included, like Championship)
  const listEntries = entries;

  return (
    <div className="space-y-0">
      {/* Podium for Top 3 */}
      {entries.length >= 3 && (
        <HandicapPodium
          entries={entries.slice(0, 3)}
          currentUserId={user?.id}
          mode="improved"
        />
      )}

      {/* Insight Banner */}
      <HandicapInsightBanner 
        userRank={userRank} 
        mode="improved"
        scope="global"
        scopeLabel="globally"
        userId={user?.id}
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
              <div className="flex items-center gap-1 text-emerald-700">
                <TrendingDown className="h-4 w-4" />
                <LeaderboardStat
                  value={`-${entry.improvement.toFixed(1)}`}
                  positive
                />
              </div>
              <LeaderboardStat
                value={formatHcp(entry.current_handicap)}
                label="now"
              />
            </LeaderboardRow>
          ))}
        </div>
      )}
    </div>
  );
}
