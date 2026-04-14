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

  return (
    <div className="space-y-3">
      {/* Primary tab row */}
      <div className="flex" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        <button
          onClick={() => onTabChange('all')}
          className={cn(
            "flex-1 pb-2 text-sm transition-colors duration-150 min-h-[44px]",
            activeTab === 'all'
              ? "text-foreground font-semibold border-b-2 border-[#F7931E]"
              : "text-muted-foreground font-medium border-b-2 border-transparent"
          )}
        >
          All
          {allCount > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{allCount}</span>
          )}
        </button>
        <button
          onClick={() => onTabChange('top100')}
          className={cn(
            "flex-1 pb-2 text-sm transition-colors duration-150 min-h-[44px]",
            activeTab === 'top100'
              ? "text-foreground font-semibold border-b-2 border-[#F7931E]"
              : "text-muted-foreground font-medium border-b-2 border-transparent"
          )}
        >
          Top 100
          {top100Count > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">{top100Count}</span>
          )}
        </button>
      </div>

      {/* Controls: country pills + sort dropdown */}
      <div className="space-y-2 pt-2">
        <CourseRegionPills value={activeCountry} onChange={onCountryChange} />
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium min-h-[36px] whitespace-nowrap shrink-0"
                style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)', color: '#0F172A' }}
              >
                {currentSortLabel}
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
    </div>
  );
};
