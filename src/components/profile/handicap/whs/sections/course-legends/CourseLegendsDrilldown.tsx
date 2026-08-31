import { GAM } from '../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { lookupCourseMetaV2 } from '@/lib/whs/courseNameMatcher';
import { useCourseLegends } from '@/hooks/gam/useCourseLegends';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { useActiveActor } from '@/context/ActiveActorContext';
import { Skeleton, RetryStub } from '../../../gam/_shared/GamAtoms';
import { ChampionsEmptyState, ChampionsWindowEmptyState } from './drilldown/ChampionsEmptyState';
import {
  legendCategoryLabel,
  legendCategoryIcon,
  formatLegendValueCompact,
} from '@/lib/gam/visuals';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import type { CourseSelection } from './types';

import { DrilldownHeader } from './drilldown/DrilldownHeader';

import { ChampionsYouCard } from './drilldown/ChampionsYouCard';
import { ChampionsDuelCard } from './drilldown/ChampionsDuelCard';
import { ChampionsUnclaimedCard } from './drilldown/ChampionsUnclaimedCard';
import { ChampionsBoard } from './drilldown/ChampionsBoard';



import { FullCourseLeaderboardSheet } from './drilldown/FullCourseLeaderboardSheet';
import { FullCourseLeaderboardSheetDispatch } from './drilldown/FullCourseLeaderboardSheetDispatch';
import { WindowToggle } from './_shared/WindowToggle';

import { ChampionsCourseSearch } from './drilldown/ChampionsCourseSearch';
import { ChampionsInfoCarousel } from './drilldown/ChampionsInfoCarousel';
import { formatGapFromChampion } from './drilldown/_shared/helpers';
import { chaseCtaLine } from './drilldown/_shared/duelTension';
import { CHAMPIONS_ORDER_90D, CHAMPIONS_ORDER_ALL_TIME, orderWithWomensRecord } from './_shared/championsOrder';
import { useProBenchmarks } from '@/hooks/gam/useProBenchmarks';
import { pickProBenchmark, filterProsForViewer, PRO_BAND_BASES, type ProBandBase } from './drilldown/_shared/proBenchmark';
import { useProfileData } from '@/hooks/useProfileData';

const SHORT_LABELS: Record<LegendCategory, string> = {
  best_score_diff_90d:      'Score',
  best_score_diff_all_time: 'Score',
  lowest_gross_90d:         'Gross',
  lowest_gross_all_time:    'Gross',
  most_birdies_90d:         'Birdie',
  most_birdies_all_time:    'Birdie',
  best_stableford_90d:      'Stableford',
  best_stableford_all_time: 'Stableford',
  most_eagles_90d:          'Eagle',
  most_eagles_all_time:     'Eagle',
  most_aces_90d:            'Ace',
  most_aces_all_time:       'Ace',
  most_albatrosses_90d:     'Albatross',
  most_albatrosses_all_time:'Albatross',
  most_rounds_90d:              'Rounds',
  most_rounds_all_time:         'Rounds',
  lowest_gross_women_90d:       "Women's",
  lowest_gross_women_all_time:  "Women's",
};

const UNITS: Record<LegendCategory, string> = {
  best_score_diff_90d:      'vs HCP',
  best_score_diff_all_time: 'vs HCP',
  lowest_gross_90d:         '',
  lowest_gross_all_time:    '',
  most_birdies_90d:         '',
  most_birdies_all_time:    '',
  best_stableford_90d:      'pts',
  best_stableford_all_time: 'pts',
  most_eagles_90d:          '',
  most_eagles_all_time:     '',
  most_aces_90d:            '',
  most_aces_all_time:       '',
  most_albatrosses_90d:     '',
  most_albatrosses_all_time:'',
  most_rounds_90d:              '',
  most_rounds_all_time:         '',
  lowest_gross_women_90d:       '',
  lowest_gross_women_all_time:  '',
};


