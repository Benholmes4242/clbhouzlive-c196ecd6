/**
 * PlayerSortControl - Compact pill-style sort dropdown
 * Aligned with Tour Overview audit specs.
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
  | 'highest-earnings'
  | 'race-to-dubai'
  | 'race-to-cme'
  | 'points-list'
  | 'liv-standings';

interface PlayerSortControlProps {
  value: PlayerSortType;
  onChange: (value: PlayerSortType) => void;
  activeTour?: string;
}

/** Per-tour default sort mapping */
export function getDefaultSortForTour(tour: string): PlayerSortType {
  switch (tour) {
    case 'all': return 'world-rank-desc';
    case 'EURO': return 'race-to-dubai';
    case 'LPGA': return 'race-to-cme';
    case 'PGAD': return 'points-list';
    case 'LIV': return 'liv-standings';
    default: return 'highest-earnings';
  }
}

const ALL_TOURS_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'world-rank-desc', label: 'Highest World Ranking', shortLabel: 'World Ranking' },
  { value: 'highest-earnings', label: 'Highest Earnings', shortLabel: 'Earnings' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
];

const TOUR_SPECIFIC_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'highest-earnings', label: 'Money List', shortLabel: 'Money List' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
];

const EURO_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'race-to-dubai', label: 'Race to Dubai', shortLabel: 'Race to Dubai' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
];

const LPGA_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'race-to-cme', label: 'Race to CME Globe', shortLabel: 'CME Globe' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
];

const PGAD_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'points-list', label: 'Points List', shortLabel: 'Points List' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
];

const LIV_OPTIONS: { value: PlayerSortType; label: string; shortLabel: string }[] = [
  { value: 'liv-standings', label: 'Standings', shortLabel: 'Standings' },
  { value: 'most-wins', label: 'Most Wins', shortLabel: 'Wins' },
  { value: 'alpha-az', label: 'Alphabetical A-Z', shortLabel: 'A-Z' },
  { value: 'alpha-za', label: 'Alphabetical Z-A', shortLabel: 'Z-A' },
];

export function PlayerSortControl({ value, onChange, activeTour = 'all' }: PlayerSortControlProps) {
  const isTourSpecific = activeTour !== 'all';
  const isEuro = activeTour === 'EURO';
  const isLPGA = activeTour === 'LPGA';
  const isPGAD = activeTour === 'PGAD';
  const isLIV = activeTour === 'LIV';
  const SORT_OPTIONS = isLIV ? LIV_OPTIONS : (isPGAD ? PGAD_OPTIONS : (isLPGA ? LPGA_OPTIONS : (isEuro ? EURO_OPTIONS : (isTourSpecific ? TOUR_SPECIFIC_OPTIONS : ALL_TOURS_OPTIONS))));
  const activeOption = SORT_OPTIONS.find(o => o.value === value) || SORT_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2",
            "bg-card border border-border/60 rounded-xl",
            "text-[13px] font-medium text-foreground",
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
