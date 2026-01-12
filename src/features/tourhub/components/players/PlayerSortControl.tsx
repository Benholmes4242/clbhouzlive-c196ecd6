/**
 * PlayerSortControl - Clean pill-style sort dropdown
 * Premium minimal design
 */

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
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'world-rank', label: 'Rank' },
  { value: 'most-active', label: 'Activity' },
  { value: 'newest-pro', label: 'Newest' },
];

export function PlayerSortControl({ value, onChange }: PlayerSortControlProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground/70">Sort</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[100px] h-8 text-xs bg-muted/40 border-0 rounded-full focus:ring-1 focus:ring-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-sm">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