function formatHeldDuration(attainedAtIso: string): string {
  const attainedAt = new Date(attainedAtIso);
  if (isNaN(attainedAt.getTime())) return '—';
  const diffMs = Date.now() - attainedAt.getTime();
  if (diffMs < 0) return '—';
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  userId: string | null;
  rank30d: number | null;
  delta: number | null;
}

interface Props {
  /** Course context. */
  selection: CourseSelection;
  /** When true, suppresses the DrilldownHeader — for embedded contexts (e.g. Course Detail Legends tab) where the parent already renders a course hero. */
  hideHeader?: boolean;
  /** Backdrop theme threaded to embedded rows/avatars and the full-leaderboard sheet. Default 'dark' preserves handicap rendering. */
  theme?: 'light' | 'dark';
}

export const CourseLegendsDrilldown: React.FC<Props> = ({ selection, hideHeader = false, theme = 'dark' }) => {
  const { t } = useTranslation('courses');
  const ctx = selection;

  // Deep link from a game notification: ?cat=<legend_category>. Selects the
  // matching window and autoscrolls to that crown section once data lands.
  const [searchParams] = useSearchParams();
  const deepCat = searchParams.get('cat') as LegendCategory | null;

  const { activeActor } = useActiveActor();
  const { data, isLoading: fetching, isFetched, isError, refetch } = useCourseLegends(ctx.courseId, activeActor?.id);
  // Settled is not "not loading": useCourseLegends is gated on courseId.
  const isLoading = !isFetched || fetching;
  const { data: meta } = useCourseMeta(ctx.courseId);
  const { data: prosRaw } = useProBenchmarks();
  const { profile } = useProfileData();
  const viewerGender = (profile as any)?.gender as 'male' | 'female' | 'prefer_not_to_say' | null | undefined;
  const pros = useMemo(() => filterProsForViewer(prosRaw ?? [], viewerGender), [prosRaw, viewerGender]);
  const [window, setWindow] = useState<LegendWindow>(
    deepCat && String(deepCat).endsWith('_90d') ? '90d' : 'all_time',
  );
  const [courseHeaderImage, setCourseHeaderImage] = useState<string | null>(null);
  const [fullLeaderboardCategory, setFullLeaderboardCategory] =
    useState<LegendCategory | null>(null);
  const autoSwitchedRef = useRef(false);
  const [autoSwitchedToAllTime, setAutoSwitchedToAllTime] = useState(false);


  const has90d = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (data ?? []).some((r: any) => String(r.category).endsWith('_90d')),
    [data],
  );
  const hasAllTime = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (data ?? []).some((r: any) => String(r.category).endsWith('_all_time')),
    [data],
  );
  const activeWindowHasData = window === '90d' ? has90d : hasAllTime;
  

  useEffect(() => {
    if (autoSwitchedRef.current) return;
    if (isLoading || isError) return;
    if ((data ?? []).length === 0) return;
    if (!has90d && hasAllTime && window === '90d') {
      autoSwitchedRef.current = true;
      setWindow('all_time');
      setAutoSwitchedToAllTime(true);
    } else {
      autoSwitchedRef.current = true;
    }
  }, [data, has90d, hasAllTime, isLoading, isError, window]);

  const handleWindowChange = (w: LegendWindow) => {
    setAutoSwitchedToAllTime(false);
    setWindow(w);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await lookupCourseMetaV2(ctx.courseName);
        if (!cancelled) {
          setCourseHeaderImage(m?.thumbnail_image ?? null);
        }
      } catch {
        if (!cancelled) setCourseHeaderImage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ctx.courseName]);

  // Derive the visible category order from the holder data returned by
  // useCourseLegends (data). The women's-division gross record is spliced
  // in by orderWithWomensRecord ONLY when a woman actually holds a card
  // on this course — no unclaimed slot, no visual change otherwise.
  // best_score_diff_* is intentionally excluded from the drilldown grid.
  const { visibleCategories90d, visibleCategoriesAllTime } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const present = new Set<LegendCategory>((data ?? []).map((r: any) => r.category as LegendCategory));
    const list90: LegendCategory[] = orderWithWomensRecord(CHAMPIONS_ORDER_90D, present)
      .filter((c): c is LegendCategory => c !== 'best_score_diff_90d');
    const listAll: LegendCategory[] = orderWithWomensRecord(CHAMPIONS_ORDER_ALL_TIME, present)
      .filter((c): c is LegendCategory => c !== 'best_score_diff_all_time');
    return { visibleCategories90d: list90, visibleCategoriesAllTime: listAll };
  }, [data]);

  const visibleCategories = window === '90d' ? visibleCategories90d : visibleCategoriesAllTime;

  const groupedWithTotals = useMemo(() => {
    const m = new Map<LegendCategory, { rows: SectionRow[]; total: number }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data ?? []).forEach((row: any) => {
      const cat = row.category as LegendCategory;
      const entry = m.get(cat) ?? { rows: [], total: row.total_count_in_category ?? 0 };
      entry.rows.push({
        rank: row.rank,
        name: row.user_display_name ?? 'Player',
        photoUrl: row.user_photo_url ?? null,
        value: row.value,
        valueDisplay: formatLegendValueCompact(cat, row.value),
        attained_at: row.attained_at,
        isSelf: row.is_self,
        userId: row.user_id ?? null,
        rank30d: row.rank_30d ?? null,
        delta: row.delta ?? null,
      });
      entry.total = row.total_count_in_category ?? entry.rows.length;
      m.set(cat, entry);
    });
    return m;
  }, [data]);

  const yourRanks = useMemo(() => {
    const r: Partial<Record<LegendCategory, number | null>> = {};
    visibleCategories.forEach((cat) => {
      const entry = groupedWithTotals.get(cat);
      const self = entry?.rows.find((row) => row.isSelf);
      r[cat] = self?.rank ?? null;
    });
    return r;
  }, [groupedWithTotals, visibleCategories]);

  const youOwnedCount = Object.values(yourRanks).filter((r) => r === 1).length;

  // ISO attained_at per crown the viewer holds — feeds CrownCabinet reign lengths.
  const yourAttainedAt = useMemo(() => {
    const r: Partial<Record<LegendCategory, string | null>> = {};
    visibleCategories.forEach((cat) => {
      const entry = groupedWithTotals.get(cat);
      const self = entry?.rows.find((row) => row.isSelf && row.rank === 1);
      r[cat] = self?.attained_at ?? null;
    });
    return r;
  }, [groupedWithTotals, visibleCategories]);



  // Honours-board rows for the connect gate: every visible crown category in the
  // board's own display order, with its rank-1 holder, value and attained date.
  // No new query — this is the data the board already renders.
  const honoursCrowns = useMemo(
    () =>
      visibleCategories.map((cat) => {
        const champion = groupedWithTotals.get(cat)?.rows.find((r) => r.rank === 1) ?? null;
        return {
          key: cat,
          label: legendCategoryLabel[cat],
          holderName: champion ? champion.name : null,
          valueDisplay: champion ? champion.valueDisplay : null,
          attainedAt: champion?.attained_at ?? null,
        };
      }),
    [visibleCategories, groupedWithTotals],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Deep-link autoscroll: once the crown sections are painted, bring the
  // notified category into view with a brief highlight. Runs once per link.
  const deepScrolledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!deepCat) return;
    if (deepScrolledRef.current === deepCat) return;
    if (isLoading || isError) return;
    if (!visibleCategories.includes(deepCat)) return;
    const id = globalThis.setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        `[data-category="${deepCat}"]`,
      );
      if (!el) return;
      deepScrolledRef.current = deepCat;
      const top = el.getBoundingClientRect().top + (globalThis.scrollY ?? 0) - 96;
      try {
        globalThis.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } catch {
        el.scrollIntoView({ block: 'start' });
      }
      el.style.transition = 'box-shadow 320ms ease';
      el.style.boxShadow = 'inset 0 0 0 1.5px rgba(247,147,30,0.55)';
      globalThis.setTimeout(() => {
        el.style.boxShadow = 'none';
      }, 1600);
    }, 260);
    return () => globalThis.clearTimeout(id);
  }, [deepCat, isLoading, isError, visibleCategories]);


  const sheetCategoryDescriptors = useMemo(
    () =>
      visibleCategories.map((cat) => ({
        key: cat,
        label: legendCategoryLabel[cat],
        short: SHORT_LABELS[cat],
        icon: legendCategoryIcon[cat],
        unit: UNITS[cat],
      })),
    [visibleCategories],
  );

  // Per-visit rotation counter — exactly ONE increment per drilldown mount.
  // Falls back to date-hash seed inside pickProBenchmark if localStorage is unavailable.
  const visitNRef = useRef<number | null>(null);
  const visitIncrementedRef = useRef(false);
  if (visitNRef.current === null) {
    try {
      const raw = globalThis.localStorage.getItem('pro_benchmark_visit_n');
      const parsed = raw == null ? 0 : parseInt(raw, 10);
      visitNRef.current = Number.isFinite(parsed) ? parsed : 0;
    } catch {
      visitNRef.current = null;
    }
  }
  useEffect(() => {
    if (visitIncrementedRef.current) return;
    visitIncrementedRef.current = true;
    try {
      const cur = visitNRef.current ?? 0;
      globalThis.localStorage.setItem('pro_benchmark_visit_n', String(cur + 1));
    } catch {
      /* ignore */
    }
  }, []);

  // Pro Benchmark band — ALL-TIME window only; silently absent on failure
  const proBenchmarkPick = useMemo(() => {
    if (window !== 'all_time') return null;
    if (!pros || pros.length === 0) return null;

    const eligibleBases: ProBandBase[] = PRO_BAND_BASES.filter((b) => {
      const cat = `${b}_all_time` as LegendCategory;
      if (!visibleCategories.includes(cat)) return false;
      const entry = groupedWithTotals.get(cat);
      return !!entry && entry.rows.length > 0;
    });
    if (eligibleBases.length === 0) return null;

    const recordEntry = groupedWithTotals.get('lowest_gross_all_time' as LegendCategory);
    const recordGross = recordEntry?.rows[0]?.value ?? null;

    return pickProBenchmark({
      pros,
      courseId: ctx.courseId,
      courseName: ctx.courseName,
      course: {
        cr: meta?.course_cr ?? null,
        slope: meta?.course_slope ?? null,
        par: meta?.course_par ?? null,
        yards: meta?.course_yards ?? null,
      },
      viewerRounds: meta?.your_rounds ?? null,
      eligibleBases,
      recordGross,
      visitN: visitNRef.current,
    });
  }, [pros, ctx.courseId, meta, window, groupedWithTotals, visibleCategories]);

  return (
    /*
      The whole subtree reads var(--hcp-*), and those variables exist ONLY
      inside a .hcp-dark / .hcp-light class scope (src/styles/handicap-dark.css).
      Without the class every such declaration resolves to nothing and is
      dropped - which is why unheld crown slots had no wash, no dashed border
      and no icon colour on the Course Detail Champions tab. The class is the
      fix; do NOT add var() fallbacks in the consumers.
    */
    <div
      ref={containerRef}
      className={theme === 'light' ? 'hcp-light' : 'hcp-dark'}
      style={theme === 'light' ? { background: '#F4F6F9' } : undefined}
    >

      {!hideHeader && (
        <DrilldownHeader
          state={ctx}
          youOwnedCount={youOwnedCount}
          totalCategories={visibleCategories.length}
          courseHeaderImage={courseHeaderImage}
          cr={meta?.course_cr ?? null}
          slope={meta?.course_slope ?? null}
        />
      )}


      <ChampionsInfoCarousel
        window={window}
        courseName={ctx.courseName}
        courseHeaderImage={courseHeaderImage}
        boardSettled={!isLoading && !isError}
        crowns={honoursCrowns}
        figures={{
          rounds: null,
          avgToPar: meta?.avg_over_par != null
            ? `${meta.avg_over_par > 0 ? '+' : ''}${meta.avg_over_par.toFixed(1)}`
            : null,
          harderThanPct: null,
        }}
      />

      {/* In-tab course search — always shown (synced + non-synced). Includes
          a small connect-WHS cue beneath for non-synced users. */}
      <ChampionsCourseSearch currentCourseId={ctx.courseId} />


      {autoSwitchedToAllTime && window === 'all_time' && (
        <div style={{ padding: '0 16px 12px' }}>
          <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: 11.5, fontWeight: 600, color: 'var(--hcp-t-60)', letterSpacing: '-0.005em' }}>
            No rounds in the last 90 days — showing all-time crowns.
          </span>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={12} />
          ))}
        </div>
      )}

      {isError && (
        <div style={{ padding: '16px' }}>
          <RetryStub message={t('courseDetail.legends.errorLoading')} onRetry={() => refetch()} />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <ChampionsEmptyState courseName={ctx.courseName} />
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && !activeWindowHasData && (
        <>
          <div style={{ padding: '16px 16px 4px' }}>
            <WindowToggle window={window} setWindow={handleWindowChange} variant={theme === 'light' ? 'light' : 'dark'} />
          </div>
          <ChampionsWindowEmptyState
            window={window}
            onSwitch={() => handleWindowChange(window === '90d' ? 'all_time' : '90d')}
          />
        </>
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && activeWindowHasData && (
        <>
          {/* One card: you-at-this-club stats + crown cabinet, rivalry line as footer. */}
          <ChampionsYouCard
            userId={activeActor?.id}
            courseId={ctx.courseId}
            theme={theme}
            slots={visibleCategories.map((cat) => ({
              key: cat,
              short: SHORT_LABELS[cat],
              icon: legendCategoryIcon[cat],
              held: yourRanks[cat] === 1,
              attainedAt: yourAttainedAt[cat] ?? null,
            }))}
            heldCount={youOwnedCount}
            window={window}
            onWindowChange={handleWindowChange}
            toggleVariant={theme === 'light' ? 'light' : 'dark'}
          />


          




          {/* BRIEF_CHAMPIONS_BOARD — one category as a full ranked board, with
              a pill picker above it that keeps the other records visible. */}
          <ChampionsBoard
            categories={sheetCategoryDescriptors}
            grouped={groupedWithTotals}
            window={window}
            coursePar={meta?.course_par ?? null}
            onOpenFull={(cat) => setFullLeaderboardCategory(cat)}
          />


        </>
      )}

      {theme === 'light' ? (
        <FullCourseLeaderboardSheetDispatch
          open={fullLeaderboardCategory !== null}
          onClose={() => setFullLeaderboardCategory(null)}
          courseName={ctx.courseName}
          groupedRows={groupedWithTotals}
          visibleCategories={sheetCategoryDescriptors}
          initialCategory={fullLeaderboardCategory ?? visibleCategories[0]}
          window={window}
          yourRanks={yourRanks}
          theme={theme}
        />
      ) : (
        <FullCourseLeaderboardSheet
          open={fullLeaderboardCategory !== null}
          onClose={() => setFullLeaderboardCategory(null)}
          courseName={ctx.courseName}
          groupedRows={groupedWithTotals}
          visibleCategories={sheetCategoryDescriptors}
          initialCategory={fullLeaderboardCategory ?? visibleCategories[0]}
          window={window}
          yourRanks={yourRanks}
          theme={theme}
        />
      )}
    </div>
  );
};

export default CourseLegendsDrilldown;
