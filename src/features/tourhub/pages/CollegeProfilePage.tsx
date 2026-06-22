import { useMemo, Fragment } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ChevronRight, Crown } from 'lucide-react';
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
import { useCollegeWeeklyMovers } from '../hooks/useCollegeMovers';
import { useFranchiseCaptains } from '../hooks/useFranchiseCaptains';
import {
  captainDominates,
  captainShortName as _captainShortName,
} from '../utils/captainAnchor';
import { collegeHubRoute } from '../routes';
import { AMBER, GOLD, GOLD_DEEP, GOLD_GLOW_DROP, GOLD_TINT_10, INK, INK_MUTE, INK_FAINT, INK_TINT_06, INK_TINT_07, SLATE_50, SURFACE } from '../_shared/tokens';


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
  const _showCaptainPill = captainDominates(captain);

  void _captainShortName;

  // Captain OWGR retained for future surfacing; currently unused after
  // caption condense (COLLEGE_FRANCHISE_PAGE_NEATEN).
  const _captainOwgr = useMemo(() => {
    if (!captain || !alumni) return null;
    const a = alumni.find(x => x.id === captain.playerId);
    const r = a?.world_ranking;
    return r && r > 0 ? r : null;
  }, [captain, alumni]);


  const subtitleText = stats ? buildAlumniSubtitle(stats.player_count, alumni) : null;

  // Primary stat split (amber decimal-tail pattern).
  const primaryValueText = stats ? formatCurrency(stats.earnings_total) : '—';
  const { integer: primaryInteger, decimal: primaryDecimal, suffix: primarySuffix } = splitStatValue(primaryValueText);

  // Caption metadata — condensed to ≤2 items: rank + season performance.
  // Captain/OWGR dropped here; captain already surfaces in Dispatch's
  // "Top Performer" cell (COLLEGE_FRANCHISE_PAGE_NEATEN).
  const captionMetadata: string[] = useMemo(() => {
    const items: string[] = [];

    if (collegeRank) {
      items.push(`#${collegeRank} EARNINGS`);
    }

    if (stats?.wins_total && stats.wins_total > 0) {
      items.push(`${stats.wins_total} WIN${stats.wins_total === 1 ? '' : 'S'} THIS SEASON`);
    } else if (stats?.top10_total && stats.top10_total > 0) {
      items.push(`${stats.top10_total} TOP 10S THIS SEASON`);
    }

    return items.slice(0, 2);
  }, [collegeRank, stats]);



  const sectionMetaSubtitle = [subtitleText, `Season ${seasonYear}`].filter(Boolean).join(' · ');

  return (
    <TourHubShell>
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

        {/* Compact identity header — replaces the removed slate masthead */}
        <button
          type="button"
          onClick={() => navigate(collegeHubRoute())}
          aria-label="Open College Franchise"
          style={{ background: 'transparent', border: 'none', padding: 0, margin: '0 0 12px', cursor: 'pointer', display: 'block', textAlign: 'left', width: '100%' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK_MUTE }}>College Franchise</span>
            <ChevronRight size={10} strokeWidth={2.5} style={{ color: AMBER }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: INK, margin: 0 }}>
            {displayName}
          </h1>
          {sectionMetaSubtitle && (
            <div style={{ fontSize: 12, fontWeight: 500, color: INK_MUTE, marginTop: 3 }}>
              {sectionMetaSubtitle}
            </div>
          )}
        </button>

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
                  <PlayerInitialAvatar
                    name={displayName}
                    src={logoUrl ?? undefined}
                    size={60}
                    radius={20}
                    imageScale={1}
                    imageBg="#FFFFFF"
                    paletteSeed={collegeSlug}
                  />

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
                  {primaryDecimal && <span style={{ color: INK }}>{primaryDecimal}</span>}
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
          <div style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, padding: '14px 16px 10px' }}>
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
