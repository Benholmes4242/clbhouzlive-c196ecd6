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

  // Get podium ring color based on rank - Modern Country Club palette
  const getPodiumRingColor = (rank: number): string | null => {
    switch (rank) {
      case 1:
        return '#C1A84C'; // Chartreus Gold
      case 2:
        return '#B8C6C9'; // Sky Blue Silver
      case 3:
        return '#8B7355'; // Warm Bronze
      default:
        return null;
    }
  };

  // Get metric color based on rank (matching podium colors)
  const getMetricColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'text-[#C1A84C]'; // Chartreus Gold
      case 2:
        return 'text-[#B8C6C9]'; // Sky Blue Silver  
      case 3:
        return 'text-[#8B7355]'; // Warm Bronze
      default:
        return 'text-[#14B8A6]'; // Teal for others (Explore tab accent)
    }
  };

  // Podium shows top 3, but list shows ALL (like Championship tab)
  const podiumEntries = entries?.slice(0, 3) ?? [];
  const listEntries = entries ?? [];

  return (
    <div className="flex flex-col pb-24 space-y-4">
      {/* Hero Section */}
      <ExplorationHero />

      {/* Scope Selector */}
      <div className="px-4">
        <LeaderboardScopeSelector value={scope} onChange={setScope} />
      </div>

      {/* Club Search (only visible in club scope) */}
      {scope === 'club' && (
        <div className="px-4">
          <ClubSearchBar
            selectedClubId={selectedClubId}
            selectedClubName={selectedClubName}
            userHomeClubId={userHomeClubId}
            userHomeClubName={userHomeClubName}
            onClubSelect={handleClubSelect}
          />
        </div>
      )}

      {/* Country Selector (only visible in country scope) */}
      {scope === 'country' && (
        <div className="px-4">
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountrySelect={setSelectedCountry}
          />
        </div>
      )}

      {isLoading ? (
        <div className="px-4">
          <LeaderboardLoading />
        </div>
      ) : !entries?.length ? (
        <div className="px-4">
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

          {/* Passport Strip (for logged-in users) */}
          {user && (
            <PassportStrip userId={user.id} />
          )}

          {/* Mini World Map (for logged-in users) */}
          {user && userStatus && userStatus.continent_list && userStatus.continent_list.length > 0 && (
            <div className="mx-4 bg-gray-50 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-center">
                <WorldMapSVG 
                  highlightedContinents={userStatus.continent_list}
                  className="w-full h-auto"
                />
              </div>
              
              {/* Map Legend */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                  <span className="text-xs text-gray-500">Played</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gray-200" />
                  <span className="text-xs text-gray-500">Not played</span>
                </div>
              </div>
            </div>
          )}

          {/* Rankings List */}
          {listEntries.length > 0 && (
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
                  <div className={getMetricColor(entry.rank)}>
                    <LeaderboardStat
                      value={getMetricValue(entry)}
                    />
                  </div>
                </LeaderboardRow>
              ))}
              
              {/* End indicator */}
              <p className="text-center text-sm text-gray-400 mt-4 px-4">
                You've reached the end
              </p>
            </div>
          )}
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
