import { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExplorationLeaderboard, useUserExplorationStatus } from '@/hooks/leaderboards';
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
import { PassportStrip } from './PassportStrip';
import { WorldMapSVG } from './WorldMapSVG';
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

  // User's exploration status for world map
  const { data: userStatus } = useUserExplorationStatus({ userId: user?.id });

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
    <div className="flex flex-col pb-20">
      {/* Hero Section */}
      <ExplorationHero />

      {/* Scope Selector - tight to hero */}
      <div className="px-4 pt-3">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
      </div>

      {/* Club Search (only visible in club scope) */}
      {scope === 'club' && (
        <div className="px-4 pt-2">
          <ClubSearchBar
            selectedClubId={selectedClubId}
            selectedClubName={selectedClubName}
            userHomeClubId={userHomeClubId}
            userHomeClubName={userHomeClubName}
            onClubSelect={handleClubSelect}
          />
        </div>
      )}

      {isLoading ? (
        <div className="px-4 pt-4">
          <LeaderboardLoading />
        </div>
      ) : !entries?.length ? (
        <div className="px-4 pt-4">
          <LeaderboardEmpty
            title="No explorers yet"
            description={
              scope === 'club' && selectedClubName
                ? `No clbhouz golfers found for ${selectedClubName} yet`
                : scope === 'friends'
                ? "None of your friends have explored yet"
                : "Rate courses in different countries to appear here!"
            }
          />
        </div>
      ) : (
        <>
          {/* Podium - more spacing from scope selector */}
          <div className="pt-6">
            <ExplorationPodium 
              entries={podiumEntries} 
              metric={metric}
              currentUserId={user?.id}
            />
          </div>

          {/* Metric Toggle - tight to podium */}
          <div className="py-2">
            <ExplorationMetricToggle 
              value={metric} 
              onChange={setMetric}
            />
          </div>

          {/* Passport Strip (for logged-in users) */}
          {user && (
            <div className="pt-1">
              <PassportStrip userId={user.id} />
            </div>
          )}

          {/* Mini World Map (for logged-in users) - tight to strip */}
          {user && userStatus && userStatus.continent_list && userStatus.continent_list.length > 0 && (
            <div className="pt-3 px-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider text-center mb-1">
                World Coverage
              </p>
              <div className="h-[70px] flex items-center justify-center">
                <WorldMapSVG 
                  highlightedContinents={userStatus.continent_list}
                  className="w-full max-w-[300px] h-auto"
                />
              </div>
            </div>
          )}

          {/* Rankings List - ALL positions including podium - full width like Championship */}
          {listEntries.length > 0 && (
            <div className="pt-4">
              <div className="flex flex-col">
                {listEntries.map((entry) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    rank={entry.rank}
                    userId={entry.user_id}
                    displayName={entry.display_name || 'Golfer'}
                    profilePhotoUrl={entry.avatar_url}
                    homeClub={entry.home_club}
                    coursesCount={entry.courses_count}
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
              <p className="text-center text-sm text-slate-400 mt-4 px-4">
                You've reached the end
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
