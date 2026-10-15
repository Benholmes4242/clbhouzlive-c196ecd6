/**
 * FilterBar - Two primary tabs (All / Top 100), country filter pills and a sort chip row
 */
import React from 'react';
import { CourseRegionPills, type QuickRegion } from '@/components/leaderboard/courses/CourseRegionPills';
import { RailChips } from '@/components/ui/RailChips';
import { A } from '@/features/courses/components/holes/analytical/tokens';

export type CoursePrimaryTab = 'all' | 'top100';
export type CourseSortOption = 'recently-played' | 'rating-high-low' | 'rating-low-high';

interface FilterBarProps {
  activeTab: CoursePrimaryTab;
  onTabChange: (tab: CoursePrimaryTab) => void;
  activeSort: CourseSortOption;
  onSortChange: (sort: CourseSortOption) => void;
  activeCountry: QuickRegion;
  onCountryChange: (country: QuickRegion) => void;
  allCount: number;
  top100Count: number;
}

const SORT_OPTIONS: { value: CourseSortOption; label: string }[] = [
  { value: 'recently-played', label: 'Recent' },
  { value: 'rating-high-low', label: 'Highest rated' },
  { value: 'rating-low-high', label: 'Lowest rated' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  onTabChange,
  activeSort,
  onSortChange,
  activeCountry,
  onCountryChange,
  allCount,
  top100Count,
}) => {

  const TABS: { key: CoursePrimaryTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'top100', label: 'Top 100', count: top100Count },
  ];

  return (
    <div className="space-y-3">
      {/* Primary tab row — canonical charcoal chips */}
      <RailChips
        ariaLabel="Course list filter"
        align="center-when-fit"
        options={TABS.map(({ key, label, count }) => ({ id: key, label, value: count }))}
        value={activeTab}
        onChange={(next) => onTabChange(next as CoursePrimaryTab)}
      />


      {/* Region pills */}
      <div className="flex items-center gap-3 pt-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <CourseRegionPills value={activeCountry} onChange={onCountryChange} />
        </div>
      </div>

      {/* Sort chips — only the three sorts that exist. */}
      <div role="radiogroup" aria-label="Sort courses" style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {SORT_OPTIONS.map((opt) => {
          const on = activeSort === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={on}
              data-testid="sort-chip"
              onClick={() => onSortChange(opt.value)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: 9,
                border: `1px solid ${on ? A.INK : 'rgba(255,255,255,0.09)'}`,
                background: on ? A.INK : 'transparent',
                color: on ? A.CANVAS : A.DIM,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
