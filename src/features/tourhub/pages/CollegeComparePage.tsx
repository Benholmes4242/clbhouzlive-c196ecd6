import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { TourHubShell } from '../components';
import { ShellSlot } from '@/components/header/ShellSlot';

import { CollegeCompareHero } from '../components/college/CollegeCompareHero';
import { useCollegeCompare } from '../hooks/useCollegeCompare';
import { useCollegeSearch } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useTourSeason } from '../hooks/useTourHubData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { PlayerInitialAvatar } from '../components/shared/PlayerInitialAvatar';
import { AMBER, HAIRLINE_INK_8, INK, INK_ALPHA_45, INK_FAINT, INK_TINT_05, INK_TINT_06, INK_TINT_07, SLATE_50, SURFACE } from '../_shared/tokens';

/**
 * Convert "northwestern" or "wake-forest" → "Northwestern" / "Wake Forest"
 * Used when collegeMap isn't loaded yet.
 */
function formatCollegeName(normalizedName: string): string {
  return normalizedName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * College Compare Page - Side-by-side comparison of two colleges.
 * Route: /tourhub/college-golf/compare?c1=<slug>&c2=<slug>
 */
export function CollegeComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const c1 = searchParams.get('c1') || '';
  const c2 = searchParams.get('c2') || '';

  const { data, isLoading, error } = useCollegeCompare(c1, c2);

  const hasValidParams = c1 && c2;

  // ── Picker state (active when c1 set but c2 missing, or both missing) ──
  const [pickerInput, setPickerInput] = useState('');
  const debouncedPickerInput = useDebouncedValue(pickerInput, 200);
  const showPickerResults = debouncedPickerInput.length >= 2;
  const { data: pickerResults, isLoading: pickerLoading } = useCollegeSearch(
    showPickerResults ? debouncedPickerInput : ''
  );
  const { data: collegeMap } = useCollegeMediaMap();

  const c1DisplayName =
    collegeMap?.get(c1)?.short_name ||
    collegeMap?.get(c1)?.college_name ||
    (c1 ? formatCollegeName(c1) : '');

  const handlePickCollege = (normalizedName: string) => {
    if (!c1) {
      setSearchParams({ c1: normalizedName }, { replace: false });
    } else {
      setSearchParams({ c1, c2: normalizedName }, { replace: false });
    }
    setPickerInput('');
  };

  const { data: season } = useTourSeason();
  const seasonYear = season?.year || new Date().getFullYear();

  const seasonLabel = `Season ${seasonYear === 2026 ? '2025–26' : `${seasonYear - 1}–${String(seasonYear).slice(-2)}`}`;

  const h1Text = (() => {
    if (isLoading) return 'Head-to-Head';
    if (!hasValidParams) return 'Head-to-Head';
    if (data) {
      const n1 = data.college1.media?.short_name || data.college1.media?.college_name || 'College 1';
      const n2 = data.college2.media?.short_name || data.college2.media?.college_name || 'College 2';
      return `${n1} vs ${n2}`;
    }
    return 'Head-to-Head';
  })();

  const subheadText = (() => {
    if (!hasValidParams) {
      return `Pick two colleges to compare · ${seasonLabel}`;
    }
    if (data) {
      const totalAlumni = (data.college1.stats?.player_count || 0) + (data.college2.stats?.player_count || 0);
      return `${seasonLabel} · ${totalAlumni} alumni compared`;
    }
    return seasonLabel;
  })();

  return (
    <TourHubShell>
      <ShellSlot>
        <button
          type="button"
          onClick={() => navigate('/tourhub/college-golf')}
          aria-label="Head-to-Head — open College Franchise"
          style={{
            background: SLATE_50,
            border: 'none',
            padding: '14px 16px 12px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            textAlign: 'left' as const,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <ArrowLeftRight size={11} strokeWidth={2.5} color={AMBER} style={{ marginTop: -4 }} />
            <Kicker color="slate">Head-to-head</Kicker>
            <ChevronRight size={11} strokeWidth={2.5} color={AMBER} style={{ marginTop: -4 }} />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: INK,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {h1Text}
          </h1>
          {subheadText && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: INK_FAINT,
                lineHeight: 1.4,
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subheadText}
            </div>
          )}
        </button>
      </ShellSlot>

      <div
        className="relative min-h-screen"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: SLATE_50 }}
      >
        {/* Season caps row removed — season appears in hero subhead + verdict eyebrow */}

        {/* ── CONTENT ── */}
        <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}>
          {/* Loading skeleton renders in body, not pinned */}
          {isLoading && hasValidParams && (
            <div style={{ padding: '12px 16px' }}>
              <div
                className="animate-pulse"
                style={{
                  height: 10,
                  width: 180,
                  borderRadius: 4,
                  background: INK_TINT_06,
                }}
              />
            </div>
          )}
          {!hasValidParams ? (
            <div style={{ padding: '20px' }}>
              {/* Heading */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                  Step {c1 ? '2' : '1'} of 2
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                  {c1
                    ? `Pick a college to compare against ${c1DisplayName}`
                    : 'Pick two colleges to compare'}
                </div>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative' as const, marginBottom: 16 }}>
                <Search
                  size={18}
                  style={{ position: 'absolute' as const, left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,23,42,0.4)' }}
                />
                <input
                  type="text"
                  value={pickerInput}
                  onChange={e => setPickerInput(e.target.value)}
                  placeholder="Search colleges…"
                  autoFocus
                  style={{
                    width: '100%', height: 48, padding: '0 40px 0 44px',
                    background: SURFACE, border: `1px solid ${HAIRLINE_INK_8}`,
                    borderRadius: 12, fontSize: 15, fontWeight: 500, color: INK,
                    outline: 'none',
                  }}
                />
                {pickerInput && (
                  <button
                    onClick={() => setPickerInput('')}
                    style={{
                      position: 'absolute' as const, right: 10, top: '50%', transform: 'translateY(-50%)',
                      width: 28, height: 28, borderRadius: '50%',
                      background: INK_TINT_06, border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    aria-label="Clear search"
                  >
                    <X size={14} color={INK} />
                  </button>
                )}
              </div>

              {/* Results */}
              {!showPickerResults ? (
                <div style={{ textAlign: 'center' as const, padding: '32px 16px', fontSize: 13, color: INK_ALPHA_45, fontWeight: 500 }}>
                  Start typing to find a college
                </div>
              ) : pickerLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse" style={{ height: 60, borderRadius: 12, background: INK_TINT_05 }} />
                  ))}
                </div>
              ) : pickerResults && pickerResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {pickerResults
                    .filter(stats => stats.normalized_name !== c1)
                    .map(stats => {
                      const college = collegeMap?.get(stats.normalized_name) || null;
                      const displayName = college?.short_name || college?.college_name || formatCollegeName(stats.normalized_name);
                      const logoUrl = getCollegeLogoUrl(college?.college_name || displayName);
                      const earnings = (stats as any).season_earnings ?? (stats as any).earnings_total ?? 0;
                      return (
                        <button
                          key={stats.normalized_name}
                          onClick={() => handlePickCollege(stats.normalized_name)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            width: '100%', padding: 12,
                            background: SURFACE, border: `1px solid ${HAIRLINE_INK_8}`,
                            borderRadius: 12, cursor: 'pointer', textAlign: 'left' as const,
                          }}
                          className="active:scale-[0.98] transition-transform"
                        >
                          <PlayerInitialAvatar
                            name={displayName}
                            src={logoUrl}
                            size={40}
                            radius={9}
                            paletteSeed={stats.normalized_name}
                            imageScale={0.78}
                            imageBg="#FFFFFF"
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                              {displayName}
                            </div>
                            {earnings > 0 && (
                              <div style={{ fontSize: 12, color: 'rgba(15,23,42,0.5)', fontWeight: 500, marginTop: 2 }}>
                                {earnings >= 1_000_000
                                  ? `$${(earnings / 1_000_000).toFixed(1)}M season`
                                  : `${formatCurrency(earnings)} season`}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div style={{ textAlign: 'center' as const, padding: '32px 16px', fontSize: 13, color: INK_ALPHA_45, fontWeight: 500 }}>
                  No colleges found matching "{debouncedPickerInput}"
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div>
              <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}` }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: `0.5px solid ${INK_TINT_07}`, height: '48px' }}>
                    <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: INK_TINT_06 }} />
                    <div style={{ width: '80px', height: '3px', borderRadius: '2px', background: INK_TINT_06, margin: '0 8px' }} />
                    <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: INK_TINT_06 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center' as const, padding: '48px 20px' }}>
              <p style={{ fontSize: '15px', color: INK_FAINT }}>Failed to load comparison data</p>
            </div>
          ) : data ? (
            <CollegeCompareHero data={data} />
          ) : null}
        </div>
      </div>
    </TourHubShell>
  );
}
