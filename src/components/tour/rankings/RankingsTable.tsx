
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award } from 'lucide-react';
import { RankingList } from './types';
import { universityLogos } from './constants';
import { getChangeIndicator } from './utils';

interface RankingsTableProps {
  selectedRanking: RankingList;
}

const RankingsTable = ({ selectedRanking }: RankingsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Player</TableHead>
          {selectedRanking.tour !== 'University' && (
            <TableHead className="text-center">Points</TableHead>
          )}
          {selectedRanking.tour === 'University' && (
            <TableHead>School</TableHead>
          )}
          <TableHead className="text-center">Change</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {selectedRanking.rankings.map((entry) => (
          <TableRow key={entry.position}>
            <TableCell className="font-medium">
              {entry.position === 1 && <Trophy className="h-4 w-4 text-yellow-600 inline mr-1" />}
              {entry.position === 2 && <Medal className="h-4 w-4 text-gray-400 inline mr-1" />}
              {entry.position === 3 && <Award className="h-4 w-4 text-orange-600 inline mr-1" />}
              {entry.position}
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{entry.name}</div>
                <div className="text-sm text-muted-foreground">{entry.country}</div>
              </div>
            </TableCell>
            {selectedRanking.tour !== 'University' && entry.points && (
              <TableCell className="text-center font-medium">{entry.points}</TableCell>
            )}
            {selectedRanking.tour === 'University' && entry.school && (
              <TableCell>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white border-2 border-gray-200 flex-shrink-0">
                    <img
                      src={universityLogos[entry.school]}
                      alt={`${entry.school} logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-sm">{entry.school}</span>
                </div>
              </TableCell>
            )}
            <TableCell className="text-center">{getChangeIndicator(entry.change)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RankingsTable;
