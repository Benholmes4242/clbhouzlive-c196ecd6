/**
 * PlayerSortControl - Sort dropdown for player list
 * Clean, minimal design matching editorial feel
 */

import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PlayerSortType = 'alphabetical' | 'world-rank' | 'most-active' | 'newest-pro';

interface PlayerSortControlProps {
  value: PlayerSortType;
  onChange: (value: PlayerSortType) => void;
}

const sortOptions: { value: PlayerSortType; label: string }[] = [
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'world-rank', label: 'World Rank' },
  { value: 'most-active', label: 'Most Active' },
  { value: 'newest-pro', label: 'Turned Pro (Newest)' },
];

export function PlayerSortControl({ value, onChange }: PlayerSortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px] h-8 text-sm bg-background/80 border-border/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
