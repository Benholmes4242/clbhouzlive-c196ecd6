import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
import {
  LeaderboardRow,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';
import { cn } from '@/lib/utils';

// Metallic palette matching MedalBadge
const RANK_COLORS: Record<number, string> = {
  1: '#C1A84C', // Gold
  2: '#B8C6C9', // Silver
  3: '#8B7355', // Bronze
};

interface LowestHandicapLeaderboardProps {
  scope: LeaderboardScope;
  clubId?: string | null;
  clubName?: string | null;
  scopeSelector?: React.ReactNode;
}

export function LowestHandicapLeaderboard({ scope, clubId, clubName, scopeSelector }: LowestHandicapLeaderboardProps) {
  const { user } = useSupabaseSession();

  const { data: entries, isLoading } = useLowestHandicapLeaderboard({ 
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
        {scopeSelector}
        <LeaderboardEmpty
          title={scope === 'club' ? "No handicaps from this club yet" : "No handicaps recorded"}
          description={
            scope === 'club' && clubName
              ? `Invite your club mates from ${clubName} to join!`
              : "Add your handicap to your profile to appear here!"
          }
        />
      </div>
    );
  }

  // Find current user's rank
  const currentUserEntry = entries.find(e => e.user_id === user?.id);
  const userRank = currentUserEntry?.rank;

  // Show ALL entries in the list (podium players included, like Championship)
  const listEntries = entries;

  return (
    <div className="space-y-0">
      {/* Podium for Top 3 - FIRST, before scope selector */}
      {entries.length >= 3 && (
        <HandicapPodium
          entries={entries.slice(0, 3)}
          currentUserId={user?.id}
          mode="lowest"
        />
      )}

      {/* Scope Selector (Global/Friends/Club) - passed from parent */}
      {scopeSelector && (
        <div className="py-3">
          {scopeSelector}
        </div>
      )}

      {/* Insight Banner */}
      <HandicapInsightBanner userRank={userRank} mode="lowest" />

      {/* Rankings List */}
      {listEntries.length > 0 && (
        <div className="space-y-1">
          {listEntries.map((entry) => {
            const rankColor = RANK_COLORS[entry.rank];
            
            return (
              <LeaderboardRow
                key={entry.user_id}
                rank={entry.rank}
                userId={entry.user_id}
                displayName={entry.display_name || 'Unknown'}
                profilePhotoUrl={entry.avatar_url}
                isCurrentUser={entry.user_id === user?.id}
              >
                {/* Handicap stat with rank-matched color for top 3 */}
                <div className="text-right">
                  <div
                    className={cn(
                      'text-3xl font-bold',
                      !rankColor && 'text-primary'
                    )}
                    style={rankColor ? { color: rankColor } : undefined}
                  >
                    {formatHcp(entry.handicap_index)}
                  </div>
                </div>
              </LeaderboardRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
