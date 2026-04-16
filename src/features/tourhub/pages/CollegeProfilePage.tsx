import { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GitCompare, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
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
  CollegeRivalsCarousel,
  CollegeCompareSheet,
} from '../components/college';

import { useCollegeStats, useCollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useCollegeRivalries } from '../hooks/useCollegeMovers';

export function CollegeProfilePage() {
  const { collegeSlug } = useParams<{ collegeSlug: string }>();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hideHeader, showHeader } = useHeader();

  // Transparent status bar for immersive hero bleed into safe area
  useMedianStatusBar("dark", "transparent", true, false);
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useCollegeStats(collegeSlug);
  const { data: collegeMap, isLoading: mediaLoading } = useCollegeMediaMap();
  const { data: rivalries } = useCollegeRivalries(collegeSlug);
  const { data: allSeasonStats } = useCollegeSeasonStats();
  const seasonYear = new Date().getFullYear();
  
  const [compareOpen, setCompareOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const [compareCollege2, setCompareCollege2] = useState<string | null>(null);
  
  const college = collegeSlug ? collegeMap?.get(collegeSlug) || null : null;
  const displayName = college?.short_name || college?.college_name || collegeSlug || 'College';
  const isLoading = statsLoading || mediaLoading;
  const rivalSlugs = rivalries?.map(r => r.rivalNormalizedName) ?? [];
  const firstRival = rivalSlugs[0] ?? null;
  const logoUrl = getCollegeLogoUrl(college?.college_name || collegeSlug);

  // Compute this college's rank by earnings
  const collegeRank = (() => {
    if (!allSeasonStats || !collegeSlug) return null;
    const sorted = [...allSeasonStats].sort((a, b) => b.earnings_total - a.earnings_total);
    const idx = sorted.findIndex(s => s.normalized_name === collegeSlug);
    return idx >= 0 ? idx + 1 : null;
  })();

  // Pull-to-refresh handlers
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
        queryClient.invalidateQueries({ queryKey: ['college-rivals', collegeSlug] }),
      ]);
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
    }
    isPulling.current = false;
  }, [pullDistance, isRefreshing, queryClient, collegeSlug]);
  
  useEffect(() => {
    hideHeader();
    return () => {
      showHeader();
    };
  }, [hideHeader, showHeader]);
  
  useEffect(() => {
    setCompareCollege2(null);
    setCompareOpen(false);
  }, [collegeSlug]);
  
  const handleCompareClick = () => {
    if (!compareCollege2 && firstRival) {
      setCompareCollege2(firstRival);
    }
    setCompareOpen(true);
  };
  
  const handleRivalCompare = (rivalSlug: string) => {
    setCompareCollege2(rivalSlug);
    setCompareOpen(true);
  };

  // Build descriptive subtitle
  const subtitleText = stats
    ? `${stats.player_count} alumni on the PGA Tour`
    : null;
  
  return (
    <PageRoot className="min-h-screen w-full bg-background" hasBottomNav immersive immersiveStatusBar
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

      {/* ── SLATE EDITORIAL MASTHEAD ── */}
      <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
        {/* Amber eyebrow */}
        <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
          ⚡ CLBHOUZ · COLLEGE FRANCHISE
        </div>

        {/* College name + rank chip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0, flex: 1 }}>
            {displayName}
          </h1>
          {collegeRank && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'rgba(247,147,30,0.12)', border: '1px solid rgba(247,147,30,0.27)', flexShrink: 0, marginTop: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.1em' }}>
                #{collegeRank}
              </span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>EARNINGS</span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {subtitleText && (
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{subtitleText}</span>
          )}
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Season {seasonYear}</span>
        </div>

        {/* Cover story — earnings dominant left, logo chip right */}
        {stats && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: 0 }}>
            <div style={{ flex: 1, paddingBottom: '14px' }}>
              <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                Season Earnings
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.05em', lineHeight: 1 }}>
                {formatCurrency(stats.earnings_total)}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                {stats.wins_total > 0 && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {stats.wins_total} {stats.wins_total === 1 ? 'win' : 'wins'}
                  </span>
                )}
                {stats.top10_total > 0 && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {stats.top10_total} top 10s
                  </span>
                )}
              </div>
            </div>

            {/* Contained college logo chip */}
            <div style={{ flexShrink: 0, paddingBottom: '14px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '14px 14px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logoUrl && !heroImgError ? (
                  <img
                    src={logoUrl}
                    alt={displayName}
                    style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                    onError={() => setHeroImgError(true)}
                  />
                ) : (
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'rgba(255,255,255,0.18)' }}>
                    {displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4-col stat grid on slate */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
            {([
              { label: 'EARNINGS', value: formatCurrency(stats.earnings_total), accent: true },
              { label: 'WINS', value: String(stats.wins_total), accent: false },
              { label: 'TOP 10s', value: String(stats.top10_total), accent: false },
              { label: 'ALUMNI', value: String(stats.player_count), accent: false },
            ] as const).map((s, i) => (
              <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center' as const, borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: '3px' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: s.accent ? '#F7931E' : '#ffffff' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="animate-pulse" style={{ paddingBottom: '16px' }}>
            <div style={{ height: '22px', width: '60%', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', marginBottom: '10px' }} />
            <div style={{ height: '34px', width: '40%', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', marginBottom: '10px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '32px', background: 'rgba(255,255,255,0.04)', margin: '0 4px' }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sticky header */}
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
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 10px', gap: '6px' }}>
          <button
            type="button"
            onClick={() => navigate('/tourhub/college-golf')}
            style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            className="active:opacity-50 transition-opacity"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            College Golf
          </button>
          <div style={{ flex: 1 }} />
          {stats && rivalSlugs.length > 0 && (
            <button
              onClick={handleCompareClick}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 9px', borderRadius: '8px', background: '#ffffff', border: '1px solid rgba(15,23,42,0.09)', boxShadow: '0 1px 3px rgba(15,23,42,0.05)', cursor: 'pointer', flexShrink: 0 }}
              className="active:scale-[0.97] transition-transform"
            >
              <GitCompare className="w-[11px] h-[11px]" style={{ color: '#F7931E' }} strokeWidth={2.5} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#F7931E' }}>Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
        {/* Franchise Dispatch strip */}
        {stats && <FranchiseStoryStrip normalizedName={collegeSlug || ''} />}

        {/* Rivals */}
        {stats && rivalSlugs.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <CollegeRivalsCarousel
              normalizedName={collegeSlug || ''}
              onCompare={handleRivalCompare}
            />
          </div>
        )}

        {/* Alumni on Tour header */}
        {stats && (
          <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '16px', padding: '14px 20px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
                Alumni on Tour
              </span>
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{stats.player_count} players</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Every pro from this program</div>
          </div>
        )}

        {/* Alumni Depth Chart */}
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
            <Link 
              to="/tourhub/college-golf" 
              className="block mt-4 text-primary hover:underline text-sm"
            >
              Browse all colleges
            </Link>
          </div>
        )}
      </div>

      {/* Compare Sheet */}
      {collegeSlug && (
        <CollegeCompareSheet
          isOpen={compareOpen}
          onClose={() => setCompareOpen(false)}
          college1={collegeSlug}
          college2={compareCollege2 ?? firstRival ?? ''}
          rivals={rivalSlugs}
          onCollegeChange={setCompareCollege2}
        />
      )}
    </PageRoot>
  );
}
