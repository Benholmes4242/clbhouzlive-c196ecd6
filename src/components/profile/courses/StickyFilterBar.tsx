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
      {/* Primary tab row — dark INK underline (matches course detail media tabs) */}
      <div
        role="tablist"
        aria-label="Course list filter"
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {TABS.map(({ key, label, count }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(key)}
              style={{
                flex: '0 0 auto',
                height: 44,
                padding: '0 8px',
                borderRadius: 0,
                border: 'none',
                background: 'transparent',
                color: isActive ? '#0F172A' : '#94A3B8',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  paddingBottom: 4,
                  borderBottom: isActive ? '1.5px solid #0F172A' : '1.5px solid transparent',
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                    {count}
                  </span>
                )}
              </span>
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
              style={{ background: 'rgba(15,23,42,0.04)', border: '0.5px solid rgba(15,23,42,0.08)', color: '#0F172A' }}
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
