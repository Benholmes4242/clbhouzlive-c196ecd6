import { useState } from 'react';
import { useRegionsLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';

export function RegionsLeaderboard() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: entries, isLoading } = useRegionsLeaderboard({ scope });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!entries?.length) {
    return (
      <>
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No region completers yet"
          description="Complete regions by rating courses in all their countries!"
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
            profilePhotoUrl={entry.profile_photo_url}
            homeClub={entry.home_club}
            isCurrentUser={entry.user_id === user?.id}
            isFriend={entry.is_friend}
          >
            <LeaderboardStat
              value={`${entry.regions_completed}/${entry.total_regions}`}
              label="regions"
              highlight
            />
            <LeaderboardStat
              value={`${entry.completion_percentage}%`}
              label="complete"
            />
          </LeaderboardRow>
        ))}
      </div>
    </div>
  );
}
