/**
 * CollegeHubPage - "The Yearbook".
 *
 * Colleges ranked by their alumni on tour. Header: THE FRANCHISE eyebrow +
 * year + expanding search icon. Feed: YearbookCard per college. Search
 * filters the feed in place by college_name / short_name / normalized_name.
 *
 * No ShellSlot, no CollegeShellRow, no framer-motion.
 * Entry point wiring: /tourhub/college-golf (App.tsx route). TourHubMainPage
 * navigates to this path when 'college' is chosen from the side menu - the
 * page swap in App.tsx is sufficient to cut both entries over.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TourHubShell } from '@/features/tourhub/components';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AMBER,
  CHARCOAL,
  FONT,
  HAIRLINE_INK_10,
  INK,
  HERO_MIN_H,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SURFACE,
  WHITE_ALPHA_65,
} from '@/features/tourhub/_shared/tokens';
import { collegeH2HRoute } from '@/features/tourhub/routes';
import { useFranchiseStandings } from './data/useFranchiseStandings';
import { useLiveAlumni } from './data/useLiveAlumni';
import { YearbookCard } from './YearbookCard';
import { CollegeHeroMasthead } from '../_shared/CollegeHeroMasthead';
import { Skeleton } from '@/components/ui/skeleton';


export function CollegeHubPage() {
  const { t } = useTranslation('tourhub');
  const { data, isLoading, isError, refetch } = useFranchiseStandings();
  const { data: liveAlumni } = useLiveAlumni();

  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebouncedValue(searchValue, 200);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
  }, [searchExpanded]);

  const standings = data?.standings ?? [];
  const year = data?.year ?? new Date().getFullYear();
  const totalLive = liveAlumni?.totalLive ?? 0;
  const liveByCollege = liveAlumni?.byCollege ?? {};
  const leader = standings[0];
  const leaderPlayingNow = leader ? liveByCollege[leader.normalizedName] ?? 0 : 0;

  // -- Compare pick mode ------------------------------------------------
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const compareParam = searchParams.get('compare');
  const [pickMode, setPickMode] = useState<boolean>(Boolean(compareParam));
  const [pickC1, setPickC1] = useState<string | null>(compareParam);
  const [pickC2, setPickC2] = useState<string | null>(null);

  // If ?compare=slug arrives later, sync into state.
  const deepLinkTrackedRef = useRef(false);
  useEffect(() => {
    if (compareParam) {
      if (!deepLinkTrackedRef.current) {
        deepLinkTrackedRef.current = true;
        analyticsEvents.track('tour_college_compare_started', { from: 'deeplink' });
      }
      setPickMode(true);
      setPickC1((prev) => prev ?? compareParam);
    }
  }, [compareParam]);

  const nameForSlug = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of standings) map[s.normalizedName] = s.collegeName;
    return map;
  }, [standings]);

  const enterPickMode = () => {
    analyticsEvents.track('tour_college_compare_started', { from: 'header' });
    setPickMode(true);
    setPickC1(null);
    setPickC2(null);
  };

  const exitPickMode = () => {
    setPickMode(false);
    setPickC1(null);
    setPickC2(null);
    if (searchParams.has('compare')) {
      const next = new URLSearchParams(searchParams);
      next.delete('compare');
      setSearchParams(next, { replace: true });
    }
  };

  const handleSelectForCompare = (slug: string) => {
    if (!pickC1) {
      setPickC1(slug);
      return;
    }
    if (slug === pickC1) return; // ignore same pick
    // Both chosen -> route to duel.
    navigate(collegeH2HRoute(pickC1, slug));
  };


  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return standings;
    return standings.filter((s) => {
      const hay = `${s.collegeName} ${s.shortName ?? ''} ${s.normalizedName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [standings, debouncedSearch]);

  const editorialLine =
    totalLive > 0
      ? t('college.hub.subtitle', { count: totalLive })
      : t('college.hub.subtitleIdle');

  // ---- Analytics -----------------------------------------------------
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || standings.length === 0) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_college_hub_viewed', {
      year,
      colleges: standings.length,
      total_live: totalLive,
    });
  }, [standings.length, year, totalLive]);

  const searchedRef = useRef('');
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q || searchedRef.current === q) return;
    searchedRef.current = q;
    analyticsEvents.track('tour_college_searched', {
      query_length: q.length,
      results: filtered.length,
    });
  }, [debouncedSearch, filtered.length]);

  return (
    <TourHubShell showBack={false} immersiveStatusBar>
      {/* Hero bleeds into the notch - no GlassHeaderPlate veil (matches profile page). */}

      <div
        className="pb-22"
        style={{
          background: SLATE_50,
          minHeight: '100vh',
          fontFamily: FONT,
        }}
      >
        {/* Hero - leader takes the hero (or charcoal fallback when no standings). */}
        {leader ? (
          <CollegeHeroMasthead
            displayName={leader.collegeName}
            logoUrl={leader.logoUrl}
            brandHex={leader.brandHex}
            rank={leader.rank}
            pointsTotal={leader.earningsTotal}
            alumniCount={leader.alumniCount}
            playingNow={leaderPlayingNow}
            rankChange={leader.rankChange}
          />
        ) : (
          <header
            style={{
              background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
              minHeight: HERO_MIN_H,
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 62px)',
              paddingLeft: 16,
              paddingRight: 16,
              paddingBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#FFFFFF',
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: AMBER,
                marginBottom: 6,
              }}
            >
              The Franchise
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {year}
            </h1>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: WHITE_ALPHA_65,
                marginTop: 10,
                letterSpacing: '-0.005em',
                lineHeight: 1.45,
              }}
            >
              {editorialLine}
            </div>
          </header>
        )}


        {/* Sticky glass search row - locks under island band; filters the feed. */}
        <div
          style={{
            position: 'sticky',
            top: 'var(--sat, 0px)',
            zIndex: 10,
            background: 'rgba(248,250,252,0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            padding: '8px 16px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={13}
              color={AMBER}
              strokeWidth={2.5}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('college.hub.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchExpanded(true)}
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 30,
                paddingRight: 30,
                borderRadius: 8,
                background: SURFACE,
                border: `1px solid ${HAIRLINE_INK_10}`,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: INK,
                outline: 'none',
              }}
            />
            {searchValue && (
              <button
                type="button"
                aria-label={t('college.hub.clearSearchAria')}
                onClick={() => setSearchValue('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                }}
              >
                <X size={12} color={INK_MUTE} />
              </button>
            )}
          </div>
        </div>

        {/* Compare entry / pick-mode banner */}
        {pickMode ? (
          <div
            style={{
              padding: '10px 16px 12px',
              background: 'rgba(247,147,30,0.06)',
              borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: FONT,
            }}
          >
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: INK_FAINT,
                }}
              >
                {pickC1 ? t('college.hub.pickOneMore') : t('college.hub.pickTwo')}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {pickC1 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: SURFACE,
                      border: `1px solid ${HAIRLINE_INK_10}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: INK,
                    }}
                  >
                    {nameForSlug[pickC1] ?? pickC1}
                    <button
                      type="button"
                      aria-label={t('college.hub.removeSchoolAria')}
                      onClick={() => setPickC1(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        display: 'inline-flex',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={11} color={INK_MUTE} />
                    </button>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={exitPickMode}
              style={{
                fontFamily: FONT,
                background: 'transparent',
                border: 'none',
                color: INK_MUTE,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: SURFACE,
              borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: INK,
              }}
            >
              {t('college.hub.kicker')}
            </div>
            <button
              type="button"
              onClick={enterPickMode}
              style={{
                fontFamily: FONT,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: INK,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {t('college.hub.compare')}
              <ChevronRight size={12} strokeWidth={2.4} />
            </button>
          </div>
        )}

        {/* Feed */}
        <div style={{ background: SURFACE }}>
          {isLoading ? (
            <div style={{ padding: '8px 0' }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="light"
                  style={{
                    height: 82,
                    margin: '0 16px',
                    borderRadius: 0,
                    borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
                  }}
                />
              ))}
            </div>
          ) : isError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>
                Couldn't load the yearbook
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: INK_MUTE, maxWidth: 280 }}>
                Check your connection and try again.
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                style={{ background: INK, color: SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: INK_FAINT,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {debouncedSearch
                ? `No colleges match "${debouncedSearch}".`
                : t('college.hub.empty')}
            </div>
          ) : (
            filtered.map((s) => (
              <YearbookCard
                key={s.normalizedName}
                standing={s}
                liveCount={liveByCollege[s.normalizedName] ?? 0}
                onSelect={pickMode ? handleSelectForCompare : undefined}
                selected={pickMode && pickC1 === s.normalizedName}
                onTap={(mode) =>
                  analyticsEvents.track('tour_college_tapped', {
                    slug: s.normalizedName,
                    rank: s.rank,
                    live_count: liveByCollege[s.normalizedName] ?? 0,
                    mode,
                  })
                }
              />
            ))
          )}
        </div>

        {/* Footer: sample and method, always visible. */}
        <div
          style={{
            padding: '14px 16px 0',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: INK_FAINT,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {t('college.hub.footer', { year })}
        </div>
      </div>
    </TourHubShell>
  );
}

export default CollegeHubPage;
