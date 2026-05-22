import React, { useMemo, useRef } from 'react';
import { Crown } from 'lucide-react';
import { useCourseLegends } from '@/hooks/gam/useCourseLegends';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { Skeleton, EmptyStub, RetryStub } from '../../../gam/_shared/GamAtoms';
import {
  legendCategoryLabel,
  legendCategoryIcon,
  formatLegendValue,
} from '@/lib/gam/visuals';
import type { LegendCategory } from '@/lib/gam/types';
import type { CourseSelection } from './types';

import { DrilldownHeader } from './drilldown/DrilldownHeader';
import { CourseMetaStrip } from './drilldown/CourseMetaStrip';
import { CategoryNavRail } from './drilldown/CategoryNavRail';
import { CategorySection } from './drilldown/CategorySection';

const AMBER = '#F7931E';

const CATEGORIES_ORDER: LegendCategory[] = [
  'best_score_diff_90d',      'best_score_diff_all_time',
  'lowest_gross_90d',         'lowest_gross_all_time',
  'most_birdies_90d',         'most_birdies_all_time',
  'best_stableford_90d',      'best_stableford_all_time',
  'most_rounds_90d',          'most_rounds_all_time',
  'most_eagles_90d',          'most_eagles_all_time',
  'most_aces_90d',            'most_aces_all_time',
];

const SHORT_LABELS: Record<LegendCategory, string> = {
  best_score_diff_90d:      'Score',
  best_score_diff_all_time: 'Score',
  lowest_gross_90d:         'Gross',
  lowest_gross_all_time:    'Gross',
  most_birdies_90d:         'Birdie',
  most_birdies_all_time:    'Birdie',
  best_stableford_90d:      'Stbl',
  best_stableford_all_time: 'Stbl',
  most_rounds_90d:          'Visitor',
  most_rounds_all_time:     'Visitor',
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
  most_rounds_90d:          '',
  most_rounds_all_time:     '',
  most_eagles_90d:          '',
  most_eagles_all_time:     '',
  most_aces_90d:            '',
  most_aces_all_time:       '',
};

interface SectionRow {
  rank: number;
  name: string;
  photoUrl: string | null;
  value: number;
  valueDisplay: string;
  attained_at: string;
  isSelf: boolean;
}

interface Props {
  state: CourseSelection;
  onBack: () => void;
}

export const CourseLegendsDrilldown: React.FC<Props> = ({ state, onBack }) => {
  const { data, isLoading, isError, refetch } = useCourseLegends(state.courseId);
  const { data: meta } = useCourseMeta(state.courseId);

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
        valueDisplay: formatLegendValue(cat, row.value),
        attained_at: row.attained_at,
        isSelf: row.is_self,
      });
      entry.total = row.total_count_in_category ?? entry.rows.length;
      m.set(cat, entry);
    });
    return m;
  }, [data]);

  const yourRanks = useMemo(() => {
    const r: Partial<Record<LegendCategory, number | null>> = {};
    CATEGORIES_ORDER.forEach((cat) => {
      const entry = groupedWithTotals.get(cat);
      const self = entry?.rows.find((row) => row.isSelf);
      r[cat] = self?.rank ?? null;
    });
    return r;
  }, [groupedWithTotals]);

  const youOwnedCount = Object.values(yourRanks).filter((r) => r === 1).length;

  const navCategories = useMemo(
    () =>
      CATEGORIES_ORDER.filter(
        (cat) => (groupedWithTotals.get(cat)?.rows.length ?? 0) > 0,
      ).map((cat) => ({
        key: cat,
        short: SHORT_LABELS[cat],
        icon: legendCategoryIcon[cat],
        yourRank: yourRanks[cat] ?? null,
      })),
    [groupedWithTotals, yourRanks],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const handleNavSelect = (key: LegendCategory) => {
    const el = containerRef.current?.querySelector(`[data-category="${key}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={containerRef}>
      <DrilldownHeader state={state} onBack={onBack} youOwnedCount={youOwnedCount} />

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
        <div style={{ padding: '20px 16px' }}>
          <EmptyStub
            icon={<Crown size={48} color={AMBER} style={{ opacity: 0.5 }} />}
            title="No legends yet"
            body="Once anyone posts a round here, the leaderboards spin up."
          />
        </div>
      )}

      {!isLoading && !isError && (data ?? []).length > 0 && (
        <>
          <CourseMetaStrip meta={meta} />
          <CategoryNavRail categories={navCategories} onSelect={handleNavSelect} />
          <div
            style={{
              padding: '20px 16px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
            }}
          >
            {CATEGORIES_ORDER.map((cat) => {
              const entry = groupedWithTotals.get(cat);
              if (!entry || entry.rows.length === 0) return null;
              return (
                <div key={cat} data-category={cat}>
                  <CategorySection
                    categoryLabel={legendCategoryLabel[cat]}
                    categoryIcon={legendCategoryIcon[cat]}
                    unit={UNITS[cat]}
                    rows={entry.rows}
                    totalCount={entry.total}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseLegendsDrilldown;
