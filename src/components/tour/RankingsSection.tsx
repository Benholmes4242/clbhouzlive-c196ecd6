
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RankingsFilters from './rankings/RankingsFilters';
import RankingsTable from './rankings/RankingsTable';
import { mockRankings, tourLogos } from './rankings/constants';
import { getTourLogoSize } from './rankings/utils';

const RankingsSection = () => {
  const [selectedRanking, setSelectedRanking] = useState(mockRankings[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('men');

  const filteredRankings = mockRankings.filter(ranking => ranking.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Rankings</h2>
        
        <RankingsFilters
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          filteredRankings={filteredRankings}
          selectedRanking={selectedRanking}
          setSelectedRanking={setSelectedRanking}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <span>{selectedRanking.name}</span>
            </CardTitle>
            <div className={getTourLogoSize(selectedRanking.tour)}>
              <img
                src={tourLogos[selectedRanking.tour]}
                alt={`${selectedRanking.tour} logo`}
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RankingsTable selectedRanking={selectedRanking} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingsSection;

