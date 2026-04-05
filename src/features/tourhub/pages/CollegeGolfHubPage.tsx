import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, ChevronLeft, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { TourHubShell } from '../components';
import { FranchiseLeaderboard } from '../components/college';
import { CollegeHeroBanner } from '../components/college/CollegeHeroBanner';
import { AlumniFaceStrip } from '../components/college/AlumniFaceStrip';
import { CollegeCard } from '../components/college/CollegeCard';
import { useCollegeSeasonStats, useCollegeSearch, type CollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useHeroAlumni } from '../hooks/useBatchCollegeAlumni';

type MetricTab = 'earnings' | 'wins' | 'top10s' | 'movers';
const VALID_METRICS = new Set<string>(['earnings', 'wins', 'top10s', 'movers']);

const METRIC_TABS: { value: MetricTab; label: string }[] = [
  { value: 'earnings', label: 'Earnings' },
  { value: 'wins',     label: 'Wins'     },
  { value: 'top10s',   label: 'Top 10s'  },
  { value: 'movers',   label: 'Movers'   },
];

function getMetricValue(s: CollegeSeasonStats, metric: MetricTab): number {
  switch (metric) {
    case 'wins': return s.wins_total;
    case 'top10s': return s.top10_total;
    default: return s.earnings_total;
  }
}

/**
 * College Golf Hub - Immersive rankings page with full-bleed hero,
 * alumni showcase, franchise leaderboard, and weekly movers.
 */
export function CollegeGolfHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';
  const queryClient = useQueryClient();

  const { data: allStats, isLoading: statsLoading } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();

  // --- New header state ---
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebouncedValue(searchValue, 200);
  const { data: searchResults, isLoading: searchLoading } = useCollegeSearch(debouncedSearch);

  const setActiveMetric = useCallback((metric: MetricTab) => {
    const params = new URLSearchParams(searchParams);
    if (metric === 'earnings') params.delete('sort');
    else params.set('sort', metric);
    setSearchParams(params, { replace: true });
    window.scrollTo(0, 0);
  }, [searchParams, setSearchParams]);

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

  const showSearchResults = searchExpanded && debouncedSearch.length >= 2;

  return (
    <TourHubShell immersive>
      <div className="relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
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

        {/* Immersive Hero */}
        {statsLoading ? (
          <div
            className="animate-pulse"
            style={{ height: '35dvh', background: 'hsl(var(--muted) / 0.3)' }}
          />
        ) : topCollege ? (
          <CollegeHeroBanner
            stats={topCollege}
            college={topCollegeMedia}
            activeMetric={activeMetric === 'movers' ? 'earnings' : activeMetric}
          />
        ) : null}


        {/* Alumni Face Strip — overlaps hero */}
        {heroAlumni && heroAlumni.length > 0 && topCollege && (
          <AlumniFaceStrip
            alumni={heroAlumni}
            collegeName={topCollegeMedia?.short_name || topCollegeMedia?.college_name || topCollege.normalized_name}
            collegeSlug={topCollege.normalized_name}
            totalAlumniCount={topCollege.player_count}
          />
        )}

        {/* ══════════════════════════════════════════════
            STICKY HEADER — back · tabs · search
            ══════════════════════════════════════════════ */}
        <div
          className="-mx-5 sticky top-0 z-20"
          style={{
            background: 'hsl(var(--background) / 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid hsl(var(--border) / 0.10)',
            paddingTop: 10,
            marginTop: 8,
          }}
        >
          {/* Collapsible search bar */}
          <div
            className="overflow-hidden transition-all duration-250 ease-in-out px-5"
            style={{
              maxHeight: searchExpanded ? 60 : 0,
              opacity: searchExpanded ? 1 : 0,
            }}
          >
            <div className="relative pt-2.5">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[17px] h-[17px] mt-[5px]"
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-11 pl-10 pr-9 rounded-xl text-[13px] transition-all duration-200 bg-card border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60 border-border/50"
              />
              <AnimatePresence>
                {searchValue && (
                  <motion.button
                    onClick={() => setSearchValue('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-[5px] p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Control row: ← Tour Overview | tabs | search icon */}
          <div className="flex items-center gap-1.5 px-5 pt-2 pb-2.5">
            {/* Back link */}
            <Link
              to="/tourhub?tab=overview"
              replace
              className="-ml-1 flex items-center gap-0.5 text-[12px] font-medium active:opacity-50 transition-opacity shrink-0"
              style={{ color: 'hsl(var(--muted-foreground) / 0.70)' }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              Tour Overview
            </Link>

            <div className="flex-1" />

            {/* Metric tabs — pill buttons, no track */}
            <div className="flex items-center gap-0.5">
              {METRIC_TABS.map((tab) => {
                const isActive = activeMetric === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveMetric(tab.value)}
                    className={cn(
                      'h-[34px] px-2.5 rounded-[9px] text-[12px] transition-all duration-200 whitespace-nowrap active:scale-[0.97]',
                      isActive
                        ? 'bg-foreground text-background font-bold shadow-sm'
                        : 'bg-transparent text-muted-foreground font-medium'
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search icon toggle */}
            <button
              onClick={() => setSearchExpanded(v => !v)}
              className={cn(
                'w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 transition-colors duration-150',
                searchExpanded ? 'bg-amber-50' : 'bg-transparent'
              )}
            >
              <Search
                className="w-[15px] h-[15px] transition-colors duration-150"
                style={{ color: searchExpanded ? '#F59E0B' : undefined }}
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>

        {/* Search results — only shown when searchExpanded and query >= 2 chars */}
        {showSearchResults && (
          <div className="px-5 mt-3 space-y-2">
            {searchLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[110px] rounded-xl bg-muted/40 animate-pulse" />
              ))
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((stats, index) => (
                <motion.div
                  key={stats.normalized_name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <CollegeCard
                    stats={stats}
                    college={collegeMap?.get(stats.normalized_name) || null}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No colleges found matching "{debouncedSearch}"
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="px-5"
          style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}
        >
          <section style={{ marginTop: 16 }}>
            <FranchiseLeaderboard
              limit={25}
              activeMetric={activeMetric}
              onMetricChange={setActiveMetric}
              hideHeader
            />
          </section>
        </div>
      </div>
    </TourHubShell>
  );
}
