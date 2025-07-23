
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RankingList } from './types';
import { getTourButtonText } from './utils';

interface RankingsFiltersProps {
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  filteredRankings: RankingList[];
  selectedRanking: RankingList;
  setSelectedRanking: (ranking: RankingList) => void;
}

const RankingsFilters = ({
  categoryFilter,
  setCategoryFilter,
  filteredRankings,
  selectedRanking,
  setSelectedRanking
}: RankingsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="men">Men's Rankings</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex flex-wrap gap-2">
        {filteredRankings.map((ranking) => (
          <button
            key={ranking.id}
            onClick={() => setSelectedRanking(ranking)}
            className={`
              relative px-4 py-2 text-sm font-medium rounded-2xl transition-all duration-200
              backdrop-blur-[20px] border border-white/30
              shadow-[0_4px_30px_rgba(0,0,0,0.1)]
              before:absolute before:inset-0 before:rounded-2xl
              before:bg-gradient-radial before:from-white/10 before:via-transparent before:to-transparent
              before:from-[circle_at_top_left] before:pointer-events-none
              ${selectedRanking.id === ranking.id 
                ? 'bg-white/15 text-foreground border-white/40' 
                : 'bg-white/15 text-muted-foreground hover:bg-white/20 hover:text-foreground'
              }
              dark:bg-black/20 dark:border-white/20 dark:hover:bg-black/30
            `}
          >
            {getTourButtonText(ranking.tour)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RankingsFilters;
