
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Search, Bell, Users } from 'lucide-react';

interface TeeTime {
  id: string;
  time: string;
  date: string;
  tournament: string;
  tour: string;
  round: string;
  players: string[];
  tee: string;
}

const mockTeeTimes: TeeTime[] = [
  {
    id: '1',
    time: '8:30 AM',
    date: '2024-03-15',
    tournament: 'The Players Championship',
    tour: 'PGA',
    round: 'Round 2',
    players: ['Scottie Scheffler', 'Jon Rahm', 'Rory McIlroy'],
    tee: '1st',
  },
  {
    id: '2',
    time: '9:00 AM',
    date: '2024-03-15',
    tournament: 'The Players Championship',
    tour: 'PGA',
    round: 'Round 2',
    players: ['Viktor Hovland', 'Xander Schauffele', 'Max Homa'],
    tee: '1st',
  },
  {
    id: '3',
    time: '10:30 AM',
    date: '2024-03-15',
    tournament: 'LIV Golf Singapore',
    tour: 'LIV',
    round: 'Round 1',
    players: ['Bryson DeChambeau', 'Cameron Smith', 'Brooks Koepka'],
    tee: '1st',
  },
  {
    id: '4',
    time: '2:00 PM',
    date: '2024-03-15',
    tournament: 'NCAA Championship',
    tour: 'University',
    round: 'Round 1',
    players: ['Team Stanford', 'Team Duke', 'Team Oklahoma State'],
    tee: '10th',
  },
];

const TeeTimesSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTour, setFilterTour] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState('2024-03-15');

  const getTourColor = (tour: string) => {
    switch (tour) {
      case 'PGA': return 'bg-blue-500';
      case 'LIV': return 'bg-green-500';
      case 'DP World': return 'bg-gray-500';
      case 'University': return 'bg-red-900';
      default: return 'bg-gray-400';
    }
  };

  const filteredTeeTimes = mockTeeTimes.filter(teeTime => {
    const matchesSearch = searchTerm === '' || 
      teeTime.players.some(player => 
        player.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      teeTime.tournament.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTour = filterTour === 'all' || teeTime.tour === filterTour;
    const matchesDate = teeTime.date === selectedDate;
    
    return matchesSearch && matchesTour && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Tee Times</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players or tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTour} onValueChange={setFilterTour}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tours</SelectItem>
              <SelectItem value="PGA">PGA Tour</SelectItem>
              <SelectItem value="LIV">LIV Golf</SelectItem>
              <SelectItem value="DP World">DP World Tour</SelectItem>
              <SelectItem value="University">University</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTeeTimes.map((teeTime) => (
          <Card key={teeTime.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-lg">{teeTime.time}</span>
                    <Badge className={`${getTourColor(teeTime.tour)} text-white`}>
                      {teeTime.tour}
                    </Badge>
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="font-medium">{teeTime.tournament}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teeTime.round} • {teeTime.tee} Tee
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {teeTime.players.map((player, index) => (
                        <span key={index} className="text-sm">
                          {player}{index < teeTime.players.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="ml-4">
                  <Bell className="h-4 w-4 mr-1" />
                  Follow
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTeeTimes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tee times found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeeTimesSection;
