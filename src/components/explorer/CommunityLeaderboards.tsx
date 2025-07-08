import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Trophy, Earth } from 'lucide-react';
import LeaderboardCard from './leaderboards/LeaderboardCard';

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
      emoji: '',
      topUser: getTopUserForRegion('global')
    },
    {
      region: 'britain-ireland',
      title: 'GB & Ireland',
      emoji: '',
      topUser: getTopUserForRegion('britain-ireland')
    },
    {
      region: 'usa',
      title: 'USA',
      emoji: '',
      topUser: getTopUserForRegion('usa')
    },
    {
      region: 'europe',
      title: 'Continental Europe',
      emoji: '',
      topUser: getTopUserForRegion('europe')
    }
  ];

  const handleViewFullLeaderboard = (region: string) => {
    console.log('View full leaderboard for:', region);
    // TODO: Navigate to full leaderboard page
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Community Top 100 Leaderboards</h2>
            <p className="text-sm text-muted-foreground">Follow the Clbhouz Community Through the World's Top 100 Courses</p>
          </div>
        </div>
        
      </div>

      {/* Responsive Carousel */}
      <div className="relative">
        {/* Desktop: Show 2 cards with arrows */}
        <div className="hidden md:block">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent className="-ml-4">
              {regionalLeaderboards.map((leaderboard) => (
                <CarouselItem key={leaderboard.region} className="pl-4 basis-1/2">
                  <LeaderboardCard
                    title={leaderboard.title}
                    region={leaderboard.region}
                    subtitle="Most Played"
                    users={getMockData(leaderboard.region)}
                    onViewFullLeaderboard={() => handleViewFullLeaderboard(leaderboard.region)}
                    isGlobal={leaderboard.region === 'global'}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
        
        {/* Mobile: Show 1 card with swipe and dots */}
        <div className="md:hidden">
          <SwipeCarousel
            items={regionalLeaderboards.map((leaderboard) => (
              <LeaderboardCard
                key={leaderboard.region}
                title={leaderboard.title}
                region={leaderboard.region}
                subtitle="Most Played"
                users={getMockData(leaderboard.region)}
                onViewFullLeaderboard={() => handleViewFullLeaderboard(leaderboard.region)}
                isGlobal={leaderboard.region === 'global'}
              />
            ))}
            className="w-full"
            showDots={true}
            showArrows={false}
          />
        </div>
      </div>


    </div>
  );
};

export default CommunityLeaderboards;