import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import {
  useExplorationLeaderboard,
  useUserExplorationStatus,
  useCountriesByMemberCount,
} from '@/hooks/leaderboards';
import { useDailyEditorial } from '@/hooks/championship';
import { supabase } from '@/integrations/supabase/client';
import { getProfilePathById } from '@/lib/profileRoutes';
import { continentForCountry } from '@/lib/countryContinent';
import {
  EXPLORER_TIERS,
  getUserTier,
  getNextTier,
  getTierAbbr,
  getTierShortName,
} from '@/config/explorerTiers';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { ClubSearchBar } from './ClubSearchBar';
import { CountrySelector } from '../shared/CountrySelector';
import { EditorialLedeSkeleton } from '../shared/EditorialLedeSkeleton';
import type { LeaderboardScope, ExplorationLeaderboardEntry } from '@/types/leaderboards';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const STORAGE_KEY_SCROLL = 'exploration-leaderboard-scroll';
const STORAGE_KEY_FILTERS = 'exploration-leaderboard-filters';

// Editorial palette — reserved for live pip, YOU indicator, eyebrow.
const CRIMSON = '#9F1D1D';
const INK = '#0F172A';
const INK_BODY = '#475569';
const INK_MUTED = '#64748B';
const INK_FAINT = '#94A3B8';
const HAIRLINE = '#CBD5E1';
const BG = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_DARK = '#F59E0B';

// ----------------------------------------------------------------------------
// Filter persistence
// ----------------------------------------------------------------------------

function loadSavedFilters() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


function selectGlobalEyebrow(args: {
  isLoggedIn: boolean;
  hasData: boolean;
  userTierId: string;
  userRank: number | null;
  countriesNeeded: number;
  continentsNeeded: number;
  isMaxTier: boolean;
  defaultEyebrow: string;
}): string {
  if (!args.isLoggedIn || !args.hasData || args.userRank === null) {
    return 'LOG A ROUND TO ENTER';
  }
  if (args.isMaxTier) return "YOU'VE REACHED THE SUMMIT";
  if (args.countriesNeeded === 0 && args.continentsNeeded === 0) {
    return 'TIER PROMOTION INCOMING';
  }
  if (args.countriesNeeded <= 1 || args.continentsNeeded === 1) {
    return 'ONE STEP FROM PROMOTION';
  }
  if (args.userRank <= 10) return 'THE GLOBAL TOP TEN · YOUR JOURNEY';
  if (args.userRank <= 30) return 'THE GLOBAL FIELD · YOUR JOURNEY';
  return args.defaultEyebrow;
}

