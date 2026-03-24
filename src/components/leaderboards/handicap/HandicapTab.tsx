import { useState, useEffect, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScopeSelector } from '../shared';
import { ClubSearchBar } from '../exploration/ClubSearchBar';
import { CountrySelector } from '../shared/CountrySelector';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
import { useSeasonCalendar } from '@/hooks/championship';
import { getSeasonConfig, type SeasonId } from '@/lib/seasonConfig';
import type { LeaderboardScope } from '@/types/leaderboards';

const STORAGE_KEY_FILTERS = 'handicap-leaderboard-filters';

function loadSavedFilters() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export function HandicapTab() {
  const { user } = useSupabaseSession();
  const savedFilters = useRef(loadSavedFilters()).current;

  const [scope, setScope] = useState<LeaderboardScope>(() => savedFilters?.scope ?? 'global');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(() => savedFilters?.selectedClubId ?? null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(() => savedFilters?.selectedClubName ?? null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => savedFilters?.selectedCountry ?? null);
  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);

  // Derive season color
  const { data: seasonCalendar } = useSeasonCalendar();
  const seasonThemeColor = useMemo(() => {
    const currentSeason = seasonCalendar?.find(s => s.is_current);
    if (!currentSeason) return 'hsl(var(--accent-amber))';
    const lower = currentSeason.name.toLowerCase();
    let id: SeasonId = 'major';
    if (lower.includes('pre-season') || lower.includes('preseason') || lower.includes('training')) id = 'preseason';
    else if (lower.includes('summer')) id = 'summer';
    else if (lower.includes('off-season') || lower.includes('offseason')) id = 'offseason';
    return getSeasonConfig(id).themeColor;
  }, [seasonCalendar]);

  // Save filters
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
      scope, selectedClubId, selectedClubName, selectedCountry,
    }));
  }, [scope, selectedClubId, selectedClubName, selectedCountry]);

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

  // Clear country when switching away from country scope
  useEffect(() => {
    if (scope !== 'country') {
      setSelectedCountry(null);
    }
  }, [scope]);

  const handleClubSelect = (clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  };

  return (
    <div className="space-y-4 px-3 pt-3">
      <LowestHandicapLeaderboard 
        scope={scope} 
        clubId={scope === 'club' ? selectedClubId : null}
        clubName={scope === 'club' ? selectedClubName : null}
        country={scope === 'country' ? selectedCountry : null}
        seasonColor={seasonThemeColor}
        scopeSelector={
          <div className="space-y-4">
            <LeaderboardScopeSelector value={scope} onChange={setScope} showClub={false} showCountry={false} />
          </div>
        }
      />
    </div>
  );
}
