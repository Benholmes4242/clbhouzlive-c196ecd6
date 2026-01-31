import { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExplorationLeaderboard, useUserExplorationStatus } from '@/hooks/leaderboards';
import { supabase } from '@/integrations/supabase/client';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LeaderboardRow,
  LeaderboardStat,
  LeaderboardScopeSelector,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import { CountrySelector } from '../shared/CountrySelector';
import { ExplorationPodium } from './ExplorationPodium';
import { ExplorationMetricToggle } from './ExplorationMetricToggle';
import { GlobalProgressMap } from './GlobalProgressMap';
import { GlobalGolfersMapStatsRow } from './GlobalGolfersMapStatsRow';
import { ClubSearchBar } from './ClubSearchBar';
import type { LeaderboardScope, ExplorationMetric } from '@/types/leaderboards';

export function ExplorationTab() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [metric, setMetric] = useState<ExplorationMetric>('countries');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll-to-top FAB listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Clear country when switching away from country scope
  useEffect(() => {
    if (scope !== 'country') {
      setSelectedCountry(null);
    }
  }, [scope]);

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
    country: scope === 'country' ? selectedCountry : null,
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
        return '#C1A84C';
      case 2:
        return '#B8C6C9';
      case 3:
        return '#8B7355';
      default:
        return null;
    }
  };

  // Get metric color based on rank
  const getMetricColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'text-[#C1A84C]';
      case 2:
        return 'text-[#B8C6C9]';
      case 3:
        return 'text-[#8B7355]';
      default:
        return 'text-[#14B8A6]';
    }
  };

  const podiumEntries = entries?.slice(0, 3) ?? [];
  const listEntries = entries ?? [];

  // Computed values for stats row
  const continentsPlayed = userStatus?.continent_list?.filter(c => c !== 'Antarctica').length ?? 0;
  const countriesPlayed = userStatus?.countries_count ?? 0;

  return (
    <div className="flex flex-col px-4 py-4 pb-24 space-y-4">
      {/* 1. World Map - Hero position (logged-in users only) */}
      {user && userStatus && (
        <GlobalProgressMap 
          playedContinents={userStatus.continent_list ?? []}
          playedCountries={userStatus.country_list ?? []}
          mapView={metric}
        />
      )}

      {/* 2. Stats Row - Two cards for Continents/Countries progress */}
      {user && userStatus && (
        <GlobalGolfersMapStatsRow
          continentsPlayed={continentsPlayed}
          continentsTotal={6}
          countriesPlayed={countriesPlayed}
        />
      )}

      {/* 3. Countries/Continents Metric Toggle */}
      <ExplorationMetricToggle 
        value={metric} 
        onChange={setMetric}
      />

      {/* 3. Scope Selector (Global/Friends/Clubs/Country) */}
      <div className="flex justify-center">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
      </div>

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

      {/* Country Selector (only visible in country scope) */}
      {scope === 'country' && (
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
        />
      )}

      {isLoading ? (
        <LeaderboardLoading />
      ) : !entries?.length ? (
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
      ) : (
        <>
          {/* 4. Podium */}
          <ExplorationPodium 
            entries={podiumEntries} 
            metric={metric}
            currentUserId={user?.id}
          />

          {/* 5. Rankings List */}
          {listEntries.length > 0 && (
            <div className="flex flex-col space-y-2">
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
                  <div className={getMetricColor(entry.rank)}>
                    <LeaderboardStat
                      value={getMetricValue(entry)}
                    />
                  </div>
                </LeaderboardRow>
              ))}
            </div>
          )}

          {/* End indicator */}
          <p className="text-center text-sm text-gray-400 py-4">
            You've reached the end
          </p>
        </>
      )}

      {/* Scroll to Top FAB */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          "fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full",
          "bg-gray-700 text-white shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          showScrollTop 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