function generateTierCaption(
  countries: number,
  continents: number,
  currentTierName: string,
  nextTier: { name: string; minCountries: number; minContinents: number } | null,
): React.ReactNode {
  if (!nextTier) {
    return `You've reached ${currentTierName}, the highest tier on clbhouz. Keep exploring.`;
  }
  const countriesNeeded = Math.max(0, nextTier.minCountries - countries);
  const continentsNeeded = Math.max(0, nextTier.minContinents - continents);
  if (countriesNeeded === 0 && continentsNeeded === 0) {
    return (
      <>
        You've met the criteria for{' '}
        <span style={{ color: AMBER, fontWeight: 700 }}>{nextTier.name}</span> —
        your tier will update on the next refresh.
      </>
    );
  }
  const parts: string[] = [];
  if (countriesNeeded > 0) {
    parts.push(`${countriesNeeded} more ${countriesNeeded === 1 ? 'country' : 'countries'}`);
  }
  if (continentsNeeded > 0) {
    parts.push(`${continentsNeeded} more ${continentsNeeded === 1 ? 'continent' : 'continents'}`);
  }
  return (
    <>
      {parts.join(' and ')} to unlock{' '}
      <span style={{ color: AMBER, fontWeight: 700 }}>{nextTier.name}</span>.
    </>
  );
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ExplorationTab() {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const savedFilters = useRef(loadSavedFilters()).current;

  // Player view filters
  const [scope, setScope] = useState<LeaderboardScope>(() => savedFilters?.scope ?? 'global');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(() => savedFilters?.selectedClubId ?? null);
  const [selectedClubName, setSelectedClubName] = useState<string | null>(() => savedFilters?.selectedClubName ?? null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => savedFilters?.selectedCountry ?? null);
  const [viewMode, setViewMode] = useState<'player' | 'country'>(() => savedFilters?.viewMode ?? 'player');

  const [userHomeClubId, setUserHomeClubId] = useState<string | null>(null);
  const [userHomeClubName, setUserHomeClubName] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);
  const scrollPositionRef = useRef(0);
  const isFilterChangeRef = useRef(false);

  // Persist filters
  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY_FILTERS,
      JSON.stringify({ scope, selectedClubId, selectedClubName, selectedCountry, viewMode }),
    );
    isFilterChangeRef.current = true;
    scrollPositionRef.current = (() => {
      const rootEl = document.getElementById('root');
      return (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    })();
  }, [scope, selectedClubId, selectedClubName, selectedCountry, viewMode]);

  // Preserve scroll on filter change
  useLayoutEffect(() => {
    if (isFilterChangeRef.current) {
      isFilterChangeRef.current = false;
      const scrollTarget = scrollPositionRef.current;
      if (scrollTarget > 0) {
        const rootEl = document.getElementById('root');
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
      }
    }
  });

  useEffect(() => {
    if (scope !== 'country') setSelectedCountry(null);
  }, [scope]);

  // Fetch user's home club + country
  useEffect(() => {
    async function fetchUserHomeClub() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('primary_club_id, country, golf_clubs!user_profiles_primary_club_id_fkey(name, country)')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.primary_club_id) {
        setUserHomeClubId(data.primary_club_id);
        setUserHomeClubName((data.golf_clubs as any)?.name || null);
      }
      const clubCountry = (data?.golf_clubs as any)?.country;
      setUserCountry(clubCountry || data?.country || null);
    }
    fetchUserHomeClub();
  }, [user?.id]);

  useEffect(() => {
    if (scope === 'club' && !selectedClubId && userHomeClubId) {
      setSelectedClubId(userHomeClubId);
      setSelectedClubName(userHomeClubName);
    }
  }, [scope, selectedClubId, userHomeClubId, userHomeClubName]);

  useEffect(() => {
    if (scope === 'country' && !selectedCountry && userCountry) {
      setSelectedCountry(userCountry);
    }
  }, [scope, selectedCountry, userCountry]);

  // ---- Data ----
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useExplorationLeaderboard({
    scope,
    metric: 'countries',
    clubId: scope === 'club' ? selectedClubId : null,
    country: scope === 'country' ? selectedCountry : null,
    enabled: viewMode === 'player',
  });

  const allEntries = useMemo(
    () => data?.pages.flatMap((p) => p.entries) ?? [],
    [data?.pages],
  );

  const { data: userStatus } = useUserExplorationStatus({ userId: user?.id });

  const {
    data: countryData,
    hasNextPage: countryHasNext,
    fetchNextPage: countryFetchNext,
    isFetchingNextPage: countryIsFetchingNext,
    isLoading: countryIsLoading,
  } = useCountriesByMemberCount({ enabled: viewMode === 'country' });

  const allCountries = useMemo(
    () => countryData?.pages.flatMap((p) => p.entries) ?? [],
    [countryData?.pages],
  );

  // Editorial (Global surface)
  const { data: editorial, isPending: editorialPending } = useDailyEditorial({
    surface: 'global',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // ---- Derived user stats ----
  const countriesPlayed = userStatus?.countries_count ?? 0;
  const continentsPlayed = userStatus?.continents_count ?? 0;
  const userGlobalRank = userStatus?.global_rank ?? null;
  const userFriendsRank = userStatus?.friends_rank ?? null;
  const userVisibleRank = scope === 'friends' ? userFriendsRank : userGlobalRank;

  const currentTier = useMemo(
    () => getUserTier(countriesPlayed, continentsPlayed),
    [countriesPlayed, continentsPlayed],
  );
  const nextTier = useMemo(() => getNextTier(currentTier.id), [currentTier.id]);
  const isMaxTier = !nextTier;

  const countriesNeeded = nextTier ? Math.max(0, nextTier.minCountries - countriesPlayed) : 0;
  const continentsNeeded = nextTier ? Math.max(0, nextTier.minContinents - continentsPlayed) : 0;

  // ---- Editorial eyebrow (personalised) ----
  const personalisedEyebrow = useMemo(() => {
    return selectGlobalEyebrow({
      isLoggedIn: !!user,
      hasData: countriesPlayed > 0,
      userTierId: currentTier.id,
      userRank: userVisibleRank,
      countriesNeeded,
      continentsNeeded,
      isMaxTier,
      defaultEyebrow: editorial?.eyebrow ?? 'THE GLOBAL FIELD',
    });
  }, [user, countriesPlayed, currentTier.id, userVisibleRank, countriesNeeded, continentsNeeded, isMaxTier, editorial?.eyebrow]);

  // ---- Editorial fallback ----
  const headline = editorial?.headline ?? 'The map';
  const headlineTwo = editorial?.headlineTwo ?? 'is open.';
  const standfirst =
    editorial?.standfirst ??
    'The global standings are just getting started. Every new country logged is one closer to the top of the explorer\u2019s board.';

  // ---- Scroll restore ----
  useEffect(() => {
    if (hasRestoredScroll.current || (allEntries.length === 0 && allCountries.length === 0)) return;
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem(STORAGE_KEY_SCROLL);
      });
    }
  }, [allEntries.length, allCountries.length]);

  // ---- Infinite scroll ----
  const isFetchingRef = useRef(isFetchingNextPage || countryIsFetchingNext);
  isFetchingRef.current = isFetchingNextPage || countryIsFetchingNext;

  useEffect(() => {
    if (!sentinelRef.current) return;
    const hasMore = viewMode === 'player' ? hasNextPage : countryHasNext;
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingRef.current) {
          if (viewMode === 'player') fetchNextPage();
          else countryFetchNext();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [viewMode, hasNextPage, countryHasNext, fetchNextPage, countryFetchNext]);

  const handleEntryClick = useCallback(() => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
  }, []);

  const handleClubSelect = (clubId: string | null, clubName: string | null) => {
    setSelectedClubId(clubId);
    setSelectedClubName(clubName);
  };

  // ---- Render ----
  return (
    <div
      style={{
        background: BG,
        minHeight: '100%',
        fontFamily: '"Geist", system-ui, -apple-system, sans-serif',
        color: INK,
      }}
    >
      {/* 2. MASTHEAD */}
      <div
        style={{
          padding: '20px 20px 14px',
          borderBottom: `3px double ${INK}`,
          textAlign: 'center',
          background: BG,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            color: INK_MUTED,
            letterSpacing: '0.18em',
            marginBottom: 12,
            minHeight: 14,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: CRIMSON, display: 'inline-block' }} />
          {!user || countriesPlayed === 0 ? (
            <span style={{ color: CRIMSON }}>THE WORLD IS OPEN</span>
          ) : (
            <span style={{ color: CRIMSON }}>
              {countriesPlayed} {countriesPlayed === 1 ? 'COUNTRY' : 'COUNTRIES'} ON YOUR JOURNEY
            </span>
          )}
        </div>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            letterSpacing: '-0.035em',
            margin: 0,
            lineHeight: 0.95,
            color: INK,
          }}
        >
          The Global Field
        </h1>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.32em',
            color: INK_MUTED,
            marginTop: 6,
          }}
        >
          GOLF&rsquo;S GREAT EXPLORERS
        </div>
      </div>

      {/* 3. VIEW TOGGLE */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8 }}>
        {[
          { key: 'player' as const, label: 'By Player' },
          { key: 'country' as const, label: 'By Country' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setViewMode(opt.key)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 8,
              background: viewMode === opt.key ? INK : 'transparent',
              color: viewMode === opt.key ? '#fff' : INK_MUTED,
              border: viewMode === opt.key ? 'none' : '1px solid rgba(15,23,42,0.15)',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 4. FRONT-PAGE LEDE */}
      {editorialPending ? (
        <EditorialLedeSkeleton />
      ) : (
        <div style={{ padding: '22px 20px 0', textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.28em',
              color: CRIMSON,
              marginBottom: 10,
            }}
          >
            {personalisedEyebrow}
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.05,
              color: INK,
            }}
          >
            {headline}
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 900, color: INK_BODY }}>
              {headlineTwo}
            </span>
          </h2>
          <p
            style={{
              fontSize: 13,
              color: INK_MUTED,
              lineHeight: 1.55,
              marginTop: 12,
              marginBottom: 0,
              fontStyle: 'italic',
            }}
          >
            {standfirst}
          </p>
        </div>
      )}

      {/* 5. THE BOX SCORE */}
      <div style={{ padding: '20px 20px 0' }}>
        <div
          style={{
            borderTop: `1px solid ${INK}`,
            borderBottom: `1px solid ${INK}`,
            padding: '16px 0',
            display: 'grid',
            gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
            alignItems: 'center',
          }}
        >
          {/* Countries */}
          <BoxStat
            label="COUNTRIES"
            value={countriesPlayed > 0 ? String(countriesPlayed) : '—'}
            color={CRIMSON}
          />
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />
          {/* Continents */}
          <BoxStat
            label="CONTINENTS"
            value={continentsPlayed > 0 ? String(continentsPlayed) : '—'}
            color={CRIMSON}
          />
          <div style={{ height: 36, background: 'rgba(15,23,42,0.1)' }} />
          {/* Rank */}
          <BoxStat
            label={scope === 'friends' ? 'FRIENDS RANK' : 'GLOBAL RANK'}
            value={userVisibleRank ? `#${userVisibleRank}` : '—'}
            color={isMaxTier && countriesPlayed > 0 ? CRIMSON : INK}
          />
        </div>
      </div>

      {/* 6. YOUR TIER CARD or CTA */}
      {countriesPlayed > 0 ? (
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              background: INK,
              color: '#fff',
              borderRadius: 4,
              overflow: 'hidden',
              padding: '16px 18px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle at top right, rgba(247,147,30,0.18), transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Tier row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                position: 'relative',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.22em',
                    marginBottom: 4,
                  }}
                >
                  YOUR TIER
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.05,
                  }}
                >
                  {currentTier.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.22em',
                    marginBottom: 4,
                  }}
                >
                  {nextTier ? 'NEXT' : 'STATUS'}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: AMBER,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {nextTier?.name ?? 'MAX TIER'}
                </div>
              </div>
            </div>

            {/* Progress tracks */}
            {nextTier && (
              <div
                style={{
                  paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <ProgressTrack
                  label="Countries"
                  current={countriesPlayed}
                  target={nextTier.minCountries}
                />
                <ProgressTrack
                  label="Continents"
                  current={continentsPlayed}
                  target={nextTier.minContinents}
                />
              </div>
            )}

            {/* Caption */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.4,
              }}
            >
              {generateTierCaption(countriesPlayed, continentsPlayed, currentTier.name, nextTier)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 20px 0' }}>
          <div
            style={{
              background: INK,
              color: '#fff',
              borderRadius: 4,
              padding: '20px 18px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 12,
                lineHeight: 1.4,
              }}
            >
              Log your first round to begin your explorer journey.
            </div>
            <button
              onClick={() => navigate('/courses')}
              style={{
                background: AMBER,
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              RATE A COURSE →
            </button>
          </div>
        </div>
      )}

      {/* 7. TIER LADDER */}
      <div style={{ padding: '22px 20px 0' }}>
        <SectionLabel>TIER LADDER</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
          {EXPLORER_TIERS.map((t, i) => {
            const isUnlocked =
              countriesPlayed >= t.minCountries && continentsPlayed >= t.minContinents;
            const isCurrent = t.id === currentTier.id && countriesPlayed > 0;
            return (
              <div
                key={t.id}
                style={{
                  borderRight: i < 4 ? '1px solid rgba(15,23,42,0.1)' : 'none',
                  padding: '10px 4px',
                  textAlign: 'center',
                  background: isCurrent ? 'rgba(159,29,29,0.04)' : 'transparent',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    marginBottom: 4,
                    color: isCurrent ? CRIMSON : isUnlocked ? INK_FAINT : HAIRLINE,
                  }}
                >
                  {isCurrent ? '● NOW' : isUnlocked ? 'DONE' : getTierAbbr(t.id)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: isCurrent ? INK : isUnlocked ? INK_FAINT : INK_MUTED,
                  }}
                >
                  {getTierShortName(t.id)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. COUNTRIES PLAYED */}
      {userStatus?.country_list && userStatus.country_list.length > 0 && (
        <div style={{ padding: '22px 20px 0' }}>
          <SectionLabel>{`COUNTRIES PLAYED · ${countriesPlayed}`}</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            {userStatus.country_list.map((country) => (
              <div
                key={country}
                style={{
                  width: 22,
                  height: 16,
                  borderRadius: 2,
                  border: '0.5px solid rgba(15,23,42,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: 'rgba(15,23,42,0.03)',
                }}
                title={country}
              >
                <CountryFlag country={country} size="sm" />
              </div>
            ))}
            {nextTier && (
              <div
                style={{
                  width: 22,
                  height: 16,
                  borderRadius: 2,
                  background: 'rgba(15,23,42,0.03)',
                  border: '0.5px dashed rgba(15,23,42,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: HAIRLINE,
                  fontWeight: 700,
                }}
                aria-label="Room to grow"
              >
                +
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. FULL STANDINGS */}
      <div style={{ padding: '26px 20px 0' }}>
        <SectionLabel>
          {viewMode === 'player' ? 'FULL STANDINGS' : 'COUNTRIES BY MEMBER COUNT'}
        </SectionLabel>

        {viewMode === 'player' ? (
          <PlayerStandings
            entries={allEntries}
            isLoading={isLoading && allEntries.length === 0}
            scope={scope}
            setScope={setScope}
            selectedClubId={selectedClubId}
            selectedClubName={selectedClubName}
            userHomeClubId={userHomeClubId}
            userHomeClubName={userHomeClubName}
            onClubSelect={handleClubSelect}
            selectedCountry={selectedCountry}
            onCountrySelect={setSelectedCountry}
            onRowClick={handleEntryClick}
            navigate={navigate}
          />
        ) : (
          <CountryStandings
            countries={allCountries}
            isLoading={countryIsLoading && allCountries.length === 0}
            userPlayed={userStatus?.country_list ?? []}
            navigate={navigate}
          />
        )}

        {/* Infinite scroll sentinel */}
        {((viewMode === 'player' && hasNextPage) || (viewMode === 'country' && countryHasNext)) && (
          <div ref={sentinelRef} style={{ height: 1, marginTop: 16 }} />
        )}
        {(isFetchingNextPage || countryIsFetchingNext) && (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: INK_FAINT }}>
            Loading…
          </div>
        )}
      </div>

      {/* 10. FOOTER CAPTION */}
      <div style={{ padding: '20px 20px 28px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 10,
            color: INK_FAINT,
            letterSpacing: '0.06em',
            fontStyle: 'italic',
          }}
        >
          {viewMode === 'player'
            ? 'Ranked by countries explored, then continents, then courses · Updated daily'
            : 'Ranked by member count · Updated daily'}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function BoxStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: INK_FAINT,
          letterSpacing: '0.18em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color,
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProgressTrack({
  label,
  current,
  target,
}: {
  label: string;
  current: number;
  target: number;
}) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#fff',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {current} <span style={{ color: 'rgba(255,255,255,0.4)' }}>/ {target}</span>
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${AMBER_DARK}, ${AMBER})`,
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
      <div style={{ width: 12, height: 1, background: INK }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: INK, letterSpacing: '0.22em' }}>
        {children}
      </span>
      <div style={{ width: 12, height: 1, background: INK }} />
      <div style={{ flex: 1, height: 1, background: 'rgba(15,23,42,0.15)' }} />
    </div>
  );
}

interface PlayerStandingsProps {
  entries: ExplorationLeaderboardEntry[];
  isLoading: boolean;
  scope: LeaderboardScope;
  setScope: (s: LeaderboardScope) => void;
  selectedClubId: string | null;
  selectedClubName: string | null;
  userHomeClubId: string | null;
  userHomeClubName: string | null;
  onClubSelect: (id: string | null, name: string | null) => void;
  selectedCountry: string | null;
  onCountrySelect: (c: string | null) => void;
  onRowClick: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

function PlayerStandings({
  entries,
  isLoading,
  scope,
  setScope,
  selectedClubId,
  selectedClubName,
  userHomeClubId,
  userHomeClubName,
  onClubSelect,
  selectedCountry,
  onCountrySelect,
  onRowClick,
  navigate,
}: PlayerStandingsProps) {
  return (
    <>
      {/* Scope tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, justifyContent: 'center' }}>
        {[
          { key: 'global' as const, label: 'Global' },
          { key: 'friends' as const, label: 'Friends' },
          { key: 'club' as const, label: 'Club' },
          { key: 'country' as const, label: 'Country' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              background: scope === s.key ? INK : 'transparent',
              color: scope === s.key ? '#fff' : INK_MUTED,
              border: scope === s.key ? 'none' : '1px solid rgba(15,23,42,0.15)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Conditional sub-controls */}
      {scope === 'club' && (
        <div style={{ marginBottom: 10 }}>
          <ClubSearchBar
            selectedClubId={selectedClubId}
            selectedClubName={selectedClubName}
            userHomeClubId={userHomeClubId}
            userHomeClubName={userHomeClubName}
            onClubSelect={onClubSelect}
          />
        </div>
      )}
      {scope === 'country' && (
        <div style={{ marginBottom: 10 }}>
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountrySelect={onCountrySelect}
          />
        </div>
      )}

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '26px 38px 1fr 28px 38px',
          padding: '10px 0 8px',
          borderBottom: `1px solid ${INK}`,
          fontSize: 9,
          fontWeight: 800,
          color: INK_FAINT,
          letterSpacing: '0.18em',
          alignItems: 'center',
        }}
      >
        <span>POS</span>
        <span />
        <span>PLAYER</span>
        <span style={{ textAlign: 'right' }}>CON</span>
        <span style={{ textAlign: 'right' }}>CTY</span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ padding: '20px 0' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '26px 38px 1fr 28px 38px',
                alignItems: 'center',
                gap: 4,
                padding: '12px 0',
                borderBottom: '1px solid rgba(15,23,42,0.07)',
              }}
            >
              <div style={{ height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 2 }} />
              <div style={{ width: 30, height: 30, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} />
              <div style={{ height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 2, width: '60%' }} />
              <div style={{ height: 12, background: 'rgba(15,23,42,0.06)', borderRadius: 2, justifySelf: 'end', width: 20 }} />
              <div style={{ height: 18, background: 'rgba(15,23,42,0.06)', borderRadius: 2, justifySelf: 'end', width: 32 }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && scope === 'friends' && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: INK_FAINT, fontStyle: 'italic', marginBottom: 14 }}>
            No friends explored yet.
          </p>
          <button
            onClick={() => navigate('/find-friends')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              color: CRIMSON,
              letterSpacing: '0.18em',
              fontFamily: 'inherit',
            }}
          >
            FIND FRIENDS →
          </button>
        </div>
      )}
      {!isLoading && entries.length === 0 && scope !== 'friends' && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: INK_FAINT, fontStyle: 'italic' }}>
            No explorers found here yet.
          </p>
        </div>
      )}

      {/* Player rows */}
      {entries.map((p, i) => {
        const isLast = i === entries.length - 1;
        const isYou = p.is_current_user;
        return (
          <div
            key={p.user_id}
            onClick={() => {
              onRowClick();
              navigate(getProfilePathById(p.user_id));
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: '26px 38px 1fr 28px 38px',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: isLast
                ? `1px solid ${INK}`
                : '1px solid rgba(15,23,42,0.07)',
              background: isYou ? 'rgba(159,29,29,0.04)' : 'transparent',
              marginLeft: isYou ? -10 : 0,
              marginRight: isYou ? -10 : 0,
              paddingLeft: isYou ? 10 : 0,
              paddingRight: isYou ? 10 : 0,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {isYou && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: CRIMSON,
                }}
              />
            )}

            {/* Rank */}
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: p.rank <= 3 ? INK : INK_FAINT,
                fontVariantNumeric: 'tabular-nums lining-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {p.rank}
            </span>

            {/* Avatar */}
            <div
              style={{
                width: 30,
                aspectRatio: '1 / 1.05',
                borderRadius: '34%',
                overflow: 'hidden',
                border: isYou
                  ? '0.5px solid #9F1D1D'
                  : '0.5px solid rgba(15,23,42,0.18)',
                background: '#fff',
              }}
            >
              <SquircleAvatar
                src={p.avatar_url}
                alt={p.display_name ?? p.username ?? ''}
                userId={p.user_id}
                size={30}
                fallback={getInitials(p.display_name ?? p.username ?? '')}
                hideRing
              />
            </div>

            {/* Name + caption */}
            <div style={{ minWidth: 0, paddingLeft: 4 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.005em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.display_name || p.username}
                {isYou && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: CRIMSON,
                      letterSpacing: '0.18em',
                      marginLeft: 6,
                    }}
                  >
                    YOU
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: INK_FAINT, marginTop: 1 }}>
                {p.home_club || 'Independent'}
              </div>
            </div>

            {/* Continents */}
            <span
              style={{
                textAlign: 'right',
                fontSize: 15,
                fontWeight: 800,
                color: INK_MUTED,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {p.continents_count}
            </span>

            {/* Countries */}
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                textAlign: 'right',
                color: INK,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {p.countries_count}
            </span>
          </div>
        );
      })}
    </>
  );
}

interface CountryStandingsProps {
  countries: Array<{ country: string; member_count: number }>;
  isLoading: boolean;
  userPlayed: string[];
  navigate: ReturnType<typeof useNavigate>;
}

function CountryStandings({ countries, isLoading, userPlayed, navigate }: CountryStandingsProps) {
  return (
    <>
      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '26px 28px 1fr 60px',
          padding: '10px 0 8px',
          borderBottom: `1px solid ${INK}`,
          fontSize: 9,
          fontWeight: 800,
          color: INK_FAINT,
          letterSpacing: '0.18em',
          alignItems: 'center',
        }}
      >
        <span>POS</span>
        <span />
        <span>COUNTRY</span>
        <span style={{ textAlign: 'right' }}>MEMBERS</span>
      </div>

      {isLoading && (
        <div style={{ padding: '20px 0' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '26px 28px 1fr 60px',
                alignItems: 'center',
                gap: 4,
                padding: '12px 0',
                borderBottom: '1px solid rgba(15,23,42,0.07)',
              }}
            >
              <div style={{ height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 2 }} />
              <div style={{ width: 22, height: 16, background: 'rgba(15,23,42,0.06)', borderRadius: 2 }} />
              <div style={{ height: 14, background: 'rgba(15,23,42,0.06)', borderRadius: 2, width: '60%' }} />
              <div style={{ height: 18, background: 'rgba(15,23,42,0.06)', borderRadius: 2, justifySelf: 'end', width: 36 }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && countries.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: INK_FAINT, fontStyle: 'italic' }}>
            No countries have been explored yet.
          </p>
        </div>
      )}

      {countries.map((c, i) => {
        const isLast = i === countries.length - 1;
        const userPlayedHere = userPlayed.includes(c.country);
        const continent = continentForCountry(c.country);

        return (
          <div
            key={c.country}
            onClick={() =>
              navigate(`/leaderboards?view=exploration&country=${encodeURIComponent(c.country)}`)
            }
            style={{
              display: 'grid',
              gridTemplateColumns: '26px 28px 1fr 60px',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: isLast
                ? `1px solid ${INK}`
                : '1px solid rgba(15,23,42,0.07)',
              cursor: 'pointer',
              position: 'relative',
              background: userPlayedHere ? 'rgba(247,147,30,0.03)' : 'transparent',
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: i < 3 ? INK : INK_FAINT,
                fontVariantNumeric: 'tabular-nums lining-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {i + 1}
            </span>

            <div
              style={{
                width: 22,
                height: 16,
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15,23,42,0.03)',
                border: '0.5px solid rgba(15,23,42,0.08)',
              }}
            >
              <CountryFlag country={c.country} size="sm" />
            </div>

            <div style={{ paddingLeft: 4, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.005em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.country}
                {userPlayedHere && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: AMBER,
                      letterSpacing: '0.14em',
                      marginLeft: 6,
                    }}
                  >
                    PLAYED
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: INK_FAINT, marginTop: 1 }}>
                {continent}
              </div>
            </div>

            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                textAlign: 'right',
                color: INK,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {c.member_count}
            </span>
          </div>
        );
      })}
    </>
  );
}
