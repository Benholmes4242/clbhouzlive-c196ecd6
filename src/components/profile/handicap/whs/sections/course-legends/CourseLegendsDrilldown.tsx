import { GAM } from '../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { lookupCourseMetaV2 } from '@/lib/whs/courseNameMatcher';
import { useCourseLegends } from '@/hooks/gam/useCourseLegends';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { useActiveActor } from '@/context/ActiveActorContext';
import { Skeleton, RetryStub } from '../../../gam/_shared/GamAtoms';
import {
  legendCategoryLabel,
  formatLegendValueCompact,
} from '@/lib/gam/visuals';
import type { LegendCategory, LegendWindow } from '@/lib/gam/types';
import type { CourseSelection } from './types';

import { DrilldownHeader } from './drilldown/DrilldownHeader';

import { FlatBoardSheet } from './flat/FlatBoardSheet';
import { UnclaimedSection, WhatCounts, NobodyHasPlayed } from './flat/UnclaimedSection';
import { useBoardMemberUsernames } from '@/hooks/gam/useBoardMemberUsernames';

import { YourCrowns } from './flat/YourCrowns';
import { BoardSection } from './flat/BoardSection';
import { useWhsConnection } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';

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




/**
 * §3.3 — the canonical seven all-time boards, so Unclaimed can name what is
 * missing. best_score_diff is excluded from this tab, as in the grid order.
 */
const CANONICAL_BOARDS: LegendCategory[] = CHAMPIONS_ORDER_ALL_TIME.filter(
  (c) => c !== 'best_score_diff_all_time',
);

/** Lower-case board words for the Unclaimed sentence. */
const BOARD_WORD: Partial<Record<LegendCategory, string>> = {
  lowest_gross_all_time: 'gross',
  best_stableford_all_time: 'stableford',
  most_aces_all_time: 'ace',
  most_albatrosses_all_time: 'albatross',
  most_eagles_all_time: 'eagle',
  most_birdies_all_time: 'birdie',
  most_rounds_all_time: 'rounds',
};

interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
  userId: string | null;
  username?: string | null;
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

  /**
   * §2 (this message) — the row tap needs a destination. The board RPC joins
   * user_profiles for names and faces but does not return the username, and its
   * deployed signature is not ours to widen, so the ids are resolved here.
   */
  const boardUserIds = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (data ?? []).map((r: any) => r.user_id as string).filter(Boolean),
    [data],
  );
  const { data: usernameMap } = useBoardMemberUsernames(boardUserIds);

  const grouped = useMemo(() => {
    if (!usernameMap) return groupedWithTotals;
    const m = new Map<LegendCategory, { rows: SectionRow[]; total: number }>();
    groupedWithTotals.forEach((entry, cat) => {
      m.set(cat, {
        total: entry.total,
        rows: entry.rows.map((r) => ({
          ...r,
          username: r.userId ? usernameMap[r.userId] ?? null : null,
        })),
      });
    });
    return m;
  }, [groupedWithTotals, usernameMap]);

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

  /* ===================== BRIEF_CHAMPIONS_TAB_REBUILD =====================
   * §3.1 YOUR CROWNS is ALWAYS ALL TIME — the window toggle governs the board
   * and the sheet only. A crown is a claim on the course record; "you hold it
   * over 90 days" is a different and weaker claim, so it never appears here.
   */
  const crownStatement = useMemo(() => {
    const cats = visibleCategoriesAllTime;
    const held: Array<{ label: string; attainedAt: string | null }> = [];
    const byHolder = new Map<string, number>();
    let claimedCount = 0;
    cats.forEach((cat) => {
      const champion = groupedWithTotals.get(cat)?.rows.find((r) => r.rank === 1);
      if (!champion) return;
      claimedCount += 1;
      if (champion.isSelf) {
        held.push({ label: SHORT_LABELS[cat], attainedAt: champion.attained_at ?? null });
      } else {
        byHolder.set(champion.name, (byHolder.get(champion.name) ?? 0) + 1);
      }
    });
    let otherHolderName: string | null = null;
    let otherHolderClaimedCount = 0;
    byHolder.forEach((n, name) => {
      if (n > otherHolderClaimedCount) {
        otherHolderClaimedCount = n;
        otherHolderName = name;
      }
    });
    return { totalBoards: cats.length, held, claimedCount, otherHolderName, otherHolderClaimedCount };
  }, [visibleCategoriesAllTime, groupedWithTotals]);

  /** §3.3 — the boards nobody holds, all time, named in order. */
  const unclaimedNames = useMemo(
    () =>
      CANONICAL_BOARDS.filter(
        (cat) => (groupedWithTotals.get(cat)?.rows.length ?? 0) === 0,
      ).map((cat) => BOARD_WORD[cat] ?? String(cat)),
    [groupedWithTotals],
  );

  /** §3.2 — descriptors for the flat board, in the active window. */
  const boardDescriptors = useMemo(
    () =>
      visibleCategories.map((cat) => ({
        key: cat,
        label: legendCategoryLabel[cat],
        short: SHORT_LABELS[cat],
      })),
    [visibleCategories],
  );

  const [selectedCategory, setSelectedCategory] = useState<LegendCategory | null>(
    deepCat && CHAMPIONS_ORDER_90D.concat(CHAMPIONS_ORDER_ALL_TIME).includes(deepCat) ? deepCat : null,
  );

  /** The chosen board when it still has rows in this window, else the first claimed. */
  const activeBoardKey = useMemo(() => {
    const claimed = visibleCategories.filter((c) => (groupedWithTotals.get(c)?.rows.length ?? 0) > 0);
    if (selectedCategory && claimed.includes(selectedCategory)) return selectedCategory;
    const gross = claimed.find((c) => String(c).startsWith('lowest_gross'));
    return gross ?? claimed[0] ?? visibleCategories[0];
  }, [selectedCategory, visibleCategories, groupedWithTotals]);

  const navigate = useNavigate();
  const { data: whsConnection, isFetched: whsFetched } = useWhsConnection(activeActor?.id);

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
        <NobodyHasPlayed totalBoards={CANONICAL_BOARDS.length} />
      )}

      {/* BRIEF_CHAMPIONS_TAB_REBUILD §3.1 + §3.2 — a statement, then the board. */}
      {!isLoading && !isError && (data ?? []).length > 0 && (
        <div>
          <YourCrowns
            signedOut={!activeActor?.id}
            noHandicap={Boolean(activeActor?.id) && whsFetched && !whsConnection}
            onConnect={() => {
              analyticsEvents.track('champions_connect_handicap', { course_id: ctx.courseId });
              navigate('/handicap');
            }}
            totalBoards={crownStatement.totalBoards}
            held={crownStatement.held}
            otherHolderName={crownStatement.otherHolderName}
            claimedCount={crownStatement.claimedCount}
            otherHolderClaimedCount={crownStatement.otherHolderClaimedCount}
          />

          {/* Deep-link anchor: the flat tab shows one board at a time, so the
              notified category IS this section once activeBoardKey resolves. */}
          <div data-category={activeBoardKey}>
          <BoardSection
            categories={boardDescriptors}
            grouped={grouped}
            activeKey={activeBoardKey}
            onSelectCategory={(k) => {
              analyticsEvents.track('champions_board_chip_changed', {
                course_id: ctx.courseId,
                from: activeBoardKey,
                to: k,
              });
              setSelectedCategory(k);
            }}
            legendWindow={window}
            canSwitchWindow={has90d}
            onWindowChange={(w) => {
              analyticsEvents.track('champions_window_changed', { course_id: ctx.courseId, window: w });
              handleWindowChange(w);
              setSelectedCategory(null);
            }}
            coursePar={meta?.course_par ?? null}
            onOpenFull={(cat) => {
              analyticsEvents.track('champions_see_all', { course_id: ctx.courseId, category: cat });
              setFullLeaderboardCategory(cat);
            }}
            onRowPress={(row) => {
              // A row about a member navigates to that member. No username, no
              // tap and no event — the row is not offered as interactive.
              if (!row.username) return;
              analyticsEvents.track('champions_row_tapped', {
                course_id: ctx.courseId,
                category: activeBoardKey,
                member_id: row.userId ?? null,
                is_self: row.isSelf,
              });
              navigate(`/profile/${row.username}`);
            }}
          />
          </div>


          <UnclaimedSection
            names={unclaimedNames}
          />

          <WhatCounts />
        </div>
      )}


      <FlatBoardSheet
        open={fullLeaderboardCategory !== null}
        onClose={() => {
          analyticsEvents.track('champions_sheet_dismissed', { course_id: ctx.courseId });
          setFullLeaderboardCategory(null);
        }}
        courseName={ctx.courseName}
        categories={boardDescriptors}
        grouped={grouped}
        initialCategory={fullLeaderboardCategory ?? activeBoardKey}
        legendWindow={window}
        coursePar={meta?.course_par ?? null}
        onCategoryChange={(from, to) =>
          analyticsEvents.track('champions_sheet_board_changed', {
            course_id: ctx.courseId,
            from,
            to,
          })
        }
        onRowPress={(row) => {
          if (!row.username) return;
          analyticsEvents.track('champions_row_tapped', {
            course_id: ctx.courseId,
            category: fullLeaderboardCategory ?? activeBoardKey,
            member_id: row.userId ?? null,
            is_self: row.isSelf,
            surface: 'sheet',
          });
          navigate(`/profile/${row.username}`);
        }}
      />

    </div>
  );
};

export default CourseLegendsDrilldown;
