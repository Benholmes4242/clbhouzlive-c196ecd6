import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { Play, Heart, MessageCircle, Share, MapPin } from 'lucide-react';

const videoMomentsData = [
  {
    id: '1',
    user: {
      name: 'James MacLeod',
      username: 'jamesmac_golf',
      avatar: null
    },
    course: {
      name: 'St. Andrews Old Course',
      location: 'St. Andrews, Scotland',
      rank: '#1'
    },
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
    duration: '0:24',
    stats: {
      likes: 234,
      comments: 45,
      shares: 18
    }
  },
  {
    id: '2',
    user: {
      name: 'Sarah Williams',
      username: 'sarahgolf',
      avatar: null
    },
    course: {
      name: 'Pebble Beach Golf Links',
      location: 'Pebble Beach, CA',
      rank: '#2'
    },
    thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop',
    duration: '0:31',
    stats: {
      likes: 189,
      comments: 32,
      shares: 12
    }
  },
  {
    id: '3',
    user: {
      name: 'Michael Johnson',
      username: 'mikej_golf',
      avatar: null
    },
    course: {
      name: 'Augusta National Golf Club',
      location: 'Augusta, GA',
      rank: '#3'
    },
    thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop',
    duration: '0:18',
    stats: {
      likes: 456,
      comments: 87,
      shares: 34
    }
  },
  {
    id: '4',
    user: {
      name: 'Emma Thompson',
      username: 'emmagolf',
      avatar: null
    },
    course: {
      name: 'Royal County Down',
      location: 'Newcastle, Northern Ireland',
      rank: '#4'
    },
    thumbnail: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=400&h=300&fit=crop',
    duration: '0:27',
    stats: {
      likes: 167,
      comments: 28,
      shares: 9
    }
  }
];

const Top100VideoMoments = () => {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Top 100 Video Moments</h2>
        <p className="text-muted-foreground">Short-form videos from the world's greatest golf courses</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {videoMomentsData.map((video) => (
          <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              {/* Video Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.course.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                  <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                    <Play className="h-6 w-6 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>
                
                {/* Duration Badge */}
                <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                  {video.duration}
                </Badge>
                
                {/* Course Rank */}
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                  {video.course.rank}
                </Badge>
              </div>
              
              {/* Video Info */}
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-3">
                  <AvatarSquircle
                    src={video.user.avatar || undefined}
                    alt={video.user.name}
                    size="sm"
                    fallback={video.user.name.split(' ').map(n => n[0]).join('')}
                  />
                  <div>
                    <p className="font-medium text-sm">{video.user.name}</p>
                    <p className="text-xs text-muted-foreground">@{video.user.username}</p>
                  </div>
                </div>
                
                {/* Course Info */}
                <div className="mb-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{video.course.name}</p>
                      <p className="text-xs text-muted-foreground">{video.course.location}</p>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{video.stats.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>{video.stats.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share className="h-3 w-3" />
                    <span>{video.stats.shares}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <button className="text-primary hover:text-primary/80 font-medium">
          View All Video Moments →
        </button>
      </div>
    </section>
  );
};

export default Top100VideoMoments;