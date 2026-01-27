import { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScopeSelector } from '../shared';
import { ClubSearchBar } from '../exploration/ClubSearchBar';
import { CountrySelector } from '../shared/CountrySelector';
import { LowestHandicapLeaderboard } from './LowestHandicapLeaderboard';
import type { LeaderboardScope } from '@/types/leaderboards';

export function HandicapTab() {
  const { user } = useSupabaseSession();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
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
    <div className="space-y-5 pb-24">
      {/* Lowest Handicap Leaderboard - Podium first, then scope selector inside */}
      <LowestHandicapLeaderboard 
        scope={scope} 
        clubId={scope === 'club' ? selectedClubId : null}
        clubName={scope === 'club' ? selectedClubName : null}
        country={scope === 'country' ? selectedCountry : null}
        scopeSelector={
          <div className="space-y-4">
            <LeaderboardScopeSelector value={scope} onChange={setScope} />
            {scope === 'country' && (
              <div className="px-4">
                <CountrySelector
                  selectedCountry={selectedCountry}
                  onCountrySelect={setSelectedCountry}
                />
              </div>
            )}
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
          </div>
        }
      />
    </div>
  );
}
