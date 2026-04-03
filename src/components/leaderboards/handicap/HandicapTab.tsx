import { useState, useEffect, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
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
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // Save filters
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify({
      scope, selectedClubId, selectedClubName, selectedCountry,
    }));
  }, [scope, selectedClubId, selectedClubName, selectedCountry]);

  // Fetch user's home club + country
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, country, golf_clubs!user_profiles_primary_club_id_fkey(name, country)')
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
      const clubCountry = (data?.golf_clubs as any)?.country;
      setUserCountry(clubCountry || data?.country || null);
    }
    fetchUserProfile();
  }, [user?.id]);

  // When switching to club scope, default to user's home club
  useEffect(() => {
    if (scope === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [scope, selectedClubId, userHomeClubId, userHomeClubName]);

  // When switching to country scope, default to user's country
  useEffect(() => {
    if (scope === 'country' && !selectedCountry && userCountry) {
      setSelectedCountry(userCountry);
    }
  }, [scope, selectedCountry, userCountry]);

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

  const effectiveCountry = scope === 'country' ? (selectedCountry || userCountry) : null;

  return (
    <div>
      <LowestHandicapLeaderboard
        scope={scope}
        onScopeChange={setScope}
        clubId={scope === 'club' ? selectedClubId : null}
        clubName={scope === 'club' ? selectedClubName : null}
        country={effectiveCountry}
        selectedClubId={selectedClubId}
        selectedClubName={selectedClubName}
        onClubSelect={handleClubSelect}
        selectedCountry={selectedCountry}
        onCountrySelect={setSelectedCountry}
        userHomeClubId={userHomeClubId}
        userHomeClubName={userHomeClubName}
      />
    </div>
  );
}
