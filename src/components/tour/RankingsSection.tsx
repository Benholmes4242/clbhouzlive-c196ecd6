
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, GraduationCap } from 'lucide-react';

interface RankingEntry {
  position: number;
  name: string;
  points?: number;
  country: string;
  change: number;
  school?: string;
}

interface RankingList {
  id: string;
  name: string;
  tour: string;
  category: 'men' | 'women';
  rankings: RankingEntry[];
  icon: React.ReactNode;
}

const mockRankings: RankingList[] = [
  {
    id: 'pga-men',
    name: 'PGA Tour Rankings',
    tour: 'PGA',
    category: 'men',
    icon: <Trophy className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'Scottie Scheffler', points: 854, country: 'USA', change: 0 },
      { position: 2, name: 'Jon Rahm', points: 612, country: 'ESP', change: 1 },
      { position: 3, name: 'Rory McIlroy', points: 587, country: 'NIR', change: -1 },
      { position: 4, name: 'Viktor Hovland', points: 523, country: 'NOR', change: 2 },
      { position: 5, name: 'Xander Schauffele', points: 498, country: 'USA', change: 0 },
    ],
  },
  {
    id: 'liv-men',
    name: 'LIV Golf Rankings',
    tour: 'LIV',
    category: 'men',
    icon: <Medal className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'Bryson DeChambeau', points: 342, country: 'USA', change: 1 },
      { position: 2, name: 'Cameron Smith', points: 298, country: 'AUS', change: -1 },
      { position: 3, name: 'Brooks Koepka', points: 276, country: 'USA', change: 0 },
      { position: 4, name: 'Dustin Johnson', points: 254, country: 'USA', change: 1 },
      { position: 5, name: 'Phil Mickelson', points: 231, country: 'USA', change: -1 },
    ],
  },
  {
    id: 'university-men',
    name: 'US University Rankings',
    tour: 'University',
    category: 'men',
    icon: <GraduationCap className="h-5 w-5" />,
    rankings: [
      { position: 1, name: 'John Smith', country: 'USA', change: 0, school: 'Stanford University' },
      { position: 2, name: 'Michael Johnson', country: 'USA', change: 2, school: 'Duke University' },
      { position: 3, name: 'David Wilson', country: 'USA', change: -1, school: 'Oklahoma State' },
      { position: 4, name: 'Robert Davis', country: 'USA', change: 1, school: 'University of Texas' },
      { position: 5, name: 'James Brown', country: 'USA', change: -2, school: 'Auburn University' },
    ],
  },
];

const RankingsSection = () => {
  const [selectedRanking, setSelectedRanking] = useState(mockRankings[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('men');

  const getTourColor = (tour: string) => {
    switch (tour) {
      case 'PGA': return 'bg-blue-500';
      case 'LIV': return 'bg-green-500';
      case 'DP World': return 'bg-gray-500';
      case 'University': return 'bg-red-900';
      default: return 'bg-gray-400';
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-green-600 text-sm">+{change}</span>;
    if (change < 0) return <span className="text-red-600 text-sm">{change}</span>;
    return <span className="text-gray-400 text-sm">-</span>;
  };

  const filteredRankings = mockRankings.filter(ranking => ranking.category === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Rankings</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="men">Men's Rankings</SelectItem>
              <SelectItem value="women">Women's Rankings</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex flex-wrap gap-2">
            {filteredRankings.map((ranking) => (
              <Button
                key={ranking.id}
                variant={selectedRanking.id === ranking.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRanking(ranking)}
                className="flex items-center gap-2"
              >
                {ranking.icon}
                {ranking.tour}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedRanking.icon}
            {selectedRanking.name}
            <Badge className={`${getTourColor(selectedRanking.tour)} text-white`}>
              {selectedRanking.tour}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <TableCell className="text-sm">{entry.school}</TableCell>
                  )}
                  <TableCell className="text-center">{getChangeIndicator(entry.change)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingsSection;
