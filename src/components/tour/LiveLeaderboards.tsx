
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getTourLogoSize } from './rankings/utils';
import { MOCK_TOURNAMENTS, type Tournament, type LeaderboardEntry } from './mockData';

// Tour logo mapping
const tourLogos: Record<string, string> = {
  'PGA': '/lovable-uploads/40d74a79-f402-4d98-af1d-242a35f993b4.png',
  'LIV': '/lovable-uploads/09ec2e18-35f5-46cb-81a5-9862fe118274.png',
  'DP World': '/lovable-uploads/62b4549e-fa2b-468b-9d6b-680542b8344d.png',
  'University': '/lovable-uploads/6272d8e2-c43e-49e6-ae7b-667db411c2f8.png',
};

const LiveLeaderboards = () => {
  const [selectedTournament, setSelectedTournament] = useState(MOCK_TOURNAMENTS[0]);

  const getTourColor = (tour: string) => {
    switch (tour) {
      case 'PGA': return 'bg-blue-500';
      case 'LIV': return 'bg-green-500';
      case 'DP World': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between min-h-[4rem]">
        <h2 className="text-xl font-semibold">Live Leaderboards</h2>
        <div className="flex gap-2">
          {MOCK_TOURNAMENTS.map((tournament) => (
            <Button
              key={tournament.id}
              variant={selectedTournament.id === tournament.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTournament(tournament)}
            >
              {tournament.name}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="h-24 flex flex-col justify-center py-4">
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 pr-4 min-h-0">
              <CardTitle className="flex items-center gap-4 mb-1">
                <span>{selectedTournament.name}</span>
                {selectedTournament.status === 'live' && (
                  <Badge variant="destructive" className="animate-pulse">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedTournament.round}
                {selectedTournament.cutLine && ` • Cut Line: ${selectedTournament.cutLine}`}
              </p>
            </div>
            <div className={`flex items-center justify-end ${getTourLogoSize(selectedTournament.tour)}`}>
              <img
                src={tourLogos[selectedTournament.tour]}
                alt={`${selectedTournament.tour} logo`}
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Pos</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Today</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedTournament.leaderboard.map((entry) => (
                <TableRow key={entry.position}>
                  <TableCell className="font-medium">
                    {entry.position}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{entry.player}</div>
                      <div className="text-sm text-muted-foreground">{entry.country}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">{entry.score}</TableCell>
                  <TableCell className="text-center">{entry.today}</TableCell>
                  <TableCell>{getChangeIcon(entry.change)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveLeaderboards;
