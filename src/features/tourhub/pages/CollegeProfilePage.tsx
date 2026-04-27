import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  FranchiseStoryStrip,
  AlumniDepthChart,
  H2HRivalStrip,
} from '../components/college';
import { PillView, type MastheadPill } from '../components/leaders/LeadersMasthead';

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

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hideHeader, showHeader } = useHeader();

  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar('dark', 'transparent', true, false);

  const { data: stats, isLoading: statsLoading, error: _statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const { data: alumni } = useCollegeAlumni(collegeSlug, { orderBy: 'earnings', limit: 50 });
  const { data: thisWeekMovers } = useCollegeWeeklyMovers({ collegeName: collegeSlug });
  const captainMap = useFranchiseCaptains(collegeSlug ? [collegeSlug] : []);
  const seasonYear = new Date().getFullYear();

  const [heroImgError, setHeroImgError] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

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

  // Captain's % of season earnings (≥30% renders, otherwise omitted from the
  // captain pill copy — keeps the line "{Last} · #N OWGR" without a noisy %).
  const captainEarningsPct = useMemo(() => {
    if (!captain || !stats || stats.earnings_total <= 0) return null;
    const pct = (captain.earnings / stats.earnings_total) * 100;
    return pct >= 30 ? Math.round(pct) : null;
  }, [captain, stats]);

  // Captain OWGR (PGA-biased; null when no live ranking available)
  const captainOwgr = useMemo(() => {
    if (!captain || !alumni) return null;
    const a = alumni.find(x => x.id === captain.playerId);
    const r = a?.world_ranking;
    return r && r > 0 ? r : null;
  }, [captain, alumni]);

  // Narrative pills (Phase 1: earnings-primary tab is the only stat shown
  // in the hero). Pills omitted when data unavailable — never stubbed.
  const heroPills = useMemo<MastheadPill[]>(() => {
    const out: MastheadPill[] = [];

    if (showCaptainPill && captain) {
      const last = captainShortName(captain.fullName);
      const parts = [last];
      if (captainOwgr) parts.push(`#${captainOwgr} OWGR`);
      else parts.push('Top earner');
      out.push({ variant: 'highlight', value: parts.join(' · ') });
    }

    const weekDelta = thisWeekMovers?.[0]?.earnings_delta ?? 0;
    if (weekDelta > 0) {
      const formatted = weekDelta >= 1_000_000
        ? `+$${(weekDelta / 1_000_000).toFixed(1)}M`
        : weekDelta >= 1_000
          ? `+$${Math.round(weekDelta / 1_000)}K`
          : `+$${weekDelta}`;
      out.push({ variant: 'normal', value: `${formatted} this week` });
    }

    const alumniCashing = alumni?.filter(a => (a.earnings ?? 0) > 0).length ?? 0;
    if (alumniCashing >= 1) {
      out.push({ variant: 'normal', value: `${alumniCashing} alumni cashing` });
    }

    return out.slice(0, 3);
  }, [showCaptainPill, captain, captainOwgr, thisWeekMovers, alumni]);

  const subtitleText = stats ? buildAlumniSubtitle(stats.player_count, alumni) : null;

  // Captain context line (renders below alumni count when dominates)
  const captainContextLine = useMemo(() => {
    if (!showCaptainPill || !captain) return null;
    const parts: string[] = [];
    if ((captain as any).wins !== undefined && (captain as any).wins > 0) {
      const w = (captain as any).wins;
      parts.push(`${w} ${w === 1 ? 'win' : 'wins'}`);
    }
    if (captainOwgr) parts.push(`#${captainOwgr} OWGR`);
    if (captainEarningsPct !== null) parts.push(`${captainEarningsPct}% of season earnings`);
    if (parts.length === 0) return null;
    return parts.join(' · ');
  }, [showCaptainPill, captain, captainOwgr, captainEarningsPct]);

  /* ── Pull-to-refresh ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta, 100));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['college-stats', collegeSlug] }),
        queryClient.invalidateQueries({ queryKey: ['college-alumni', collegeSlug] }),
        queryClient.invalidateQueries({ queryKey: ['college-rivalries', collegeSlug] }),
      ]);
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
    isPulling.current = false;
  }, [pullDistance, isRefreshing, queryClient, collegeSlug]);

  useEffect(() => {
    hideHeader();
    return () => { showHeader(); };
  }, [hideHeader, showHeader]);

  return (
    <PageRoot
      className="min-h-screen w-full bg-background"
      hasBottomNav
      immersive
      immersiveStatusBar
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex justify-center py-3 relative z-50">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullDistance * 3.6 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      )}

      {/* ── HERO MASTHEAD ── (eyebrow retired in Phase 1) */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #0B1426 0%, #070D1A 100%)',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0',
        overflow: 'hidden',
      }}>
        {/* Watermark rank — 130px ghost behind content */}
        {collegeRank && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -8,
              top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
              fontSize: 130, fontWeight: 900, lineHeight: 1,
              color: 'rgba(255,255,255,0.04)',
              letterSpacing: '-8px',
              pointerEvents: 'none',
              userSelect: 'none' as const,
            }}
          >
            {collegeRank}
          </div>
        )}

        {/* Masthead double-rule band */}
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.8px', lineHeight: 1, margin: 0, flex: 1 }}>
              {displayName}
            </h1>
            {collegeRank && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'rgba(247,147,30,0.12)', border: '1px solid rgba(247,147,30,0.27)', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: '#F7931E', letterSpacing: '0.1em' }}>#{collegeRank}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>EARNINGS</span>
              </div>
            )}
          </div>

          {/* Subtitle — cross-tour roll-up */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {subtitleText && (
              <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: 0 }}>
                {subtitleText}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>·</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>Season {seasonYear}</span>
          </div>
        </div>

        {/* Cover story — ghost rank + earnings + logo */}
        {stats && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 0, position: 'relative' }}>
            <div style={{ flex: 1, paddingBottom: 14 }}>
              {/* Primary-stat eyebrow with rank + tour scope */}
              <div style={{ fontSize: 11, fontWeight: 800, color: '#F7931E', letterSpacing: '1.4px', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                {collegeRank ? `#${collegeRank} EARNINGS · COLLEGE` : 'SEASON EARNINGS'}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#F7931E', letterSpacing: '-1px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(stats.earnings_total)}
              </div>
              {/* Captain context line (when dominant) */}
              {captainContextLine && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginTop: 8, letterSpacing: 0 }}>
                  {captainShortName(captain!.fullName)} · {captainContextLine}
                </div>
              )}
              {!captainContextLine && (
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {stats.wins_total > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                      {stats.wins_total} {stats.wins_total === 1 ? 'win' : 'wins'}
                    </span>
                  )}
                  {stats.top10_total > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                      {stats.top10_total} top 10s
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* College logo chip — bottom-anchored */}
            <div style={{ flexShrink: 0, paddingBottom: 14 }}>
              <div style={{ width: 72, height: 72, borderRadius: '14px 14px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logoUrl && !heroImgError ? (
                  <img
                    src={logoUrl}
                    alt={displayName}
                    style={{ width: 52, height: 52, objectFit: 'contain' }}
                    onError={() => setHeroImgError(true)}
                  />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.18)' }}>
                    {displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Narrative pills row */}
        {heroPills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 0 12px', position: 'relative' }}>
            {heroPills.map((p, i) => (
              <PillView key={`${p.label ?? ''}-${p.value}-${i}`} pill={p} />
            ))}
          </div>
        )}

        {/* 4-col stat grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            {([
              { label: 'EARNINGS', value: formatCurrency(stats.earnings_total), accent: true },
              { label: 'WINS', value: String(stats.wins_total), accent: false },
              { label: 'TOP 10s', value: String(stats.top10_total), accent: false },
              { label: 'ALUMNI', value: String(stats.player_count), accent: false },
            ] as const).map((s, i) => (
              <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center' as const, borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: 9.5, fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: 3 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: s.accent ? '#F7931E' : '#ffffff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="animate-pulse" style={{ paddingBottom: 16 }}>
            <div style={{ height: 22, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginBottom: 10 }} />
            <div style={{ height: 34, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 32, background: 'rgba(255,255,255,0.04)', margin: '0 4px' }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky header (Compare button retired) */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(248,250,252,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(15,23,42,0.08)',
          paddingTop: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 10px', gap: 6 }}>
          <button
            type="button"
            onClick={() => navigate(collegeHubRoute())}
            style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500, color: 'rgba(15,23,42,0.5)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            className="active:opacity-50 transition-opacity"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            College Golf
          </button>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Franchise Dispatch strip */}
        {stats && <FranchiseStoryStrip normalizedName={collegeSlug || ''} />}

        {/* Inline H2H rival strip (replaces CollegeRivalsCarousel + Compare sheet) */}
        {stats && collegeSlug && <H2HRivalStrip normalizedName={collegeSlug} />}

        {/* Alumni on Tour header */}
        {stats && (
          <div style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: 16, padding: '14px 20px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', letterSpacing: '1.4px', textTransform: 'uppercase' as const, flex: 1 }}>
                Alumni on Tour
              </span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{stats.player_count} players</span>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Every pro from this program</div>
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
    </PageRoot>
  );
}
