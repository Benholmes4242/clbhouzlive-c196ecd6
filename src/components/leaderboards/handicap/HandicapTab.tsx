import { useState, useEffect, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardScopeSelector } from '../shared';
import { ClubSearchBar } from '../exploration/ClubSearchBar';
import { CountrySelector } from '../shared/CountrySelector';
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

// --- Scope pills per brief Section 4.2 ---
const SCOPE_OPTIONS: { id: LeaderboardScope; label: string }[] = [
  { id: 'global', label: '🌍 Global' },
  { id: 'country', label: 'Country' },
  { id: 'club', label: 'Club' },
  { id: 'friends', label: '👥 Friends' },
];

export function HandicapTab() {
  const { user } = useSupabaseSession();
  const savedFilters = useRef(loadSavedFilters()).current;

  // Mode toggle — "lowest" or "improved"
  // TODO: add hcp_movement_30d to RPC to enable Most Improved mode
  // const [mode, setMode] = useState<'lowest' | 'improved'>('lowest');

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
      // Use club country or profile country
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
    <div className="space-y-3 px-3 pt-3">
      {/* Mode Toggle — Section 4.1 */}
      {/* TODO: add hcp_movement_30d to RPC to enable Most Improved mode
      <div
        style={{
          background: '#F1F5F9',
          borderRadius: 12,
          padding: 3,
          display: 'flex',
        }}
      >
        <button
          onClick={() => setMode('lowest')}
          style={{
            flex: 1,
            borderRadius: 10,
            minHeight: 36,
            fontSize: 12,
            fontWeight: mode === 'lowest' ? 700 : 500,
            color: mode === 'lowest' ? '#0F172A' : '#64748B',
            background: mode === 'lowest' ? 'white' : 'transparent',
            boxShadow: mode === 'lowest' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          ⬇ Lowest
        </button>
        <button
          onClick={() => setMode('improved')}
          style={{
            flex: 1,
            borderRadius: 10,
            minHeight: 36,
            fontSize: 12,
            fontWeight: mode === 'improved' ? 700 : 500,
            color: mode === 'improved' ? '#0F172A' : '#64748B',
            background: mode === 'improved' ? 'white' : 'transparent',
            boxShadow: mode === 'improved' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          📉 Most Improved
        </button>
      </div>
      */}

      {/* Leaderboard */}
      <LowestHandicapLeaderboard
        scope={scope}
        clubId={scope === 'club' ? selectedClubId : null}
        clubName={scope === 'club' ? selectedClubName : null}
        country={effectiveCountry}
        scopeSelector={
          <div className="space-y-3">
            {/* Scope pills — Section 4.2 */}
            <div
              className="flex overflow-x-auto no-scrollbar"
              style={{ gap: 6 }}
            >
              {SCOPE_OPTIONS.map(opt => {
                const isActive = scope === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setScope(opt.id)}
                    className="flex-shrink-0 active:scale-[0.97] transition-all"
                    style={{
                      padding: '7px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      minHeight: 44,
                      background: isActive ? '#F5A623' : 'white',
                      color: isActive ? 'white' : '#64748B',
                      border: isActive ? '1.5px solid #F5A623' : '1.5px solid rgba(0,0,0,0.07)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Club search — shown when club scope active */}
            {scope === 'club' && (
              <ClubSearchBar
                selectedClubId={selectedClubId}
                selectedClubName={selectedClubName}
                userHomeClubId={userHomeClubId}
                userHomeClubName={userHomeClubName}
                onClubSelect={handleClubSelect}
              />
            )}

            {/* Country selector — shown when country scope active */}
            {scope === 'country' && (
              <CountrySelector
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
              />
            )}
          </div>
        }
      />
    </div>
  );
}
