/**
 * SeasonLeaderboards - Cinematic Skill Highlights
 * 
 * Show dominance first. Reveal depth on intent.
 * Professional → Slick → Informative → Gamified
 */

import { useState, memo, useEffect } from 'react';
import { ChevronRight, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonLeaderboards, CATEGORY_CONFIG as CATEGORY_DATA_CONFIG } from '@/features/tourhub/hooks/useSeasonLeaderboards';
import { CategoryTabs } from './CategoryTabs';
import { LeaderHero } from './LeaderHero';
import { ChasingPack } from './ChasingPack';
import { SeasonToggle } from './SeasonToggle';
import { CATEGORY_CONFIG, CATEGORY_ACCENT_COLORS } from './constants';
import { BarChartIcon, type CategoryId } from './StatCategoryIcons';

/** Discipline context lines — one cinematic stat per discipline */
const DISCIPLINE_CONTEXT: Record<CategoryId, string> = {
  sg_total: 'Best strokes gained vs field',
  scoring_avg: 'Lowest scoring average on tour',
  earnings: 'Highest earners this season',
  distance: 'Longest season driving average',
  accuracy: 'Most fairways hit this season',
  gir_pct: 'Highest greens in regulation rate',
  putting: 'Fewest putts per round',
  scrambling: 'Best recovery rate on tour',
  sand_saves: 'Best bunker save percentage',
};

/** Category → URL slug mapping for navigation */
const CATEGORY_TO_URL_SLUG: Record<CategoryId, string> = {
  sg_total: 'strokes_gained_total',
  scoring_avg: 'scoring_avg',
  earnings: 'earnings',
  distance: 'drive_avg',
  accuracy: 'drive_acc',
  gir_pct: 'gir_pct',
  putting: 'putt_avg',
  scrambling: 'scrambling_pct',
  sand_saves: 'sand_saves_pct',
};

/** Skeleton loader */
const SeasonLeaderboardsSkeleton = memo(function SeasonLeaderboardsSkeleton() {
  return (
    <section>
      <div className="px-4 mb-4">
        <div className="h-3 w-24 rounded bg-muted animate-pulse mb-2" />
        <div className="h-7 w-40 rounded bg-muted animate-pulse" />
      </div>
      <div className="flex gap-2 px-4 mb-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 rounded-[10px] flex-shrink-0 bg-muted animate-pulse" />
        ))}
      </div>
      <div className="mx-4 rounded-2xl overflow-hidden bg-card border border-border/50" style={{ padding: '24px 20px' }}>
        <div className="flex items-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 rounded mb-2 bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-12 w-28 rounded mt-4 bg-muted animate-pulse" />
      </div>
    </section>
  );
});

// Empty state
const SeasonLeaderboardsEmpty = memo(function SeasonLeaderboardsEmpty() {
  return (
    <section>
      <div className="px-4">
        <p
          className="m-0 flex items-center gap-1.5"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: 'hsl(var(--accent-amber))',
            marginBottom: '6px',
          }}
        >
          <Trophy className="w-3.5 h-3.5" />
          2026 Season
        </p>
        <h2 className="m-0 mt-1 text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
          Performance Rankings
        </h2>
      </div>
      <div className="mx-4 mt-4 p-8 text-center rounded-2xl bg-muted/30 border border-border/50">
        <div className="flex flex-col items-center gap-3">
          <BarChartIcon size={32} className="text-muted-foreground/30" />
          <h3 className="font-semibold text-foreground m-0">No Stats Available</h3>
          <p className="text-sm text-muted-foreground m-0">Season statistics will appear here once available.</p>
        </div>
      </div>
    </section>
  );
});

