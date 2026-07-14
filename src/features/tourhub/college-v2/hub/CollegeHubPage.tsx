/**
 * CollegeHubPage — "The Yearbook".
 *
 * Colleges ranked by their alumni on tour. Header: THE FRANCHISE eyebrow +
 * year + expanding search icon. Feed: YearbookCard per college. Search
 * filters the feed in place by college_name / short_name / normalized_name.
 *
 * No ShellSlot, no CollegeShellRow, no framer-motion.
 * Entry point wiring: /tourhub/college-golf (App.tsx route). TourHubMainPage
 * navigates to this path when 'college' is chosen from the side menu — the
 * page swap in App.tsx is sufficient to cut both entries over.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, X, Swords } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TourHubShell } from '@/features/tourhub/components';
import { GlassHeaderPlate } from '@/components/chrome/GlassHeaderPlate';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AMBER,
  CHARCOAL,
  FONT,
  HAIRLINE_INK_10,
  INK,
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


export function CollegeHubPage() {
  const { data, isLoading } = useFranchiseStandings();
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

  // ── Compare pick mode ────────────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const compareParam = searchParams.get('compare');
  const [pickMode, setPickMode] = useState<boolean>(Boolean(compareParam));
  const [pickC1, setPickC1] = useState<string | null>(compareParam);
  const [pickC2, setPickC2] = useState<string | null>(null);

  // If ?compare=slug arrives later, sync into state.
  useEffect(() => {
    if (compareParam) {
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
    // Both chosen → route to duel.
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
      ? `Colleges ranked by their alumni on tour \u2014 ${totalLive} ${totalLive === 1 ? 'alumnus is' : 'alumni are'} on the course right now.`
      : `Colleges ranked by their alumni on tour.`;

  return (
    <TourHubShell showBack={false}>
      {/* Always-on glass plate (island 70px). */}
      <GlassHeaderPlate />
      <div
        className="pb-22"
        style={{
          background: SLATE_50,
          minHeight: '100vh',
          fontFamily: FONT,
        }}
      >
        {/* Hero — leader takes the hero (or charcoal fallback when no standings). */}
        {leader ? (
          <CollegeHeroMasthead
            displayName={leader.collegeName}
            logoUrl={leader.logoUrl}
            brandHex={leader.brandHex}
            rank={leader.rank}
            pointsTotal={leader.pointsTotal}
            alumniCount={leader.alumniCount}
            playingNow={leaderPlayingNow}
            rankChange={leader.rankChange}
          />
        ) : (
          <header
            style={{
              background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
              minHeight:
                'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))',
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
                fontWeight: 800,
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
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
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


        {/* Sticky glass search row — locks under island band; filters the feed. */}
        <div
          style={{
            position: 'sticky',
            top: 'var(--sat, 0px)',
            zIndex: 10,
            background: 'rgba(248,250,252,0.72)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
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
              placeholder="Search colleges…"
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
                aria-label="Clear search"
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
            <Swords size={14} color={AMBER} strokeWidth={2.4} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: AMBER,
                }}
              >
                {pickC1 ? 'Pick one more school' : 'Pick two schools to compare'}
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
                      aria-label="Remove school"
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
                fontWeight: 800,
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
              padding: '8px 16px',
              display: 'flex',
              justifyContent: 'flex-end',
              background: SURFACE,
              borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
            }}
          >
            <button
              type="button"
              onClick={enterPickMode}
              style={{
                fontFamily: FONT,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                height: 26,
                padding: '0 10px',
                borderRadius: 999,
                border: `1px solid ${HAIRLINE_INK_10}`,
                background: SURFACE,
                color: INK,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <Swords size={12} color={AMBER} strokeWidth={2.4} />
              Compare schools
            </button>
          </div>
        )}

        {/* Feed */}
        <div style={{ background: SURFACE }}>
          {isLoading ? (
            <div style={{ padding: '8px 0' }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 82,
                    margin: '0 16px',
                    borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
                    background: 'rgba(15,23,42,0.04)',
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }}
                />
              ))}
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
                : 'No franchises ranked yet this season.'}
            </div>
          ) : (
            filtered.map((s) => (
              <YearbookCard
                key={s.normalizedName}
                standing={s}
                liveCount={liveByCollege[s.normalizedName] ?? 0}
                onSelect={pickMode ? handleSelectForCompare : undefined}
                selected={pickMode && pickC1 === s.normalizedName}
              />
            ))
          )}
        </div>
      </div>
    </TourHubShell>
  );
}

export default CollegeHubPage;
