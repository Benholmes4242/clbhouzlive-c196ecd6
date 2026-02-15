import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { TourHubShell } from '../components';
import { CollegeSearch, FranchiseLeaderboard, FranchiseMovers } from '../components/college';
import { CollegeHeroBanner } from '../components/college/CollegeHeroBanner';
import { AlumniFaceStrip } from '../components/college/AlumniFaceStrip';
import { useCollegeSeasonStats, type CollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useHeroAlumni } from '../hooks/useBatchCollegeAlumni';

type MetricTab = 'earnings' | 'wins' | 'cuts' | 'top10s';
const VALID_METRICS = new Set<string>(['earnings', 'wins', 'cuts', 'top10s']);

function getMetricValue(s: CollegeSeasonStats, metric: MetricTab): number {
  switch (metric) {
    case 'wins': return s.wins_total;
    case 'cuts': return s.cuts_total;
    case 'top10s': return s.top10_total;
    default: return s.earnings_total;
  }
}

/**
 * College Golf Hub - Immersive rankings page with full-bleed hero,
 * alumni showcase, franchise leaderboard, and weekly movers.
 */
export function CollegeGolfHubPage() {
  const [searchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';
  const queryClient = useQueryClient();

  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();

  // --- Pull-to-refresh ---
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPullDistance(Math.min(delta, 100));
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['college-season-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['college-movers'] }),
        queryClient.invalidateQueries({ queryKey: ['college-media'] }),
        queryClient.invalidateQueries({ queryKey: ['hero-alumni'] }),
      ]);
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, queryClient]);

  // --- Scroll position retention ---
  useEffect(() => {
    const saved = sessionStorage.getItem('college-scroll');
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
      sessionStorage.removeItem('college-scroll');
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const saveScroll = useCallback(() => {
    sessionStorage.setItem('college-scroll', String(window.scrollY));
  }, []);

  // Save scroll position when navigating away via any link click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor && anchor.href && !anchor.href.includes('?tab=college')) {
        saveScroll();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [saveScroll]);

  // Determine #1 college for the active metric
  const topCollege = useMemo(() => {
    if (!allStats?.length) return null;
    return [...allStats].sort((a, b) => getMetricValue(b, activeMetric) - getMetricValue(a, activeMetric))[0];
  }, [allStats, activeMetric]);

  const topCollegeMedia = topCollege ? collegeMap?.get(topCollege.normalized_name) ?? null : null;

  // Alumni for hero face strip
  const { data: heroAlumni } = useHeroAlumni(topCollege?.normalized_name);

  return (
    <TourHubShell immersive>
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {/* Pull-to-refresh indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div className="flex justify-center py-2" style={{ height: pullDistance > 0 ? pullDistance * 0.4 : 32 }}>
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : (pullDistance / PULL_THRESHOLD) * 180 }}
              transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        )}

        {/* Back Link — floating over hero with safe area */}
        <div
          className="absolute left-4 z-20"
          style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
        >
          <Link
            to="/tourhub"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors backdrop-blur-sm bg-black/20 rounded-full px-3 py-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Tour Hub
          </Link>
        </div>

        {/* Immersive Hero — adapts per active metric tab */}
        {topCollege && (
          <CollegeHeroBanner
            stats={topCollege}
            college={topCollegeMedia}
          />
        )}

        {/* Alumni Face Strip — overlaps hero */}
        {heroAlumni && heroAlumni.length > 0 && topCollege && (
          <AlumniFaceStrip
            alumni={heroAlumni}
            collegeName={topCollegeMedia?.short_name || topCollegeMedia?.college_name || topCollege.normalized_name}
            collegeSlug={topCollege.normalized_name}
            totalAlumniCount={topCollege.player_count}
          />
        )}

        {/* Content area — Overview-matched rhythm */}
        <div className="px-4 space-y-section pt-5 pb-24">
          {/* Search Section */}
          <CollegeSearch />

          {/* Franchise Leaderboard (includes sticky tabs) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-[hsl(var(--tab-orange))]" />
              <h2 className="text-[16px] font-semibold text-foreground tracking-tight">
                Franchise Leaderboard
              </h2>
            </div>
            <FranchiseLeaderboard limit={25} />
          </section>

          {/* Weekly Movers */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--tab-orange))]" />
              <h2 className="text-[16px] font-semibold text-foreground tracking-tight">
                This Week's Movers
              </h2>
            </div>
            <FranchiseMovers limit={8} />
          </section>
        </div>
      </div>
    </TourHubShell>
  );
}
