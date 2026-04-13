import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, ChevronLeft, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { TourHubShell } from '../components';
import { FranchiseLeaderboard } from '../components/college';
import { CollegeMasthead } from '../components/college/CollegeMasthead';
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

export function CollegeGolfHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get('sort') || 'earnings';
  const activeMetric: MetricTab = VALID_METRICS.has(sortParam) ? (sortParam as MetricTab) : 'earnings';
  const queryClient = useQueryClient();

  const { data: allStats, isLoading: statsLoading } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();

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

  // Pull-to-refresh
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

  // Scroll position retention
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
    <TourHubShell>
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

        {/* Masthead */}
        {statsLoading ? (
          <div style={{ background: '#0F172A', padding: '16px 16px 0' }}>
            <div style={{ height: '14px', width: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '12px' }} className="animate-pulse" />
            <div style={{ height: '24px', width: '180px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '16px' }} className="animate-pulse" />
            <div style={{ height: '100px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '12px' }} className="animate-pulse" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ height: '14px', width: '40px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} className="animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : topCollege ? (
          <CollegeMasthead
            stats={topCollege}
            college={topCollegeMedia}
            activeMetric={activeMetric === 'movers' ? 'earnings' : activeMetric}
            heroAlumni={heroAlumni ?? null}
          />
        ) : null}

        {/* Sticky header */}
        <div
          className="-mx-5 sticky top-0 z-20"
          style={{
            background: 'rgba(248,250,252,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '0.5px solid rgba(15,23,42,0.08)',
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground w-[17px] h-[17px] mt-[5px]" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-10 pl-9 pr-9 rounded-xl text-[13px] bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400/60 transition-all"
              />
              <AnimatePresence>
                {searchValue && (
                  <motion.button
                    onClick={() => setSearchValue('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-[5px] p-1 rounded-full bg-muted active:scale-90"
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

          {/* Back link + search icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 20px 0' }}>
            <Link
              to="/tourhub?tab=overview"
              replace
              className="flex items-center gap-0.5 active:opacity-50 transition-opacity"
              style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(15,23,42,0.5)', textDecoration: 'none' }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
              Tour Overview
            </Link>

            <button
              onClick={() => setSearchExpanded(v => !v)}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: searchExpanded ? 'rgba(247,147,30,0.08)' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Search className="w-4 h-4" style={{ color: searchExpanded ? '#F7931E' : '#94A3B8' }} strokeWidth={2.5} />
            </button>
          </div>

          {/* Underline metric tabs */}
          <div style={{ display: 'flex', marginTop: '4px' }}>
            {METRIC_TABS.map(tab => {
              const isActive = activeMetric === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveMetric(tab.value)}
                  className="flex-shrink-0 active:scale-[0.97] transition-transform"
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '11px',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#0F172A' : '#94A3B8',
                    background: 'transparent', border: 'none',
                    borderBottom: `2px solid ${isActive ? '#F7931E' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search results */}
        {showSearchResults && (
          <div style={{ background: '#ffffff', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
            {searchLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: '52px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }} className="animate-pulse" />
              ))
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((stats, index) => {
                const college = collegeMap?.get(stats.normalized_name) || null;
                return (
                  <motion.div
                    key={stats.normalized_name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                  >
                    <CollegeCard
                      stats={stats}
                      college={college}
                      rank={index + 1}
                    />
                  </motion.div>
                );
              })
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center' as const, fontSize: '13px', color: '#94A3B8' }}>
                No colleges found matching "{debouncedSearch}"
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
          <FranchiseLeaderboard
            limit={25}
            activeMetric={activeMetric}
            onMetricChange={setActiveMetric}
            hideHeader
          />
        </div>
      </div>
    </TourHubShell>
  );
}
