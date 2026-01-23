import { useState } from 'react';
import { useCountriesLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';

export function CountriesLeaderboard() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');

  const { data: entries, isLoading } = useCountriesLeaderboard({ scope });

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  if (!entries?.length) {
    return (
      <>
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
        <LeaderboardEmpty
          title="No explorers yet"
          description="Rate courses in different countries to appear here!"
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
              value={entry.countries_count}
              label="countries"
              highlight
            />
          </LeaderboardRow>
        ))}
      </div>
    </div>
  );
}
