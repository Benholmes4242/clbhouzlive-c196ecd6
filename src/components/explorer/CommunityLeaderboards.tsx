import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  country: string;
  countryFlag: string;
  coursesPlayed: number;
  totalCourses: number;
  avgRating: number;
  mediaUploaded: number;
}

const CommunityLeaderboards = () => {
  const [selectedRegion, setSelectedRegion] = useState<'global' | 'britain-ireland' | 'usa' | 'europe'>('global');

  const { data: leaderboardData = [] } = useQuery({
    queryKey: ['communityLeaderboards', selectedRegion],
    queryFn: async () => {
      // Mock data - in real implementation, this would query the database
      const mockUsers: LeaderboardUser[] = [
        {
          id: '1',
          name: 'James MacLeod',
          username: 'jamesmac_golf',
          avatar: null,
          country: 'Scotland',
          countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
          coursesPlayed: 67,
          totalCourses: 100,
          avgRating: 9.2,
          mediaUploaded: 84
        },
        {
          id: '2',
          name: 'Sarah Williams',
          username: 'sarahgolf',
          avatar: null,
          country: 'England',
          countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          coursesPlayed: 52,
          totalCourses: 100,
          avgRating: 8.9,
          mediaUploaded: 71
        },
        {
          id: '3',
          name: 'Michael Johnson',
          username: 'mikej_golf',
          avatar: null,
          country: 'United States',
          countryFlag: '🇺🇸',
          coursesPlayed: 48,
          totalCourses: 100,
          avgRating: 9.1,
          mediaUploaded: 65
        },
        {
          id: '4',
          name: 'Emma Thompson',
          username: 'emmagolf',
          avatar: null,
          country: 'Ireland',
          countryFlag: '🇮🇪',
          coursesPlayed: 41,
          totalCourses: 100,
          avgRating: 8.7,
          mediaUploaded: 58
        },
        {
          id: '5',
          name: 'David Chen',
          username: 'davidgolf',
          avatar: null,
          country: 'United States',
          countryFlag: '🇺🇸',
          coursesPlayed: 39,
          totalCourses: 100,
          avgRating: 9.0,
          mediaUploaded: 52
        },
        {
          id: '6',
          name: 'Sophie Martin',
          username: 'sophiegolf',
          avatar: null,
          country: 'France',
          countryFlag: '🇫🇷',
          coursesPlayed: 35,
          totalCourses: 100,
          avgRating: 8.8,
          mediaUploaded: 47
        },
        {
          id: '7',
          name: 'Thomas Anderson',
          username: 'tomgolf',
          avatar: null,
          country: 'Sweden',
          countryFlag: '🇸🇪',
          coursesPlayed: 33,
          totalCourses: 100,
          avgRating: 9.3,
          mediaUploaded: 44
        },
        {
          id: '8',
          name: 'Isabella Rodriguez',
          username: 'isagolf',
          avatar: null,
          country: 'Spain',
          countryFlag: '🇪🇸',
          coursesPlayed: 31,
          totalCourses: 100,
          avgRating: 8.6,
          mediaUploaded: 41
        },
        {
          id: '9',
          name: 'Robert Murphy',
          username: 'robgolf',
          avatar: null,
          country: 'Ireland',
          countryFlag: '🇮🇪',
          coursesPlayed: 29,
          totalCourses: 100,
          avgRating: 8.9,
          mediaUploaded: 38
        },
        {
          id: '10',
          name: 'Lisa Kim',
          username: 'lisakim',
          avatar: null,
          country: 'United States',
          countryFlag: '🇺🇸',
          coursesPlayed: 27,
          totalCourses: 100,
          avgRating: 9.2,
          mediaUploaded: 35
        }
      ];

      // Filter by region if not global
      if (selectedRegion !== 'global') {
        const regionCountries = {
          'britain-ireland': ['Scotland', 'England', 'Wales', 'Ireland', 'Northern Ireland'],
          'usa': ['United States'],
          'europe': ['France', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark']
        };
        
        return mockUsers.filter(user => 
          regionCountries[selectedRegion]?.includes(user.country)
        ).slice(0, 10);
      }

      return mockUsers;
    },
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">{index + 1}</span>
          </div>
        );
    }
  };

  const getBadgeForProgress = (coursesPlayed: number) => {
    if (coursesPlayed >= 100) return { emoji: '💯', text: '100 Club', color: 'bg-yellow-500' };
    if (coursesPlayed >= 75) return { emoji: '🥇', text: '75 Club', color: 'bg-yellow-400' };
    if (coursesPlayed >= 50) return { emoji: '🥈', text: '50 Club', color: 'bg-gray-400' };
    if (coursesPlayed >= 25) return { emoji: '🏅', text: '25 Club', color: 'bg-amber-600' };
    return null;
  };

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Community Top 100 Leaderboards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="global" className="flex items-center gap-2">
              🌍 Global
            </TabsTrigger>
            <TabsTrigger value="britain-ireland" className="flex items-center gap-2">
              🇬🇧 Britain & Ireland
            </TabsTrigger>
            <TabsTrigger value="usa" className="flex items-center gap-2">
              🇺🇸 USA
            </TabsTrigger>
            <TabsTrigger value="europe" className="flex items-center gap-2">
              🇪🇺 Europe
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedRegion} className="mt-6">
            <div className="space-y-4">
              {leaderboardData.map((user, index) => {
                const badge = getBadgeForProgress(user.coursesPlayed);
                const progressPercentage = (user.coursesPlayed / user.totalCourses) * 100;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                      index < 3 ? 'ring-1 ring-primary/20' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info & Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{user.name}</h4>
                        <span className="text-xl">{user.countryFlag}</span>
                        {badge && (
                          <Badge variant="secondary" className="text-xs">
                            {badge.emoji} {badge.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">@{user.username}</p>
                      
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{user.coursesPlayed} / {user.totalCourses} courses</span>
                          <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-sm font-medium">⭐ {user.avgRating.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">{user.mediaUploaded} posts</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <Button variant="outline">
                View Full Leaderboard
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CommunityLeaderboards;