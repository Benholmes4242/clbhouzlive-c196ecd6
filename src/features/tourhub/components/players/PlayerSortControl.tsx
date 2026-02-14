/**
 * PlayerSortControl - Compact pill-style sort dropdown
 */

import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type PlayerSortType =
  | 'world-rank-desc'
  | 'world-rank-asc'
  | 'alpha-az'
  | 'alpha-za'
  | 'most-wins'
  | 'highest-earnings';

interface PlayerSortControlProps {
  value: PlayerSortType;
  onChange: (value: PlayerSortType) => void;
}

const SORT_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'world-rank-desc', label: 'Highest World Ranking', shortLabel: 'World Ranking' },
  { value: 'world-rank-asc', label: 'Lowest World Ranking', shortLabel: 'Rank (Low)' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'highest-earnings', label: 'Highest Earnings', shortLabel: 'Earnings' },
];

export function PlayerSortControl({ value, onChange }: PlayerSortControlProps) {
  const activeOption = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 h-11 px-4",
            "bg-card border border-border rounded-xl",
            "text-sm font-medium text-foreground",
            "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
            "hover:bg-muted active:scale-[0.98] transition-all duration-150",
            "outline-none focus:outline-none focus-visible:ring-0"
          )}
        >
          {activeOption.shortLabel}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-card border border-border rounded-xl shadow-lg z-50 p-1"
      >
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center justify-between text-sm cursor-pointer rounded-lg px-3 py-2.5",
              value === option.value && "font-medium bg-accent text-accent-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              {value === option.value && (
                <Check className="w-4 h-4 text-foreground" />
              )}
              {value !== option.value && <span className="w-4" />}
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
