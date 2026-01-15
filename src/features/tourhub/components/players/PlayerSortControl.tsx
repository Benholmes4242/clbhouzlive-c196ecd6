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
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#64748b]">Sort by</span>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-white border-[#e2e8f0] text-[#1e293b] focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#e2e8f0]">
            {sortOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-[#1e293b] focus:bg-[#f8fafc] focus:text-[#1e293b] data-[state=checked]:bg-[#f8fafc] data-[state=checked]:text-[#1e293b]"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value === 'world-rank' && (
        <span className="text-[10px] text-[#94a3b8]">
          Official World Golf Ranking (OWGR)
        </span>
      )}
    </div>
  );
}
