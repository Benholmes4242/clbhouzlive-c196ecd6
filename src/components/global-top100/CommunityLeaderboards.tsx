import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

const leaderboardData = [
  {
    region: 'Global',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    leaders: [
      { name: 'James MacLeod', courses: 87, avatar: null },
      { name: 'Sarah Williams', courses: 82, avatar: null },
      { name: 'Michael Chen', courses: 79, avatar: null }
    ]
  },
  {
    region: 'Great Britain & Ireland',
    icon: Crown,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    leaders: [
      { name: 'Emma Thompson', courses: 45, avatar: null },
      { name: 'David Jones', courses: 42, avatar: null },
      { name: 'Sophie Martin', courses: 38, avatar: null }
    ]
  },
  {
    region: 'Europe',
    icon: Medal,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    leaders: [
      { name: 'Marco Rossi', courses: 34, avatar: null },
      { name: 'Hans Mueller', courses: 31, avatar: null },
      { name: 'Pierre Dubois', courses: 29, avatar: null }
    ]
  },
  {
    region: 'USA',
    icon: Award,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    leaders: [
      { name: 'Robert Johnson', courses: 56, avatar: null },
      { name: 'Lisa Anderson', courses: 52, avatar: null },
      { name: 'Tom Wilson', courses: 48, avatar: null }
    ]
  }
];

const CommunityLeaderboards = () => {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Community Top 100 Leaderboards</h2>
        <p className="text-muted-foreground">See who's leading the quest to play the world's greatest courses</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {leaderboardData.map((board) => {
          const IconComponent = board.icon;
          return (
            <Card key={board.region} className="hover:shadow-lg transition-shadow">
              <CardHeader className={`${board.bgColor} rounded-t-lg`}>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${board.color}`} />
                  <span className="text-lg font-bold">{board.region}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {board.leaders.map((leader, index) => (
                    <div key={leader.name} className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <AvatarSquircle 
                        size="sm"
                        src={leader.avatar || undefined}
                        alt={leader.name}
                        fallback={leader.name.split(' ').map(n => n[0]).join('')}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{leader.name}</p>
                        <p className="text-xs text-muted-foreground">{leader.courses} courses</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground text-center">View full leaderboard →</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default CommunityLeaderboards;