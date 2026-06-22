import { useMemo, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ChevronRight, Crown, GraduationCap } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { TourHubShell } from '../components/TourHubShell';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  FranchiseStoryStrip,
  AlumniDepthChart,
  H2HRivalStrip,
} from '../components/college';
import { PlayerInitialAvatar } from '../components/shared/PlayerInitialAvatar';
import { splitStatValue } from '../utils/splitStatValue';

import { useCollegeStats, useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeAlumni } from '../hooks/useCollegeAlumni';
import { collegeHubRoute } from '../routes';
import {
  AMBER,
  GOLD,
  GOLD_BORDER,
  GOLD_DEEP,
  GOLD_TINT,
  GOLD_TINT_10,
  INK,
  INK_MUTE,
  INK_TINT_06,
  SLATE_50,
  SURFACE,
} from '../_shared/tokens';

/* ─── Hero subtitle: cross-tour roll-up ────────────────────────────────── */

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DPWT',
  dpwt: 'DPWT',
  champ: 'Champions',
  korn: 'Korn Ferry',
};

function buildCompactTourList(
  alumni: { tour_codes: string[] | null }[] | undefined,
): string | null {
  if (!alumni || alumni.length === 0) return null;
  const tours = new Set<string>();
  for (const a of alumni) {
    const code = a.tour_codes?.[0]?.toLowerCase();
    if (code && TOUR_LABELS[code]) tours.add(TOUR_LABELS[code]);
  }
  if (tours.size === 0) return null;
  const ordered = ['PGA', 'LPGA', 'DPWT', 'Champions', 'Korn Ferry'].filter(t => tours.has(t));
  return ordered.join(', ');
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, error: _statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const { data: alumni } = useCollegeAlumni(collegeSlug, { orderBy: 'earnings', limit: 50 });

  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  const isLoading = statsLoading || mediaLoading;
  const logoUrl = getCollegeLogoUrl(college?.college_name || collegeSlug);

  // Compute this college's rank by earnings
  const collegeRank = useMemo(() => {
    if (!allSeasonStats || !collegeSlug) return null;
    const sorted = [...allSeasonStats].sort((a, b) => b.earnings_total - a.earnings_total);
    const idx = sorted.findIndex(s => s.normalized_name === collegeSlug);
    return idx >= 0 ? idx + 1 : null;
  }, [allSeasonStats, collegeSlug]);

  // Primary stat split
  const primaryValueText = stats ? formatCurrency(stats.earnings_total) : '—';
  const { integer: primaryInteger, decimal: primaryDecimal, suffix: primarySuffix } = splitStatValue(primaryValueText);

  // Caption metadata — ≤2 items: rank + season label.
  const captionMetadata: string[] = useMemo(() => {
    const items: string[] = [];
    if (collegeRank) items.push(`#${collegeRank} EARNINGS`);
    items.push('2025–26');
    return items.slice(0, 2);
  }, [collegeRank]);

  // Body subline inside the card: "13 alumni · PGA, LPGA, DPWT"
  const cardSubline = useMemo(() => {
    if (!stats) return null;
    const tourList = buildCompactTourList(alumni);
    const count = `${stats.player_count} alumni`;
    return tourList ? `${count} · ${tourList}` : count;
  }, [stats, alumni]);

  return (
    <TourHubShell>
      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: SLATE_50 }}>

        {/* ── HERO — gold champion card on SLATE_50, mirrors main College hero ── */}
        <div style={{ background: SLATE_50, padding: '16px 16px 14px' }}>

          {/* Section eyebrow (canonical §2) → tap back to College hub */}
          <button
            type="button"
            onClick={() => navigate(collegeHubRoute())}
            aria-label="College Franchise — back to all colleges"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 14,
            }}
          >
            <GraduationCap size={13} strokeWidth={2.5} style={{ color: AMBER }} />
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: AMBER,
              textTransform: 'uppercase' as const,
            }}>
              COLLEGE FRANCHISE
            </span>
            <ChevronRight size={11} strokeWidth={2.5} style={{ color: AMBER, marginTop: 1 }} />
          </button>

          {/* Champion card */}
          {stats && !isLoading && (
            <div style={{
              background: `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 14,
              padding: 14,
            }}>
              {/* Caption row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12,
                flexWrap: 'wrap' as const,
              }}>
                <Crown size={13} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP, flexShrink: 0 }} />
                {captionMetadata.map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: INK_MUTE }}>·</span>}
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      color: i === 0 ? INK : INK_MUTE,
                      textTransform: 'uppercase' as const,
                    }}>
                      {part}
                    </span>
                  </Fragment>
                ))}
              </div>

              {/* Body row: crest + (name + subline) + stat */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* 80px gold-ringed crest with rank badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '34%',
                    overflow: 'hidden',
                    background: SURFACE,
                    border: `2.5px solid ${GOLD}`,
                    boxShadow: '0 4px 12px rgba(255,184,0,0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 10,
                  }}>
                    <PlayerInitialAvatar
                      name={displayName}
                      src={logoUrl ?? undefined}
                      size={60}
                      radius={8}
                      imageScale={1}
                      imageBg="#FFFFFF"
                      paletteSeed={collegeSlug}
                    />
                  </div>
                  {collegeRank && collegeRank <= 99 && (
                    <div style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: GOLD,
                      color: INK,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                      border: `2.5px solid ${SURFACE}`,
                      boxShadow: '0 1px 3px rgba(15,23,42,0.15)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {collegeRank}
                    </div>
                  )}
                </div>

                {/* Name + compact subline + right-aligned stat */}
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h1 style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: '-0.025em',
                      lineHeight: 1.1,
                      margin: 0,
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {displayName}
                    </h1>
                    {cardSubline && (
                      <div style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: INK_MUTE,
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                      }}>
                        {cardSubline}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: INK,
                      letterSpacing: '-0.025em',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {primaryInteger}
                      {primaryDecimal && <span style={{ color: INK }}>{primaryDecimal}</span>}
                      {primarySuffix && <span style={{ color: INK }}>{primarySuffix}</span>}
                    </div>
                    <div style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.16em',
                      color: INK_MUTE,
                      textTransform: 'uppercase' as const,
                      marginTop: 4,
                    }}>
                      EARNINGS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div style={{
              background: `linear-gradient(180deg, ${GOLD_TINT_10} 0%, ${GOLD_TINT} 100%)`,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 14,
              padding: 14,
            }}>
              <Skeleton style={{ height: 10, width: 140, marginBottom: 12, background: INK_TINT_06 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Skeleton style={{ width: 80, height: 80, borderRadius: '34%', background: GOLD_TINT_10 }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ height: 20, width: '70%', marginBottom: 6, background: INK_TINT_06 }} />
                    <Skeleton style={{ height: 10, width: '50%', background: INK_TINT_06 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <Skeleton style={{ height: 20, width: 90, background: INK_TINT_06 }} />
                    <Skeleton style={{ height: 9, width: 60, background: INK_TINT_06 }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content — sections flow as one continuous hairline-separated surface */}
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
          {/* Franchise Dispatch */}
          {stats && <FranchiseStoryStrip normalizedName={collegeSlug || ''} />}

          {/* Head-to-Head rivals */}
          {stats && collegeSlug && <H2HRivalStrip normalizedName={collegeSlug} />}

          {/* Alumni leaderboard (header + column header live inside the chart) */}
          {stats && <AlumniDepthChart normalizedName={collegeSlug || ''} alumniCount={stats.player_count} />}

          {/* Error state */}
          {!isLoading && !stats && (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Couldn't load school data
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Something went wrong. Please try again.
              </p>
              <button
                onClick={() => refetchStats()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tap to Retry
              </button>
              <Link to={collegeHubRoute()} className="block mt-4 text-primary hover:underline text-sm">
                Browse all colleges
              </Link>
            </div>
          )}
        </div>
      </div>
    </TourHubShell>
  );
}
