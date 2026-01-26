import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
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

interface LowestHandicapLeaderboardProps {
  scope: LeaderboardScope;
  clubId?: string | null;
  clubName?: string | null;
}

export function LowestHandicapLeaderboard({ scope, clubId, clubName }: LowestHandicapLeaderboardProps) {
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

  // Entries for list (skip first 3 if we have podium)
  const listEntries = entries.length >= 3 ? entries.slice(3) : entries;

  return (
    <div className="space-y-0">
      {/* Podium for Top 3 */}
      {entries.length >= 3 && (
        <HandicapPodium
          entries={entries.slice(0, 3)}
          currentUserId={user?.id}
          mode="lowest"
        />
      )}

      {/* Insight Banner */}
      <HandicapInsightBanner userRank={userRank} mode="lowest" />

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
              <LeaderboardStat
                value={formatHcp(entry.handicap_index)}
                highlight
              />
            </LeaderboardRow>
          ))}
        </div>
      )}
    </div>
  );
}