export function SeasonLeaderboards() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('distance');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data, isLoading, error } = useSeasonLeaderboards(selectedYear);

  // Default to 2026 if available, otherwise the newest season with data
  useEffect(() => {
    if (data && selectedYear === undefined) {
      const has2026 = data.availableSeasons.some((s) => s.year === 2026);
      setSelectedYear(has2026 ? 2026 : data.year);
    }
  }, [data, selectedYear]);

  // Close full list when category changes
  const handleCategoryChange = (newCategory: CategoryId) => {
    if (newCategory === activeCategory) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCategory(newCategory);
      setIsTransitioning(false);
    }, 120);
  };

  if (isLoading) return <SeasonLeaderboardsSkeleton />;

  // Show empty state when there's no data at all (no seasons found)
  if (error && !data) return <SeasonLeaderboardsEmpty />;

  // When a selected year has no stats yet, show a graceful in-section message
  const hasNoCategories = !data?.categories?.length;
  const displayYear = selectedYear ?? data?.year;

  const activeCategoryData = data?.categories.find((c) => c.id === activeCategory);
  const leader = activeCategoryData?.players[0];
  const chasers = activeCategoryData?.players.slice(1, 6) || [];
  const categoryConfig = CATEGORY_DATA_CONFIG[activeCategory];
  const accent = CATEGORY_ACCENT_COLORS[activeCategory];
  const contextLine = DISCIPLINE_CONTEXT[activeCategory];

  return (
    <section>
      {/* ═══ SECTION HEADER ═══ */}
      <motion.div
        className="flex items-end justify-between px-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '16px' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <p
              className="m-0 flex items-center gap-1.5"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'hsl(var(--accent-amber))',
              }}
            >
              <Trophy className="w-3.5 h-3.5" />
              {displayYear} Season
            </p>
            {data?.availableSeasons && (
              <SeasonToggle
                availableSeasons={data.availableSeasons}
                selectedYear={selectedYear ?? data.year}
                onYearChange={setSelectedYear}
              />
            )}
          </div>
          <h2 className="m-0 mt-1 text-foreground" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px' }}>
            Performance Rankings
          </h2>
        </div>
        <button
          onClick={() => {
            const leaderCategory = CATEGORY_TO_URL_SLUG[activeCategory] || 'strokes_gained_total';
            navigate(`/tourhub?tab=leaderboards&category=${leaderCategory}`);
          }}
          className="flex items-center gap-0.5 transition-all duration-300 bg-transparent border-none cursor-pointer group text-muted-foreground"
          style={{ fontSize: '13px', fontWeight: 500, minHeight: '44px' }}
        >
          View All
          <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </motion.div>

      {/* ═══ CATEGORY TABS (Scene Selectors) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <CategoryTabs
          categories={CATEGORY_CONFIG}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </motion.div>

      {/* ═══ NO DATA FOR SELECTED YEAR ═══ */}
      {hasNoCategories ? (
        <motion.div
          className="mx-4 mt-4 p-8 text-center rounded-2xl bg-muted/30 border border-border/50"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-3">
            <BarChartIcon size={32} className="text-muted-foreground/30" />
            <h3 className="font-semibold text-foreground m-0">{displayYear} Stats Coming Soon</h3>
            <p className="text-sm text-muted-foreground m-0">
              {displayYear} season statistics will be available shortly.
            </p>
          </div>
        </motion.div>
      ) : (
        /* ═══ CINEMATIC CONTENT (no card wrapper) ═══ */
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="px-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: isTransitioning ? 0.6 : 1, y: isTransitioning ? -4 : 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ marginTop: '16px' }}
          >
            {/* Stat context line — no icon badge */}
            <p className="m-0 text-muted-foreground/60 mb-4" style={{ fontSize: '13px', fontWeight: 500 }}>
              {contextLine}
            </p>

            {/* ═══ CHAMPION SPOTLIGHT ═══ */}
            {leader && (
              <div style={{ marginBottom: '12px' }}>
                <LeaderHero player={leader} accentColor={activeCategory} />
              </div>
            )}

            {/* ═══ THE CHASERS (#2 & #3) ═══ */}
            {chasers.length > 0 && leader && (
              <ChasingPack
                players={chasers}
                leaderValue={leader.statValue}
                higherIsBetter={categoryConfig?.higherIsBetter ?? true}
                unit={leader.statUnit}
                accentColor={activeCategory}
              />
            )}

            {/* ═══ VIEW FULL RANKINGS — navigates to Leaders page ═══ */}
            <button
              onClick={() => {
                const leaderCategory = CATEGORY_TO_URL_SLUG[activeCategory] || 'strokes_gained_total';
                navigate(`/tourhub?tab=leaderboards&category=${leaderCategory}`);
              }}
              className="w-full flex items-center justify-center gap-1 py-3 text-[13px] font-semibold text-foreground hover:opacity-70 active:scale-[0.98] transition-all duration-150"
              style={{ marginTop: '12px' }}
            >
              View Full Rankings
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}
