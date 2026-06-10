import { GAM } from '../../gam/tokens';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { ChampionsCoursePulsePanel } from './drilldown/ChampionsCoursePulsePanel';
import { ChampionsYourStandingCard } from './drilldown/ChampionsYourStandingCard';
import { ChampionsCategorySection } from './drilldown/ChampionsCategorySection';
import { CategoryNavRail } from './drilldown/CategoryNavRail';
import { FullCourseLeaderboardSheet } from './drilldown/FullCourseLeaderboardSheet';
import { WindowToggle } from './CourseLegendsSection';
import { ConnectHandicapCue } from '@/components/courses/course-detail/ConnectHandicapCue';
import { ChampionsCourseSearch } from './drilldown/ChampionsCourseSearch';


const CATEGORIES_ORDER_90D: LegendCategory[] = [
  'lowest_gross_90d',
  'most_aces_90d',
  'most_eagles_90d',
  'most_birdies_90d',
  'best_stableford_90d',
];

const CATEGORIES_ORDER_ALL_TIME: LegendCategory[] = [
  'lowest_gross_all_time',
  'most_aces_all_time',
  'most_eagles_all_time',
  'most_birdies_all_time',
  'best_stableford_all_time',
];

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
};

const UNITS: Record<LegendCategory, string> = {
  best_score_diff_90d:      'vs hcp',
  best_score_diff_all_time: 'vs hcp',
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
};

const UNIT_LABELS: Record<LegendCategory, string> = {
  best_score_diff_90d:      'vs hcp',
  best_score_diff_all_time: 'vs hcp',
  lowest_gross_90d:         'Gross',
  lowest_gross_all_time:    'Gross',
  most_birdies_90d:         'Birdies',
  most_birdies_all_time:    'Birdies',
  best_stableford_90d:      'Pts',
  best_stableford_all_time: 'Pts',
  most_eagles_90d:          'Eagles',
  most_eagles_all_time:     'Eagles',
  most_aces_90d:            'Aces',
  most_aces_all_time:       'Aces',
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
}

interface Props {
  /** Course context. */
  selection: CourseSelection;
  /** When true, suppresses the DrilldownHeader — for embedded contexts (e.g. Course Detail Legends tab) where the parent already renders a course hero. */
  hideHeader?: boolean;
}

