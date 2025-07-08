import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Heart, MessageCircle, Share, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface VideoHighlight {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  course: {
    name: string;
    location: string;
  };
  media: {
    url: string;
    thumbnail: string;
    duration: string;
  };
  title: string;
  hashtags: string[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdAt: string;
}

const VideoHighlights = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const { data: videoHighlights = [] } = useQuery({
    queryKey: ['videoHighlights'],
    queryFn: async () => {
      // Mock data - in real implementation, this would query video posts from Top 100 courses
      const mockVideos: VideoHighlight[] = [
        {
          id: 'v1',
          user: {
            id: 'user1',
            name: 'James MacLeod',
            username: 'jamesmac_golf',
            avatar: null
          },
          course: {
            name: 'St. Andrews Old Course',
            location: 'St. Andrews, Scotland'
          },
          media: {
            url: 'https://example.com/video1.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=600&fit=crop',
            duration: '0:45'
          },
          title: 'Perfect approach shot to the 18th green',
          hashtags: ['#StAndrews', '#Top100', '#ApproachShot'],
          stats: {
            likes: 89,
            comments: 12,
            shares: 5,
            views: 456
          },
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 'v2',
          user: {
            id: 'user2',
            name: 'Sarah Williams',
            username: 'sarahgolf',
            avatar: null
          },
          course: {
            name: 'Pebble Beach Golf Links',
            location: 'California, USA'
          },
          media: {
            url: 'https://example.com/video2.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=600&fit=crop',
            duration: '0:32'
          },
          title: 'The famous 18th hole at Pebble Beach',
          hashtags: ['#PebbleBeach', '#Top100', '#Iconic'],
          stats: {
            likes: 156,
            comments: 23,
            shares: 8,
            views: 723
          },
          createdAt: '2024-01-14T15:45:00Z'
        },
        {
          id: 'v3',
          user: {
            id: 'user3',
            name: 'Michael Johnson',
            username: 'mikej_golf',
            avatar: null
          },
          course: {
            name: 'Augusta National',
            location: 'Georgia, USA'
          },
          media: {
            url: 'https://example.com/video3.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=600&fit=crop',
            duration: '0:58'
          },
          title: 'Walking down the 18th fairway at Augusta',
          hashtags: ['#Augusta', '#Masters', '#Dreams'],
          stats: {
            likes: 234,
            comments: 45,
            shares: 18,
            views: 1234
          },
          createdAt: '2024-01-13T08:20:00Z'
        },
        {
          id: 'v4',
          user: {
            id: 'user4',
            name: 'Emma Thompson',
            username: 'emmagolf',
            avatar: null
          },
          course: {
            name: 'Royal County Down',
            location: 'Northern Ireland'
          },
          media: {
            url: 'https://example.com/video4.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=400&h=600&fit=crop',
            duration: '0:41'
          },
          title: 'Stunning views from the 9th tee',
          hashtags: ['#RoyalCountyDown', '#Views', '#Ireland'],
          stats: {
            likes: 67,
            comments: 8,
            shares: 3,
            views: 289
          },
          createdAt: '2024-01-12T14:15:00Z'
        },
        {
          id: 'v5',
          user: {
            id: 'user5',
            name: 'David Chen',
            username: 'davidgolf',
            avatar: null
          },
          course: {
            name: 'Cypress Point Club',
            location: 'California, USA'
          },
          media: {
            url: 'https://example.com/video5.mp4',
            thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop',
            duration: '0:37'
          },
          title: 'The legendary 16th hole carry',
          hashtags: ['#CypressPoint', '#Legendary', '#Carry'],
          stats: {
            likes: 198,
            comments: 34,
            shares: 12,
            views: 856
          },
          createdAt: '2024-01-11T16:30:00Z'
        }
      ];

      return mockVideos;
    },
  });

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-6 w-6 text-blue-600" />
          🎥 Top 100 Video Moments
          <Badge variant="secondary" className="ml-auto">Trending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel className="w-full max-w-full">
          <CarouselContent className="-ml-4">
            {videoHighlights.map((video, index) => (
              <CarouselItem key={video.id} className="pl-4 basis-1/1 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-[9/16] overflow-hidden">
                    <img
                      src={video.media.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 rounded-full p-4">
                        <Play className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" />
                      </div>
                    </div>
                    
                    {/* Duration */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                      {video.media.duration}
                    </div>
                    
                    {/* Views */}
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {video.stats.views} views
                    </div>
                  </div>

                  <CardContent className="p-3">
                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={video.user.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {video.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{video.user.name}</p>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-medium text-sm line-clamp-2 mb-2">
                      {video.title}
                    </h4>

                    {/* Course */}
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {video.course.name}
                    </p>

                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {video.hashtags.slice(0, 2).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{video.stats.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{video.stats.comments}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        Watch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            View All Video Highlights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoHighlights;