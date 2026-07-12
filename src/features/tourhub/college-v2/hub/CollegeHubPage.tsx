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
import { Search, X } from 'lucide-react';
import { TourHubShell } from '@/features/tourhub/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '@/features/tourhub/_shared/tokens';
import { useFranchiseStandings } from './data/useFranchiseStandings';
import { useLiveAlumni } from './data/useLiveAlumni';
import { YearbookCard } from './YearbookCard';

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
      <div
        className="pb-24"
        style={{
          background: SLATE_50,
          minHeight: '100vh',
          fontFamily: FONT,
        }}
      >
        {/* Header */}
        <header style={{ padding: '16px 16px 12px', background: SLATE_50 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: AMBER,
                  marginBottom: 4,
                }}
              >
                The Franchise
              </div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {year}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setSearchExpanded((v) => !v)}
              aria-label="Search colleges"
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: SURFACE,
                border: `0.5px solid ${HAIRLINE_INK_10}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {searchExpanded ? (
                <X size={14} color={INK} strokeWidth={2.4} />
              ) : (
                <Search size={13} color={INK} strokeWidth={2.4} />
              )}
            </button>
          </div>

          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: INK_MUTE,
              marginTop: 8,
              letterSpacing: '-0.005em',
              lineHeight: 1.45,
            }}
          >
            {editorialLine}
          </div>

          {searchExpanded && (
            <div style={{ marginTop: 12, position: 'relative' }}>
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
          )}
        </header>

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
                padding: '48px 24px',
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
              />
            ))
          )}
        </div>
      </div>
    </TourHubShell>
  );
}

export default CollegeHubPage;
