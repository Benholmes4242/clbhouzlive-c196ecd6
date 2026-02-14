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
  | 'most-events'
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
  { value: 'most-events', label: 'Most Events Played', shortLabel: 'Events' },
  { value: 'highest-earnings', label: 'Highest Earnings', shortLabel: 'Earnings' },
];

export function PlayerSortControl({ value, onChange }: PlayerSortControlProps) {
  const activeOption = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5",
            "bg-muted/50 border border-border rounded-full",
            "text-sm font-medium text-foreground",
            "hover:bg-muted active:scale-[0.97] transition-all",
            "outline-none focus:outline-none focus-visible:ring-0"
          )}
        >
          Sort: {activeOption.shortLabel}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-card border border-border shadow-lg z-50"
      >
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex items-center justify-between text-sm cursor-pointer"
          >
            {option.label}
            {value === option.value && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
