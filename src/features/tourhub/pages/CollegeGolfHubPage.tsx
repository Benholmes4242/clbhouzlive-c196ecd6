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

  const topCollege = useMemo(() => {
    if (!allStats?.length) return null;
    return [...allStats].sort((a, b) => getMetricValue(b, activeMetric) - getMetricValue(a, activeMetric))[0];
  }, [allStats, activeMetric]);

  const topCollegeMedia = topCollege ? collegeMap?.get(topCollege.normalized_name) ?? null : null;
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

        {/* Back Link — pill style, bg-white/15, backdrop-blur */}
        <div
          className="absolute z-20"
          style={{ top: 56, left: 16 }}
        >
          <Link
            to="/tourhub"
            className="inline-flex items-center gap-1.5 transition-colors active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 9999,
              padding: '8px 14px',
              color: 'white',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Tour Hub
          </Link>
        </div>

        {/* Immersive Hero */}
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

        {/* Content area */}
        <div className="px-4" style={{ paddingBottom: 'calc(var(--sab, 30px) + 16px)' }}>
          {/* Search — 16px gap from alumni strip */}
          <div style={{ marginTop: 16 }}>
            <CollegeSearch />
          </div>

          {/* Franchise Leaderboard section — 24px gap */}
          <section style={{ marginTop: 24 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <h2
                className="text-foreground"
                style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}
              >
                Franchise Leaderboard
              </h2>
            </div>
            <FranchiseLeaderboard limit={25} />
          </section>

          {/* Weekly Movers section — 28px gap */}
          <section style={{ marginTop: 28 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#22C55E' }} />
              <h2
                className="text-foreground"
                style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}
              >
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
