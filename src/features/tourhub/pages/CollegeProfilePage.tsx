import { useState, useMemo, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ChevronRight, Crown } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { TourHubShell, TourBackChip } from '../components/TourHubShell';
import { ShellSlot } from '@/components/header/ShellSlot';
import { Kicker } from '@/components/watch/proshop/Kicker';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  FranchiseStoryStrip,
  AlumniDepthChart,
  H2HRivalStrip,
} from '../components/college';
import { splitStatValue } from '../utils/splitStatValue';

import { useCollegeStats, useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeAlumni } from '../hooks/useCollegeAlumni';
import { useCollegeWeeklyMovers } from '../hooks/useCollegeMovers';
import { useFranchiseCaptains } from '../hooks/useFranchiseCaptains';
import {
  captainDominates,
  captainShortName,
} from '../utils/captainAnchor';
import { collegeHubRoute } from '../routes';
import { AMBER, GOLD, GOLD_DEEP, GOLD_GLOW_DROP, GOLD_TINT_10, INK, INK_MUTE, INK_FAINT, INK_TINT_06, INK_TINT_07, SHELL_BG, SLATE_50, SURFACE, WHITE_ALPHA_55 } from '../_shared/tokens';

/* ─── Hero subtitle: cross-tour roll-up ────────────────────────────────── */

const TOUR_LABELS: Record<string, string> = {
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DPWT',
  dpwt: 'DPWT',
  champ: 'Champions',
  korn: 'Korn Ferry',
};

function buildAlumniSubtitle(
  count: number,
  alumni: { tour_codes: string[] | null }[] | undefined,
): string {
  if (!alumni || alumni.length === 0) return `${count} alumni`;
  const tours = new Set<string>();
  for (const a of alumni) {
    const code = a.tour_codes?.[0]?.toLowerCase();
    if (code && TOUR_LABELS[code]) tours.add(TOUR_LABELS[code]);
  }
  if (tours.size === 0) return `${count} alumni`;
  const ordered = ['PGA', 'LPGA', 'DPWT', 'Champions', 'Korn Ferry'].filter(t => tours.has(t));
  if (ordered.length === 1) return `${count} alumni on ${ordered[0]}`;
  if (ordered.length === 2) return `${count} alumni across ${ordered[0]} & ${ordered[1]}`;
  const head = ordered.slice(0, -1).join(', ');
  return `${count} alumni across ${head} & ${ordered[ordered.length - 1]}`;
}

