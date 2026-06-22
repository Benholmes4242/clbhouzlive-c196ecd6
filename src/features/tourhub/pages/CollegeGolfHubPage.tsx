import { useMemo, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { TourHubShell } from '../components';
import { TourHubShellTabs } from '../components/TourHubShellTabs';
import { ShellSlot } from '@/components/header/ShellSlot';
import { CollegeShellRow } from '../components/shell/CollegeShellRow';
import { FranchiseLeaderboard } from '../components/college';
import { CollegeMasthead } from '../components/college/CollegeMasthead';
import { CollegeCard } from '../components/college/CollegeCard';
import { useCollegeSeasonStats, useCollegeSearch, type CollegeSeasonStats } from '../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../hooks/useCollegeMedia';
import { useHeroAlumni } from '../hooks/useBatchCollegeAlumni';
import { useFranchiseCaptains } from '../hooks/useFranchiseCaptains';
import { useCollegeWeeklyMovers } from '../hooks/useCollegeMovers';
import { AMBER, INK, INK_FAINT, INK_TINT_06, INK_TINT_07, HAIRLINE_INK_10, SLATE_50, SLATE_150, SURFACE } from '../_shared/tokens';

type MetricTab = 'earnings' | 'wins' | 'top10s' | 'movers';
const VALID_METRICS = new Set<string>(['earnings', 'wins', 'top10s', 'movers']);

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

  // Sort by active metric. For 'movers' tab the hero subject stays
  // #1-by-earnings (locked decision #8) — only the pill set swaps.
  const heroMetric: 'earnings' | 'wins' | 'top10s' =
    activeMetric === 'movers' ? 'earnings' : activeMetric;

  const { sortedForHero, topCollege, runnerUp, isTiedAtOne } = useMemo(() => {
    if (!allStats?.length) {
      return { sortedForHero: [] as CollegeSeasonStats[], topCollege: null, runnerUp: null, isTiedAtOne: false };
    }
    const getValue = (s: CollegeSeasonStats) => getMetricValue(s, heroMetric);
    const sorted = [...allStats].sort((a, b) => getValue(b) - getValue(a));
    const top = sorted[0] ?? null;
    const second = sorted[1] ?? null;
    const tied = !!(top && second && getValue(top) === getValue(second));
    return { sortedForHero: sorted, topCollege: top, runnerUp: second, isTiedAtOne: tied };
  }, [allStats, heroMetric]);
  void sortedForHero;

  const topCollegeMedia = topCollege ? collegeMap?.get(topCollege.normalized_name) ?? null : null;
  const { data: heroAlumni } = useHeroAlumni(topCollege?.normalized_name);

  // Captain for the #1 franchise — drives hero captain pill.
  const captainSlugs = useMemo(
    () => (topCollege ? [topCollege.normalized_name] : []),
    [topCollege]
  );
  const { data: heroCaptainMap } = useFranchiseCaptains(captainSlugs);
  const heroCaptain = topCollege ? heroCaptainMap?.get(topCollege.normalized_name) ?? null : null;

  // Movers context — only fetched for the Movers tab.
  const { data: weeklyRisers } = useCollegeWeeklyMovers({
    direction: 'up',
    limit: 50,
  });
  const moversContext = useMemo(() => {
    if (activeMetric !== 'movers' || !weeklyRisers || weeklyRisers.length === 0) return null;
    const climberCount = weeklyRisers.length;
    const topByDelta = [...weeklyRisers].sort((a, b) => b.earnings_delta - a.earnings_delta)[0];
    const topByRank = [...weeklyRisers]
      .filter(m => (m.earnings_rank_change ?? 0) > 0)
      .sort((a, b) => (b.earnings_rank_change ?? 0) - (a.earnings_rank_change ?? 0))[0];
    const nameOf = (slug: string) => collegeMap?.get(slug)?.short_name
      || collegeMap?.get(slug)?.college_name
      || slug;
    return {
      climberCount,
      biggestJump: topByDelta ? {
        displayName: nameOf(topByDelta.normalized_name),
        earningsDelta: topByDelta.earnings_delta,
      } : null,
      biggestRankMove: topByRank ? {
        displayName: nameOf(topByRank.normalized_name),
        rankDelta: topByRank.earnings_rank_change ?? 0,
      } : null,
    };
  }, [activeMetric, weeklyRisers, collegeMap]);

  const showSearchResults = searchExpanded && debouncedSearch.length >= 2;

  return (
    <TourHubShell showBack={false}>
      <ShellSlot>
        <TourHubShellTabs />
        <CollegeShellRow />
      </ShellSlot>

      <div
        className="pb-24"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: SLATE_50 }}
      >
        {/* Masthead */}
        {statsLoading ? (
          <div style={{ background: SLATE_50, padding: '16px 16px 0' }}>
            <div style={{ height: '14px', width: '200px', background: INK_TINT_06, borderRadius: '4px', marginBottom: '12px' }} className="animate-pulse" />
            <div style={{ height: '24px', width: '180px', background: INK_TINT_06, borderRadius: '4px', marginBottom: '16px' }} className="animate-pulse" />
            <div style={{ height: '100px', background: 'rgba(15,23,42,0.04)', borderRadius: '8px', marginBottom: '12px' }} className="animate-pulse" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', borderTop: '0.5px solid rgba(15,23,42,0.08)' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ height: '14px', width: '40px', background: INK_TINT_06, borderRadius: '4px' }} className="animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : topCollege ? (
          <CollegeMasthead
            stats={topCollege}
            college={topCollegeMedia}
            activeMetric={activeMetric}
            heroAlumni={heroAlumni ?? null}
            captain={heroCaptain}
            runnerUp={runnerUp}
            isTiedAtOne={isTiedAtOne}
            moversContext={moversContext}
          />
        ) : null}

        {/* Inline search bar (back link + metric tabs moved to shell) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px 0' }}>
            <button
              onClick={() => setSearchExpanded(v => !v)}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: searchExpanded ? AMBER_SOFT_BG : SLATE_150,
                border: 'none', cursor: 'pointer',
              }}
              aria-label="Search franchises"
            >
              <Search className="w-4 h-4" style={{ color: searchExpanded ? AMBER : INK }} strokeWidth={2.5} />
            </button>
          </div>

          {/* Collapsible search input */}
          <div
            className="overflow-hidden transition-all duration-250 ease-in-out px-4"
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
        </div>

        {/* Search results */}
        {showSearchResults && (
          <div style={{ background: SURFACE, borderBottom: `1px solid ${INK_TINT_07}`, marginTop: '8px' }}>
            {searchLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ height: '52px', borderBottom: `0.5px solid ${INK_TINT_07}` }} className="animate-pulse" />
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
              <div style={{ padding: '32px 16px', textAlign: 'center' as const, fontSize: '13px', color: INK_FAINT }}>
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
