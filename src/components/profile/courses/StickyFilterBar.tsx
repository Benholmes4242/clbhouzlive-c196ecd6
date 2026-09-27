/**
 * StickyFilterBar - Two primary tabs (All / Top 100) with inline country filter pills and sort dropdown
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CourseRegionPills, type QuickRegion } from '@/components/leaderboard/courses/CourseRegionPills';
import { railChipStyle, RAIL_CHIP_GAP } from '@/components/ui/RailChips';
import { A } from '@/features/courses/components/holes/analytical/tokens';

export type CoursePrimaryTab = 'all' | 'top100';
export type CourseSortOption = 'recently-played' | 'rating-high-low' | 'rating-low-high';

interface StickyFilterBarProps {
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
  { value: 'recently-played', label: 'Recently Played' },
  { value: 'rating-high-low', label: 'Rating: High to Low' },
  { value: 'rating-low-high', label: 'Rating: Low to High' },
];

export const StickyFilterBar: React.FC<StickyFilterBarProps> = ({
  activeTab,
  onTabChange,
  activeSort,
  onSortChange,
  activeCountry,
  onCountryChange,
  allCount,
  top100Count,
}) => {
  const currentSortLabel = SORT_OPTIONS.find(s => s.value === activeSort)?.label || 'Sort';

  const TABS: { key: CoursePrimaryTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allCount },
    { key: 'top100', label: 'Top 100', count: top100Count },
  ];

  return (
    <div className="space-y-3">
      {/* Primary tab row — canonical charcoal chips */}
      <div
        role="tablist"
        aria-label="Course list filter"
        style={{
          display: 'flex',
          gap: RAIL_CHIP_GAP,
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {TABS.map(({ key, label, count }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-pressed={isActive}
              aria-selected={isActive}
              onClick={() => onTabChange(key)}
              style={{ ...railChipStyle(isActive), display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {label}
              {count > 0 && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: A.DIM,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>


      {/* Controls: region pills + sort on a single row */}
      <div className="flex items-center gap-3 pt-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <CourseRegionPills value={activeCountry} onChange={onCountryChange} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-semibold min-h-[34px] whitespace-nowrap shrink-0"
              style={{ background: A.PANEL, border: `0.5px solid ${A.BORDER}`, color: A.INK }}
            >
              {currentSortLabel.replace('Rating: ', '')}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={cn(
                  "text-sm",
                  activeSort === opt.value && "font-semibold"
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
