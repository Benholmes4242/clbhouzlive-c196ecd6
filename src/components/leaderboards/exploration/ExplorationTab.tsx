import { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExplorationLeaderboard } from '@/hooks/leaderboards';
import { supabase } from '@/integrations/supabase/client';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import { ExplorationHero } from './ExplorationHero';
import { ExplorationPodium } from './ExplorationPodium';
import { ExplorationMetricToggle } from './ExplorationMetricToggle';
import { ExplorationProgressStrip } from './ExplorationProgressStrip';
import { ClubSearchBar } from './ClubSearchBar';
import type { LeaderboardScope, ExplorationMetric } from '@/types/leaderboards';

export function ExplorationTab() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [metric, setMetric] = useState<ExplorationMetric>('countries');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);

  // Fetch user's home club
  useEffect(() => {
    async function fetchUserHomeClub() {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, golf_clubs!user_profiles_primary_club_id_fkey(name)')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName((data.golf_clubs as any)?.name || null);
        // Default to user's home club when switching to club scope
        if (!selectedClubId) {
          setSelectedClubId(data.primary_club_id);
          setSelectedClubName((data.golf_clubs as any)?.name || null);
        }
      }
    }
    fetchUserHomeClub();
  }, [user?.id]);

  // When switching to club scope, default to user's home club
  useEffect(() => {
    if (scope === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [scope, selectedClubId, userHomeClubId, userHomeClubName]);

  const { data: entries, isLoading } = useExplorationLeaderboard({
    scope,
    metric,
    clubId: scope === 'club' ? selectedClubId : null,
  });

  const handleClubSelect = (clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  };

  // Get metric value for display
  const getMetricValue = (entry: typeof entries extends (infer E)[] ? E : never) => {
    switch (metric) {
      case 'continents':
        return entry.continents_count;
      default:
        return entry.countries_count;
    }
  };

  // Get podium ring color based on rank
  const getPodiumRingColor = (rank: number): string | null => {
    switch (rank) {
      case 1:
        return '#eab308'; // Gold
      case 2:
        return '#94a3b8'; // Silver
      case 3:
        return '#d97706'; // Bronze
      default:
        return null;
    }
  };

  // Podium shows top 3, but list shows ALL (like Championship tab)
  const podiumEntries = entries?.slice(0, 3) ?? [];
  const listEntries = entries ?? [];

  return (
    <div className="space-y-4">
      {/* Hero Section */}
      <ExplorationHero />

      {/* Scope Selector */}
      <LeaderboardScopeSelector value={scope} onChange={setScope} />

      {/* Club Search (only visible in club scope) */}
      {scope === 'club' && (
        <ClubSearchBar
          selectedClubId={selectedClubId}
          selectedClubName={selectedClubName}
          userHomeClubId={userHomeClubId}
          userHomeClubName={userHomeClubName}
          onClubSelect={handleClubSelect}
        />
      )}

      {isLoading ? (
        <LeaderboardLoading />
      ) : !entries?.length ? (
        <LeaderboardEmpty
          title="No explorers yet"
          description={
            scope === 'club' && selectedClubName
              ? `No Clbhouz golfers found for ${selectedClubName} yet`
              : scope === 'friends'
              ? "None of your friends have explored yet"
              : "Rate courses in different countries to appear here!"
          }
        />
      ) : (
        <>
          {/* Podium */}
          <ExplorationPodium 
            entries={podiumEntries} 
            metric={metric}
            currentUserId={user?.id}
          />

          {/* Metric Toggle */}
          <ExplorationMetricToggle 
            value={metric} 
            onChange={setMetric}
          />

          {/* Progress Strip (for logged-in users) */}
          {user && <ExplorationProgressStrip userId={user.id} />}

          {/* Rankings List - ALL positions including podium */}
          {listEntries.length > 0 && (
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Rankings</h3>
              <div className="space-y-1">
                {listEntries.map((entry) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    rank={entry.rank}
                    userId={entry.user_id}
                    displayName={entry.display_name || 'Golfer'}
                    profilePhotoUrl={entry.avatar_url}
                    homeClub={entry.home_club}
                    subtitle={`${entry.courses_count} courses`}
                    ringColor={getPodiumRingColor(entry.rank)}
                    isCurrentUser={entry.user_id === user?.id}
                    isFriend={entry.is_friend && scope !== 'friends'}
                  >
                    <LeaderboardStat
                      value={getMetricValue(entry)}
                      highlight
                    />
                  </LeaderboardRow>
                ))}
              </div>
              
              {/* End indicator */}
              <p className="text-center text-sm text-slate-400 mt-4">
                You've reached the end
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
