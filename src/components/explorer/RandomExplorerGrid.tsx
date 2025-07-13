import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share, Eye, MapPin, Star, Play } from 'lucide-react';

interface FilterState {
  audience: 'friends' | 'all';
  region: 'global' | 'britain-ireland' | 'usa' | 'europe';
  search: string;
  viewMode: 'media' | 'course';
  showMap: boolean;
  sortBy: 'recent' | 'rating' | 'engagement';
}

interface ExplorerPost {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  course: {
    id: string;
    name: string;
    location: string;
    country: string;
  };
  media: {
    url: string;
    type: 'image' | 'video';
    thumbnail?: string;
  };
  content: string;
  rating: number;
  progressBadge: string;
  hashtags: string[];
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdAt: string;
}

interface RandomExplorerGridProps {
  filters: FilterState;
}

const RandomExplorerGrid: React.FC<RandomExplorerGridProps> = ({ filters }) => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const { data: explorerPosts = [], isLoading } = useQuery({
    queryKey: ['explorerPosts', filters],
    queryFn: async () => {
      // Mock data - in real implementation, this would query posts from Top 100 courses
      const mockPosts: ExplorerPost[] = [
        {
          id: '1',
          user: {
            id: 'user1',
            name: 'James MacLeod',
            username: 'jamesmac_golf',
            avatar: null
          },
          course: {
            id: 'course1',
            name: 'St. Andrews Old Course',
            location: 'St. Andrews, Scotland',
            country: 'Scotland'
          },
          media: {
            url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=600&fit=crop',
            type: 'image'
          },
          content: 'Perfect conditions at the Old Course today! The wind was gentle and the greens were rolling true. What an incredible experience playing where legends have walked.',
          rating: 9.5,
          progressBadge: '67/100',
          hashtags: ['#StAndrews', '#Top100', '#Scotland'],
          stats: {
            likes: 124,
            comments: 23,
            shares: 8,
            views: 567
          },
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          user: {
            id: 'user2',
            name: 'Sarah Williams',
            username: 'sarahgolf',
            avatar: null
          },
          course: {
            id: 'course2',
            name: 'Pebble Beach Golf Links',
            location: 'Pebble Beach, California',
            country: 'United States'
          },
          media: {
            url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=600&fit=crop',
            type: 'video',
            thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=600&fit=crop'
          },
          content: 'The iconic 18th hole at Pebble Beach never gets old. Despite the wind and the pressure, managed to find the green in regulation!',
          rating: 9.2,
          progressBadge: '52/100',
          hashtags: ['#PebbleBeach', '#Top100', '#California'],
          stats: {
            likes: 89,
            comments: 15,
            shares: 5,
            views: 432
          },
          createdAt: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          user: {
            id: 'user3',
            name: 'Michael Johnson',
            username: 'mikej_golf',
            avatar: null
          },
          course: {
            id: 'course3',
            name: 'Augusta National Golf Club',
            location: 'Augusta, Georgia',
            country: 'United States'
          },
          media: {
            url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=600&fit=crop',
            type: 'image'
          },
          content: 'Living the dream at Augusta! The azaleas are in full bloom and the course is in pristine condition. Truly a cathedral of golf.',
          rating: 10.0,
          progressBadge: '48/100',
          hashtags: ['#Augusta', '#Masters', '#Top100'],
          stats: {
            likes: 234,
            comments: 45,
            shares: 18,
            views: 1123
          },
          createdAt: '2024-01-13T08:20:00Z'
        },
        {
          id: '4',
          user: {
            id: 'user4',
            name: 'Emma Thompson',
            username: 'emmagolf',
            avatar: null
          },
          course: {
            id: 'course4',
            name: 'Royal County Down',
            location: 'Newcastle, Northern Ireland',
            country: 'Northern Ireland'
          },
          media: {
            url: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=600&h=600&fit=crop',
            type: 'image'
          },
          content: 'The Mountains of Mourne sweep down to the sea, and Royal County Down sits perfectly in between. What a stunning backdrop for golf!',
          rating: 9.3,
          progressBadge: '41/100',
          hashtags: ['#RoyalCountyDown', '#Top100', '#Ireland'],
          stats: {
            likes: 67,
            comments: 12,
            shares: 4,
            views: 289
          },
          createdAt: '2024-01-12T14:15:00Z'
        },
        {
          id: '5',
          user: {
            id: 'user5',
            name: 'David Chen',
            username: 'davidgolf',
            avatar: null
          },
          course: {
            id: 'course5',
            name: 'Cypress Point Club',
            location: 'Pebble Beach, California',
            country: 'United States'
          },
          media: {
            url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop',
            type: 'video',
            thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=600&fit=crop'
          },
          content: 'The legendary 16th hole at Cypress Point. The carry over the Pacific is intimidating but oh so rewarding when you nail it!',
          rating: 9.8,
          progressBadge: '39/100',
          hashtags: ['#CypressPoint', '#Top100', '#PacificCoast'],
          stats: {
            likes: 156,
            comments: 28,
            shares: 11,
            views: 734
          },
          createdAt: '2024-01-11T16:30:00Z'
        },
        {
          id: '6',
          user: {
            id: 'user6',
            name: 'Sophie Martin',
            username: 'sophiegolf',
            avatar: null
          },
          course: {
            id: 'course6',
            name: 'Royal Birkdale',
            location: 'Southport, England',
            country: 'England'
          },
          media: {
            url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=600&fit=crop',
            type: 'image'
          },
          content: 'Classic links golf at its finest. The dunes at Royal Birkdale create a natural amphitheater that makes every shot feel dramatic.',
          rating: 8.9,
          progressBadge: '35/100',
          hashtags: ['#RoyalBirkdale', '#Top100', '#LinksGolf'],
          stats: {
            likes: 78,
            comments: 16,
            shares: 6,
            views: 345
          },
          createdAt: '2024-01-10T11:45:00Z'
        }
      ];

      // Apply filters
      let filteredPosts = mockPosts;

      // Filter by region
      if (filters.region !== 'global') {
        const regionCountries = {
          'britain-ireland': ['Scotland', 'England', 'Wales', 'Ireland', 'Northern Ireland'],
          'usa': ['United States'],
          'europe': ['France', 'Spain', 'Germany', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark']
        };
        
        filteredPosts = filteredPosts.filter(post => 
          regionCountries[filters.region]?.includes(post.course.country)
        );
      }

      // Filter by search
      if (filters.search) {
        filteredPosts = filteredPosts.filter(post => 
          post.course.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          post.course.location.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Sort posts
      switch (filters.sortBy) {
        case 'rating':
          filteredPosts.sort((a, b) => b.rating - a.rating);
          break;
        case 'engagement':
          filteredPosts.sort((a, b) => 
            (b.stats.likes + b.stats.comments + b.stats.shares) - 
            (a.stats.likes + a.stats.comments + a.stats.shares)
          );
          break;
        case 'recent':
        default:
          filteredPosts.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }

      return filteredPosts;
    },
  });

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">🧭 Community Top 100 Moments</h3>
        <p className="text-sm text-muted-foreground">{explorerPosts.length} posts found</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0">
        {explorerPosts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-sm transition-shadow group border-0 rounded-none aspect-square">
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
              
              {/* Progress Badge */}
              <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                {post.progressBadge}
              </Badge>
              
              {/* Rating */}
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{post.rating}</span>
              </div>
            </div>

            {/* Overlay content for hover - minimally intrusive */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
              {/* Top overlay - User info */}
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.user.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {post.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs text-white truncate">{post.user.name}</p>
                </div>
              </div>

              {/* Bottom overlay - Course and actions */}
              <div className="space-y-1">
                {/* Course info - single line */}
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-white/90 flex-shrink-0" />
                  <p className="font-medium text-xs text-white truncate">{post.course.name}</p>
                </div>
                
                {/* Actions - minimal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      className={`flex items-center gap-1 h-6 px-1 text-white hover:bg-white/20 ${
                        likedPosts.has(post.id) ? 'text-red-400' : ''
                      }`}
                    >
                      <Heart 
                        className={`h-3 w-3 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} 
                      />
                      <span className="text-xs">{post.stats.likes}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1 h-6 px-1 text-white hover:bg-white/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span className="text-xs">{post.stats.comments}</span>
                    </Button>
                  </div>
                  
                  <Badge className="bg-black/50 text-white border-0 text-xs">
                    {post.progressBadge}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {explorerPosts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏌️‍♂️</div>
          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      )}
    </div>
  );
};

export default RandomExplorerGrid;