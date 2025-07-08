import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Earth } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  regionProgress?: {
    'britain-ireland': number;
    'usa': number;
    'europe': number;
    'global': number;
  };
}

interface RegionalLeaderboard {
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  title: string;
  emoji: string;
  topUser: LeaderboardUser;
}

const CommunityLeaderboards = () => {
  const [sortBy, setSortBy] = useState<'courses' | 'rating' | 'posts'>('courses');

  // Get real leaderboard data from database
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['communityLeaderboards'],
    queryFn: async () => {
      // Get all users with their top 100 course progress
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          location
        `)
        .eq('is_public', true)
        .not('username', 'is', null);

      if (profilesError) throw profilesError;

      // For each user, calculate their Top 100 course progress using the same logic as profile pages
      const usersWithProgress = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get courses from user_top100_courses table
          const { data: top100Data } = await supabase
            .from('user_top100_courses')
            .select(`
              course_id,
              golf_courses (
                id,
                name,
                country,
                region,
                continent,
                global_rank,
                regional_rank,
                usa_rank
              )
            `)
            .eq('user_id', profile.id)
            .eq('played', true);

          // Get courses from course_ratings table
          const { data: ratingsData } = await supabase
            .from('course_ratings')
            .select(`
              course_id,
              rating,
              golf_courses (
                id,
                name,
                country,
                region,
                continent,
                global_rank,
                regional_rank,
                usa_rank
              )
            `)
            .eq('user_id', profile.id);

          // Get post count
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          // Combine both datasets and remove duplicates (same logic as useTop100CoursesData)
          const allPlayedCourses = [...(top100Data || []), ...(ratingsData || [])];
          const uniqueCourses = allPlayedCourses.filter((course, index, self) => 
            index === self.findIndex(c => c.course_id === course.course_id)
          );

          // Calculate regional progress using the same logic as the profile page
          const playedCourseIds = new Set(uniqueCourses.map(pc => pc.course_id));
          
          let totalTop100Played = 0;
          const regionProgress = {
            'britain-ireland': 0,
            'usa': 0,
            'europe': 0,
            'global': 0
          };

          // Get all Top 100 courses to properly calculate regional progress
          const { data: allCoursesData } = await supabase
            .from('golf_courses')
            .select('id, continent, country, region, global_rank, regional_rank, usa_rank')
            .or('global_rank.not.is.null,regional_rank.not.is.null');

          if (allCoursesData) {
            allCoursesData.forEach(course => {
              const isPlayed = playedCourseIds.has(course.id);
              
              // Track if this is any kind of Top 100 course
              let isAnyTop100 = false;
              
              // Global category includes all courses with global ranks (1-100)
              if (course.global_rank && course.global_rank <= 100) {
                isAnyTop100 = true;
                if (isPlayed) regionProgress.global++;
              }

              // Regional categories - based on primary country assignment (exact match to useTop100CoursesData)
              if (course.country === 'USA' && course.regional_rank && course.regional_rank <= 100) {
                isAnyTop100 = true;
                if (isPlayed) regionProgress.usa++;
              } else if (course.country === 'Britain & Ireland' && course.regional_rank && course.regional_rank <= 100) {
                isAnyTop100 = true;
                if (isPlayed) regionProgress['britain-ireland']++;
              } else if (course.country === 'Continental Europe' && course.regional_rank && course.regional_rank <= 100) {
                isAnyTop100 = true;
                if (isPlayed) regionProgress.europe++;
              }

            });

            // Use the deduplicated unique courses count for total
            totalTop100Played = uniqueCourses.filter(course => {
              const gc = course.golf_courses;
              return gc && (
                (gc.regional_rank && gc.regional_rank <= 100) ||
                (gc.usa_rank && gc.usa_rank <= 100) ||
                (gc.global_rank && gc.global_rank <= 100)
              );
            }).length;
          }

          // Calculate average rating
          const coursesWithRatings = ratingsData?.filter(c => c.rating) || [];
          const avgRating = coursesWithRatings.length > 0 
            ? coursesWithRatings.reduce((sum, c) => sum + c.rating, 0) / coursesWithRatings.length
            : 0;

          // Determine country/region from location or default
          const getCountryFromLocation = (location: string | null) => {
            if (!location) return 'Unknown';
            const lower = location.toLowerCase();
            if (lower.includes('scotland')) return 'Scotland';
            if (lower.includes('england')) return 'England';
            if (lower.includes('wales')) return 'Wales';
            if (lower.includes('ireland')) return 'Ireland';
            if (lower.includes('usa') || lower.includes('united states') || lower.includes('america')) return 'United States';
            if (lower.includes('france')) return 'France';
            if (lower.includes('spain')) return 'Spain';
            if (lower.includes('germany')) return 'Germany';
            if (lower.includes('italy')) return 'Italy';
            if (lower.includes('sweden')) return 'Sweden';
            if (lower.includes('norway')) return 'Norway';
            if (lower.includes('denmark')) return 'Denmark';
            if (lower.includes('netherlands')) return 'Netherlands';
            return 'Unknown';
          };

          const country = getCountryFromLocation(profile.location);
          const getCountryFlag = (country: string) => {
            const flags: Record<string, string> = {
              'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
              'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
              'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
              'Ireland': '🇮🇪',
              'United States': '🇺🇸',
              'France': '🇫🇷',
              'Spain': '🇪🇸',
              'Germany': '🇩🇪',
              'Italy': '🇮🇹',
              'Sweden': '🇸🇪',
              'Norway': '🇳🇴',
              'Denmark': '🇩🇰',
              'Netherlands': '🇳🇱'
            };
            return flags[country] || '🌍';
          };

          return {
            id: profile.id,
            name: profile.display_name || profile.username || 'Anonymous',
            username: profile.username || '',
            avatar: profile.profile_photo_url,
            country,
            countryFlag: getCountryFlag(country),
            coursesPlayed: totalTop100Played, // Use deduplicated total across all lists
            totalCourses: 100,
            avgRating: Number(avgRating.toFixed(1)),
            mediaUploaded: postCount || 0,
            regionProgress // Store regional breakdown for filtering
          };
        })
      );

      // Filter out users with no Top 100 progress and sort by courses played
      return usersWithProgress
        .filter(user => user.coursesPlayed > 0)
        .sort((a, b) => b.coursesPlayed - a.coursesPlayed)
        .map((user, index) => ({ ...user, globalRank: index + 1 }));
    },
  });

  const getRealDataForRegion = (region: string): LeaderboardUser[] => {
    if (!leaderboardData) return [];

    // For regional leaderboards, sort by that region's specific progress
    if (region === 'global') {
      return leaderboardData.sort((a, b) => b.coursesPlayed - a.coursesPlayed);
    }
    
    // Filter users who have played courses in the specific region and sort by regional progress
    return leaderboardData
      .filter(user => {
        if (!user.regionProgress) return false;
        const regionKey = region === 'britain-ireland' ? 'britain-ireland' : region;
        return user.regionProgress[regionKey] > 0;
      })
      .sort((a, b) => {
        const regionKey = region === 'britain-ireland' ? 'britain-ireland' : region;
        return (b.regionProgress?.[regionKey] || 0) - (a.regionProgress?.[regionKey] || 0);
      })
      .map((user, index) => ({
        ...user,
        coursesPlayed: user.regionProgress?.[region === 'britain-ireland' ? 'britain-ireland' : region] || 0
      }));
  };

  const regionalLeaderboards: RegionalLeaderboard[] = [
    {
      region: 'global',
      title: 'Global',
      emoji: '',
      topUser: getRealDataForRegion('global')[0] || {
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
      }
    },
    {
      region: 'britain-ireland',
      title: 'Britain & Ireland',
      emoji: '',
      topUser: getRealDataForRegion('britain-ireland')[0] || {
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
      }
    },
    {
      region: 'usa',
      title: 'USA',
      emoji: '',
      topUser: getRealDataForRegion('usa')[0] || {
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
      }
    },
    {
      region: 'europe',
      title: 'Continental Europe',
      emoji: '',
      topUser: getRealDataForRegion('europe')[0] || {
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
      }
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
        <div>
          <h2 className="text-2xl font-bold">Community Top 100 Leaderboards</h2>
          <p className="text-sm text-muted-foreground">Follow the clbhouz community through the world's top 100 courses</p>
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
                    users={getRealDataForRegion(leaderboard.region)}
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
                users={getRealDataForRegion(leaderboard.region)}
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