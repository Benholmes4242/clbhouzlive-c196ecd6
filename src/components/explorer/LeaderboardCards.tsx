
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Crown } from 'lucide-react';

const LeaderboardCards = () => {
  const { data: topContributors = [] } = useQuery({
    queryKey: ['topContributors'],
    queryFn: async () => {
      // Mock data for now - in real implementation, this would query posts from Top 100 courses
      return [
        { id: '1', name: 'Alex Thompson', username: 'alexgolf', avatar: null, posts: 24 },
        { id: '2', name: 'Sarah Wilson', username: 'sarahlinks', avatar: null, posts: 18 },
        { id: '3', name: 'Mike Johnson', username: 'mikej_golf', avatar: null, posts: 15 },
        { id: '4', name: 'Emma Davis', username: 'emmagolf', avatar: null, posts: 12 },
        { id: '5', name: 'Chris Lee', username: 'chrislee', avatar: null, posts: 10 },
      ];
    },
  });

  const { data: trendingCourses = [] } = useQuery({
    queryKey: ['trendingCourses'],
    queryFn: async () => {
      // Mock data for now - in real implementation, this would query most active courses
      return [
        { id: '1', name: 'St. Andrews Old Course', country: 'Scotland', plays: 42 },
        { id: '2', name: 'Pebble Beach Golf Links', country: 'United States', plays: 38 },
        { id: '3', name: 'Augusta National Golf Club', country: 'United States', plays: 35 },
        { id: '4', name: 'Royal County Down', country: 'Northern Ireland', plays: 29 },
        { id: '5', name: 'Cypress Point Club', country: 'United States', plays: 24 },
      ];
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Contributors
            <Badge variant="secondary" className="ml-auto">This Month</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                  {index > 0 && (
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                  )}
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contributor.avatar} />
                  <AvatarFallback className="text-xs">
                    {contributor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium text-sm">{contributor.name}</p>
                  <p className="text-xs text-gray-500">@{contributor.username}</p>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {contributor.posts} posts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Trending Courses
            <Badge variant="secondary" className="ml-auto">Most Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingCourses.map((course, index) => (
              <div key={course.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  <span className="text-sm font-medium text-gray-500">
                    #{index + 1}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-1">{course.name}</p>
                  <p className="text-xs text-gray-500">{course.country}</p>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {course.plays} plays
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardCards;
