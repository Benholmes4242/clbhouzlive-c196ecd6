
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
          <Button
            key={ranking.id}
            variant={selectedRanking.id === ranking.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRanking(ranking)}
          >
            {getTourButtonText(ranking.tour)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RankingsFilters;
