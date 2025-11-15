import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AvatarSquircle from '@/components/ui/AvatarSquircle';
import { Heart, MessageCircle, Share, MapPin, Play } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

const communityMomentsData = [
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
    media: {
      url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=600&fit=crop',
      type: 'image'
    },
    content: 'Perfect conditions at the Old Course today! The wind was gentle and the greens were rolling true.',
    rating: 9.5,
    hashtags: ['#StAndrews', '#Top100', '#Scotland'],
    stats: {
      likes: 124,
      comments: 23,
      shares: 8
    },
    createdAt: '2024-01-15T10:30:00Z'
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
      location: 'Pebble Beach, California',
      rank: '#2'
    },
    media: {
      url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=600&fit=crop',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=600&fit=crop'
    },
    content: 'The iconic 18th hole at Pebble Beach never gets old. Despite the wind and the pressure, managed to find the green!',
    rating: 9.2,
    hashtags: ['#PebbleBeach', '#Top100', '#California'],
    stats: {
      likes: 89,
      comments: 15,
      shares: 5
    },
    createdAt: '2024-01-14T15:45:00Z'
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
      location: 'Augusta, Georgia',
      rank: '#3'
    },
    media: {
      url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=600&fit=crop',
      type: 'image'
    },
    content: 'Living the dream at Augusta! The azaleas are in full bloom and the course is in pristine condition.',
    rating: 10.0,
    hashtags: ['#Augusta', '#Masters', '#Top100'],
    stats: {
      likes: 234,
      comments: 45,
      shares: 18
    },
    createdAt: '2024-01-13T08:20:00Z'
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
    media: {
      url: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=600&h=600&fit=crop',
      type: 'image'
    },
    content: 'The Mountains of Mourne sweep down to the sea, and Royal County Down sits perfectly in between.',
    rating: 9.3,
    hashtags: ['#RoyalCountyDown', '#Top100', '#Ireland'],
    stats: {
      likes: 67,
      comments: 12,
      shares: 4
    },
    createdAt: '2024-01-12T14:15:00Z'
  },
  {
    id: '5',
    user: {
      name: 'David Chen',
      username: 'davidgolf',
      avatar: null
    },
    course: {
      name: 'Cypress Point Club',
      location: 'Pebble Beach, California',
      rank: '#5'
    },
    media: {
      url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop'
    },
    content: 'The legendary 16th hole at Cypress Point. The carry over the Pacific is intimidating but oh so rewarding!',
    rating: 9.8,
    hashtags: ['#CypressPoint', '#Top100', '#PacificCoast'],
    stats: {
      likes: 156,
      comments: 28,
      shares: 11
    },
    createdAt: '2024-01-11T16:30:00Z'
  },
  {
    id: '6',
    user: {
      name: 'Sophie Martin',
      username: 'sophiegolf',
      avatar: null
    },
    course: {
      name: 'Royal Birkdale',
      location: 'Southport, England',
      rank: '#6'
    },
    media: {
      url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=600&fit=crop',
      type: 'image'
    },
    content: 'Classic links golf at its finest. The dunes at Royal Birkdale create a natural amphitheater.',
    rating: 8.9,
    hashtags: ['#RoyalBirkdale', '#Top100', '#LinksGolf'],
    stats: {
      likes: 78,
      comments: 16,
      shares: 6
    },
    createdAt: '2024-01-10T11:45:00Z'
  }
];

const CommunityTop100Moments = () => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Community Top 100 Moments</h2>
        <p className="text-muted-foreground">Latest posts from Clubhouse members at Top 100 courses</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityMomentsData.map((post) => (
          <Card key={post.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              {/* Media */}
              <div className="relative aspect-square overflow-hidden">
                {post.media.type === 'video' ? (
                  <div className="relative">
                    <img
                      src={post.media.thumbnail || post.media.url}
                      alt={post.course.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3">
                        <Play className="h-6 w-6 text-gray-900 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={post.media.url}
                    alt={post.course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                
                {/* Course Rank Badge */}
                <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                  {post.course.rank}
                </Badge>
                
                {/* Rating */}
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
                  <ClubhouseLogo size="xs" showTooltip />
                  <span className="text-xs font-medium">{post.rating}</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-3">
                  <AvatarSquircle
                    src={post.user.avatar || undefined}
                    alt={post.user.name}
                    size="md"
                    fallback={post.user.name.split(' ').map(n => n[0]).join('')}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{post.user.name}</p>
                    <p className="text-sm text-muted-foreground">@{post.user.username}</p>
                  </div>
                </div>
                
                {/* Course Location */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{post.course.name}</p>
                    <p className="text-xs text-muted-foreground">{post.course.location}</p>
                  </div>
                </div>
                
                {/* Post Content */}
                <p className="text-sm mb-3 line-clamp-2">{post.content}</p>
                
                {/* Hashtags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      className={`flex items-center gap-1 ${
                        likedPosts.has(post.id) ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} 
                      />
                      <span className="text-sm">{post.stats.likes}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{post.stats.comments}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Share className="h-4 w-4" />
                      <span className="text-sm">{post.stats.shares}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <button className="text-primary hover:text-primary/80 font-medium">
          View All Community Moments →
        </button>
      </div>
    </section>
  );
};

export default CommunityTop100Moments;