export const CourseLegendsDrilldown: React.FC<Props> = ({ selection, hideHeader = false }) => {
  const ctx = selection;


  const { activeActor } = useActiveActor();
  const { data, isLoading, isError, refetch } = useCourseLegends(ctx.courseId, activeActor?.id);
  const { data: meta } = useCourseMeta(ctx.courseId);
  const [window, setWindow] = useState<LegendWindow>('all_time');
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

  const visibleCategories = window === '90d' ? CATEGORIES_ORDER_90D : CATEGORIES_ORDER_ALL_TIME;

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

  const navCategories = useMemo(
    () =>
      visibleCategories
        .filter((cat) => (groupedWithTotals.get(cat)?.rows.length ?? 0) > 0)
        .map((cat) => ({
          key: cat,
          short: SHORT_LABELS[cat],
          icon: legendCategoryIcon[cat],
          yourRank: yourRanks[cat] ?? null,
        })),
    [groupedWithTotals, yourRanks, visibleCategories],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleNavSelect = (key: LegendCategory) => {
    const el = containerRef.current?.querySelector(`[data-category="${key}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  return (
    <div ref={containerRef}>
      {!hideHeader && (
        <DrilldownHeader
          state={ctx}
          youOwnedCount={youOwnedCount}
          totalCategories={visibleCategories.length}
          courseHeaderImage={courseHeaderImage}
        />
      )}

      {/* In-tab course search — always shown (synced + non-synced). Includes
          a small connect-WHS cue beneath for non-synced users. */}
      <ChampionsCourseSearch currentCourseId={ctx.courseId} />

      <div style={{ padding: '14px 16px 4px', display: 'flex', justifyContent: 'flex-start' }}>
        <WindowToggle window={window} setWindow={handleWindowChange} />
      </div>

      <ConnectHandicapCue variant="champions" courseName={ctx.courseName} />

      {autoSwitchedToAllTime && window === 'all_time' && (
        <div style={{ padding: '0 16px 8px' }}>
          <span style={{ fontFamily: 'Geist, system-ui, sans-serif', fontSize: 11.5, fontWeight: 600, color: 'var(--hcp-t-60, #64748b)', letterSpacing: '-0.005em' }}>
            No rounds in the last 90 days — showing all-time legends.
          </span>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={12} />
          ))}
        </div>
      )}

      {isError && (
        <div style={{ padding: '20px 16px' }}>
          <RetryStub message="Couldn't load Course Legends" onRetry={() => refetch()} />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <ChampionsEmptyState courseName={ctx.courseName} />
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && !activeWindowHasData && (
        <ChampionsWindowEmptyState
          window={window}
          onSwitch={() => handleWindowChange(window === '90d' ? 'all_time' : '90d')}
        />
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && activeWindowHasData && (
        <>
          <ChampionsCoursePulsePanel meta={meta} />

          <ChampionsYourStandingCard
            displayName="You"
            photoUrl={activeActor?.avatarUrl ?? null}
            titlesHeld={youOwnedCount}
            totalCategories={visibleCategories.length}
            bestRank={(() => {
              const ranks = Object.values(yourRanks).filter((r): r is number => r != null);
              return ranks.length === 0 ? null : Math.min(...ranks);
            })()}
            yourRounds={meta?.your_rounds ?? 0}
            yourBest={meta?.your_best ?? null}
          />

          <CategoryNavRail categories={navCategories} onSelect={handleNavSelect} />

          <div>
          {visibleCategories.map((cat) => {
            const entry = groupedWithTotals.get(cat);
            if (!entry || entry.rows.length === 0) return null;
            const champion = entry.rows[0];
            const heldDuration = formatHeldDuration(champion.attained_at);
            const holdDurationDisplay = `Held ${heldDuration}`;

            const isLowerBetter =
              cat === 'best_score_diff_90d' ||
              cat === 'best_score_diff_all_time' ||
              cat === 'lowest_gross_90d' ||
              cat === 'lowest_gross_all_time';

            const formatGap = (rowValue: number): string => {
              const diff = rowValue - champion.value;
              if (isLowerBetter) {
                const v = diff.toFixed(1).replace(/\.0$/, '');
                return diff > 0 ? `+${v}` : v;
              }
              return diff < 0 ? `${diff}` : `+${diff}`;
            };

            const sectionRows = entry.rows.map((r) => ({
              rank: r.rank,
              name: r.isSelf ? 'You' : r.name,
              photoUrl: r.photoUrl,
              valueDisplay: r.valueDisplay,
              isSelf: r.isSelf,
              gapToChampion: r.rank === champion.rank ? null : formatGap(r.value),
              userId: r.userId,
            }));

            return (
              <div key={cat} data-category={cat}>
                <ChampionsCategorySection
                  categoryLabel={legendCategoryLabel[cat]}
                  categoryIcon={legendCategoryIcon[cat]}
                  unitLabel={UNIT_LABELS[cat] || ''}
                  totalCount={entry.total}
                  holdDuration={holdDurationDisplay}
                  rows={sectionRows}
                  onFullLeaderboardTap={() => setFullLeaderboardCategory(cat)}
                />
              </div>
            );
          })}
          </div>
        </>
      )}

      <FullCourseLeaderboardSheet
        open={fullLeaderboardCategory !== null}
        onClose={() => setFullLeaderboardCategory(null)}
        courseName={ctx.courseName}
        groupedRows={groupedWithTotals}
        visibleCategories={sheetCategoryDescriptors}
        initialCategory={fullLeaderboardCategory ?? visibleCategories[0]}
        window={window}
      />
    </div>
  );
};

export default CourseLegendsDrilldown;
