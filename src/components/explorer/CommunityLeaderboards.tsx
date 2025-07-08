import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import { Trophy, Crown, Medal, Award, Eye, Users } from 'lucide-react';

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
  globalRank?: number;
}

interface RegionalLeaderboard {
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  title: string;
  emoji: string;
  topUser: LeaderboardUser;
}

const CommunityLeaderboards = () => {
  const [sortBy, setSortBy] = useState<'courses' | 'rating' | 'posts'>('courses');

  // Mock data for all regions
  const getMockData = (region: string): LeaderboardUser[] => {
    const allUsers = [
      { id: '1', name: 'James MacLeod', username: 'jamesmac_golf', avatar: null, country: 'Scotland', countryFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', coursesPlayed: 67, totalCourses: 100, avgRating: 9.2, mediaUploaded: 84, globalRank: 1 },
      { id: '2', name: 'Sarah Williams', username: 'sarahgolf', avatar: null, country: 'England', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', coursesPlayed: 52, totalCourses: 100, avgRating: 8.9, mediaUploaded: 71, globalRank: 2 },
      { id: '3', name: 'Michael Johnson', username: 'mikej_golf', avatar: null, country: 'United States', countryFlag: '🇺🇸', coursesPlayed: 48, totalCourses: 100, avgRating: 9.1, mediaUploaded: 65, globalRank: 3 },
      { id: '4', name: 'Emma Thompson', username: 'emmagolf', avatar: null, country: 'Ireland', countryFlag: '🇮🇪', coursesPlayed: 41, totalCourses: 100, avgRating: 8.7, mediaUploaded: 58, globalRank: 4 },
      { id: '5', name: 'David Chen', username: 'davidgolf', avatar: null, country: 'United States', countryFlag: '🇺🇸', coursesPlayed: 39, totalCourses: 100, avgRating: 9.0, mediaUploaded: 52, globalRank: 5 },
      { id: '6', name: 'Sophie Martin', username: 'sophiegolf', avatar: null, country: 'France', countryFlag: '🇫🇷', coursesPlayed: 35, totalCourses: 100, avgRating: 8.8, mediaUploaded: 47, globalRank: 6 },
      { id: '7', name: 'Thomas Anderson', username: 'tomgolf', avatar: null, country: 'Sweden', countryFlag: '🇸🇪', coursesPlayed: 33, totalCourses: 100, avgRating: 9.3, mediaUploaded: 44, globalRank: 7 },
      { id: '8', name: 'Isabella Rodriguez', username: 'isagolf', avatar: null, country: 'Spain', countryFlag: '🇪🇸', coursesPlayed: 31, totalCourses: 100, avgRating: 8.6, mediaUploaded: 41, globalRank: 8 },
      { id: '9', name: 'Robert Murphy', username: 'robgolf', avatar: null, country: 'Ireland', countryFlag: '🇮🇪', coursesPlayed: 29, totalCourses: 100, avgRating: 8.9, mediaUploaded: 38, globalRank: 9 },
      { id: '10', name: 'Lisa Kim', username: 'lisakim', avatar: null, country: 'United States', countryFlag: '🇺🇸', coursesPlayed: 27, totalCourses: 100, avgRating: 9.2, mediaUploaded: 35, globalRank: 10 }
    ];

    const regionFilters = {
      'global': allUsers,
      'britain-ireland': allUsers.filter(u => ['Scotland', 'England', 'Wales', 'Ireland', 'Northern Ireland'].includes(u.country)),
      'usa': allUsers.filter(u => u.country === 'United States'),
      'europe': allUsers.filter(u => ['France', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark'].includes(u.country))
    };

    return regionFilters[region as keyof typeof regionFilters] || [];
  };

  const getTopUserForRegion = (region: RegionalLeaderboard['region']): LeaderboardUser => {
    const users = getMockData(region);
    return users[0] || {
      id: 'default',
      name: 'No Data',
      username: 'nodata',
      avatar: null,
      country: 'Unknown',
      countryFlag: '🌍',
      coursesPlayed: 0,
      totalCourses: 100,
      avgRating: 0,
      mediaUploaded: 0,
      globalRank: 999
    };
  };

  const regionalLeaderboards: RegionalLeaderboard[] = [
    {
      region: 'global',
      title: 'Global',
      emoji: '🌍',
      topUser: getTopUserForRegion('global')
    },
    {
      region: 'britain-ireland',
      title: 'GB & Ireland',
      emoji: '🇬🇧',
      topUser: getTopUserForRegion('britain-ireland')
    },
    {
      region: 'usa',
      title: 'USA',
      emoji: '🇺🇸',
      topUser: getTopUserForRegion('usa')
    },
    {
      region: 'europe',
      title: 'Europe',
      emoji: '🇪🇺',
      topUser: getTopUserForRegion('europe')
    }
  ];

  const getBadgeForProgress = (coursesPlayed: number) => {
    if (coursesPlayed >= 100) return { emoji: '💯', text: '100 Club', color: 'bg-yellow-500' };
    if (coursesPlayed >= 75) return { emoji: '🥇', text: '75 Club', color: 'bg-yellow-400' };
    if (coursesPlayed >= 50) return { emoji: '🥈', text: '50 Club', color: 'bg-gray-400' };
    if (coursesPlayed >= 25) return { emoji: '🏅', text: '25 Club', color: 'bg-amber-600' };
    return null;
  };

  const renderLeaderboardCard = (leaderboard: RegionalLeaderboard) => {
    const user = leaderboard.topUser;
    const badge = getBadgeForProgress(user.coursesPlayed);
    const progressPercentage = (user.coursesPlayed / user.totalCourses) * 100;

    return (
      <Card key={leaderboard.region} className="min-w-0 h-[320px] bg-gradient-to-br from-card to-card/80 border-2 hover:border-primary/20 transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{leaderboard.emoji}</span>
              {leaderboard.title}
            </CardTitle>
            {user.globalRank && user.globalRank <= 3 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                #{user.globalRank}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Top User Section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-lg font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {user.globalRank === 1 && (
                <Crown className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold truncate text-lg">{user.name}</h4>
                <span className="text-lg">{user.countryFlag}</span>
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {badge && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {badge.emoji} {badge.text}
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{user.coursesPlayed} / {user.totalCourses} courses</span>
              <span className="text-muted-foreground">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-lg font-bold">⭐ {user.avgRating.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{user.mediaUploaded}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Eye className="h-3 w-3 mr-1" />
              View Profile
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs">
              <Users className="h-3 w-3 mr-1" />
              Follow
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const sortOptions = [
    { value: 'courses', label: '🏌️‍♂️ Most Courses', icon: Trophy },
    { value: 'rating', label: '⭐ Highest Rated', icon: Medal },
    { value: 'posts', label: '📸 Most Posts', icon: Award }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Community Top 100 Leaderboards</h2>
            <p className="text-sm text-muted-foreground">Leading players in the Top 100 challenge</p>
          </div>
        </div>
        
        {/* Sort Pills */}
        <div className="hidden md:flex gap-2">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={sortBy === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(option.value as any)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Responsive Carousel */}
      <div className="relative">
        {/* Desktop: Show all 4 cards */}
        <div className="hidden xl:grid xl:grid-cols-4 gap-4">
          {regionalLeaderboards.map(renderLeaderboardCard)}
        </div>
        
        {/* Tablet: Show 2 cards with swipe */}
        <div className="hidden md:block xl:hidden">
          <SwipeCarousel
            items={[
              <div key="page1" className="grid grid-cols-2 gap-4">
                {regionalLeaderboards.slice(0, 2).map(renderLeaderboardCard)}
              </div>,
              <div key="page2" className="grid grid-cols-2 gap-4">
                {regionalLeaderboards.slice(2, 4).map(renderLeaderboardCard)}
              </div>
            ]}
            className="w-full"
            showDots={true}
            showArrows={false}
          />
        </div>
        
        {/* Mobile: Show 1 card with swipe */}
        <div className="md:hidden">
          <SwipeCarousel
            items={regionalLeaderboards.map(renderLeaderboardCard)}
            className="w-full"
            showDots={true}
            showArrows={false}
          />
        </div>
      </div>

      {/* Mobile Sort Options */}
      <div className="md:hidden flex gap-2 justify-center">
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            variant={sortBy === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(option.value as any)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* View All CTA */}
      <div className="text-center">
        <Button variant="outline" className="min-w-48">
          View Full Leaderboard
        </Button>
      </div>
    </div>
  );
};

export default CommunityLeaderboards;