/* ─── Page ─────────────────────────────────────────────────────────────── */

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();

  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, error: _statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const { data: alumni } = useCollegeAlumni(collegeSlug, { orderBy: 'earnings', limit: 50 });
  const { data: thisWeekMovers } = useCollegeWeeklyMovers({ collegeName: collegeSlug });
  const captainMap = useFranchiseCaptains(collegeSlug ? [collegeSlug] : []);
  const seasonYear = new Date().getFullYear();

  const [heroImgError, setHeroImgError] = useState(false);


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

  // Captain (top-earning alumnus) — pulled from useFranchiseCaptains for the
  // dominance gate. Mirror of College Franchise hub-level wiring.
  const captain = collegeSlug ? captainMap.data?.get(collegeSlug) : undefined;
  const showCaptainPill = captainDominates(captain);



  // Captain OWGR (PGA-biased; null when no live ranking available)
  const captainOwgr = useMemo(() => {
    if (!captain || !alumni) return null;
    const a = alumni.find(x => x.id === captain.playerId);
    const r = a?.world_ranking;
    return r && r > 0 ? r : null;
  }, [captain, alumni]);

  const subtitleText = stats ? buildAlumniSubtitle(stats.player_count, alumni) : null;

  // Primary stat split (amber decimal-tail pattern).
  const primaryValueText = stats ? formatCurrency(stats.earnings_total) : '—';
  const { integer: primaryInteger, decimal: primaryDecimal, suffix: primarySuffix } = splitStatValue(primaryValueText);

  // Caption metadata composition (Q3 decision).
  // Priority order: #N EARNINGS → CAPTAIN → SEASON NARRATIVE. Cap at 3 items.
  const captionMetadata: string[] = useMemo(() => {
    const items: string[] = [];

    if (collegeRank) {
      items.push(`#${collegeRank} EARNINGS`);
    }

    if (captain && showCaptainPill) {
      const captainName = captainShortName(captain.fullName).toUpperCase();
      items.push(
        captainOwgr
          ? `${captainName} · #${captainOwgr} OWGR`
          : captainName
      );
    }

    if (stats?.wins_total && stats.wins_total > 0) {
      items.push(`${stats.wins_total} WIN${stats.wins_total === 1 ? '' : 'S'} THIS SEASON`);
    } else if (stats?.top10_total && stats.top10_total > 0) {
      items.push(`${stats.top10_total} TOP 10S THIS SEASON`);
    }

    return items.slice(0, 3);
  }, [collegeRank, captain, showCaptainPill, captainOwgr, stats]);


  const sectionMetaSubtitle = [subtitleText, `Season ${seasonYear}`].filter(Boolean).join(' · ');

  return (
    <TourHubShell>
      <ShellSlot dark>
        <button
          type="button"
          onClick={() => navigate(collegeHubRoute())}
          aria-label="College Profile — open College Franchise"
          style={{
            background: SHELL_BG,
            border: 'none',
            padding: '14px 16px 12px',
            cursor: 'pointer',
            display: 'block',
            width: '100%',
            textAlign: 'left' as const,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Kicker color="light">College Franchise</Kicker>
            <ChevronRight size={11} strokeWidth={2.5} style={{ color: AMBER, marginTop: -4 }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: SURFACE, margin: 0 }}>
            {displayName}
          </h1>
          {sectionMetaSubtitle && (
            <div style={{ fontSize: 13, fontWeight: 500, color: WHITE_ALPHA_55, marginTop: 4 }}>
              {sectionMetaSubtitle}
            </div>
          )}
        </button>
      </ShellSlot>

      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: SLATE_50 }}>

      {/* ── HERO MASTHEAD ── canonical light pattern */}
      <div style={{
        position: 'relative',
        background: SLATE_50,
        paddingTop: 16,
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
      }}>

        {/* Champion content (no card chrome — Q1 = b) */}
        {stats && !isLoading && (
          <div>
            {/* Caption row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <Crown size={13} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP }} />
              {captionMetadata.map((part, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <span style={{ fontSize: 10, color: INK_MUTE }}>·</span>
                  )}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    color: i === 0 ? INK : INK_MUTE,
                  }}>
                    {part}
                  </span>
                </Fragment>
              ))}
            </div>

            {/* Body row diverges from Player Profile pattern: no middle name block.
                The h1 already carries the college name; duplicating it inside the card
                would be redundant ("the champion of... themselves?"). */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              {/* Logo tile + position badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '27px',
                  background: SURFACE,
                  padding: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2.5px solid ${GOLD}`,
                  boxShadow: GOLD_GLOW_DROP,
                  overflow: 'hidden',
                }}>
                  {logoUrl && !heroImgError ? (
                    <img
                      src={logoUrl}
                      alt={displayName}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={() => setHeroImgError(true)}
                    />
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 900, color: INK }}>
                      {displayName?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>

                {/* Position badge — gated to collegeRank ≤ 99 */}
                {collegeRank && collegeRank <= 99 && (
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: GOLD,
                    border: `2.5px solid ${SURFACE}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    color: INK,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {collegeRank}
                  </div>
                )}
              </div>

              {/* Stat right (no name — name is the h1; Q1 = b) */}
              <div style={{ textAlign: 'right' as const }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {primaryInteger}
                  {primaryDecimal && <span style={{ color: AMBER }}>{primaryDecimal}</span>}
                  {primarySuffix}
                </div>
                <div style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: INK_MUTE,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase' as const,
                  marginTop: 5,
                }}>
                  EARNINGS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton — light surface */}
        {isLoading && (
          <div>
            <Skeleton style={{ height: 12, width: 120, marginBottom: 8, background: INK_TINT_06 }} />
            <Skeleton style={{ height: 22, width: '50%', marginBottom: 6, background: INK_TINT_06 }} />
            <Skeleton style={{ height: 14, width: '70%', marginBottom: 16, background: INK_TINT_06 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <Skeleton style={{ width: 80, height: 80, borderRadius: 27, background: GOLD_TINT_10 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Skeleton style={{ height: 22, width: 90, background: INK_TINT_06 }} />
                <Skeleton style={{ height: 10, width: 60, background: INK_TINT_06 }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Franchise Dispatch strip */}
        {stats && <FranchiseStoryStrip normalizedName={collegeSlug || ''} />}

        {/* Inline H2H rival strip (replaces CollegeRivalsCarousel + Compare sheet) */}
        {stats && collegeSlug && <H2HRivalStrip normalizedName={collegeSlug} />}

        {/* Alumni on Tour header */}
        {stats && (
          <div style={{ background: SURFACE, borderTop: `1px solid ${INK_TINT_07}`, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: 16, padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                Alumni on Tour
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>
                <span style={{ color: INK }}>{stats.player_count}</span> PLAYERS
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: INK_MUTE }}>Every pro from this program</div>
          </div>
        )}

        {/* Alumni Depth Chart (4-tier) */}
        {stats && <AlumniDepthChart normalizedName={collegeSlug || ''} />}

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
