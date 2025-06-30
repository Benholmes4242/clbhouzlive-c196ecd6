
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Heart, MessageCircle, Share } from 'lucide-react';

const FeaturedMoment = () => {
  const { data: featuredPost } = useQuery({
    queryKey: ['featuredMoment'],
    queryFn: async () => {
      // Mock featured post data
      return {
        id: '1',
        content: 'Perfect conditions at the Old Course today! The wind was gentle and the greens were rolling true. What an incredible experience playing where legends have walked. #StAndrews #Top100',
        user: {
          name: 'James MacLeod',
          username: 'jamesmac_golf',
          avatar: null
        },
        course: {
          name: 'St. Andrews Old Course',
          location: 'St. Andrews, Scotland'
        },
        media: {
          url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=600&fit=crop',
          type: 'image'
        },
        stats: {
          likes: 127,
          comments: 23,
          shares: 8
        },
        createdAt: '2024-01-15T10:30:00Z'
      };
    },
  });

  if (!featuredPost) {
    return null;
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-r from-[#b66b41]/5 to-green-50 border-[#b66b41]/20">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 p-4 pb-2">
          <Star className="h-5 w-5 text-yellow-500 fill-current" />
          <span className="font-semibold text-[#b66b41]">Featured Moment</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            Snap of the Day
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="aspect-video md:aspect-square relative overflow-hidden">
            <img
              src={featuredPost.media.url}
              alt="Featured moment"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={featuredPost.user.avatar} />
                  <AvatarFallback>
                    {featuredPost.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{featuredPost.user.name}</p>
                  <p className="text-sm text-gray-600">@{featuredPost.user.username}</p>
                </div>
              </div>

              {/* Course Info */}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-[#b66b41]" />
                <div>
                  <p className="font-medium text-sm">{featuredPost.course.name}</p>
                  <p className="text-xs text-gray-600">{featuredPost.course.location}</p>
                </div>
              </div>

              {/* Caption */}
              <p className="text-sm text-gray-700 line-clamp-4 mb-4">
                {featuredPost.content}
              </p>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{featuredPost.stats.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{featuredPost.stats.comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share className="h-4 w-4" />
                  <span>{featuredPost.stats.shares}</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm">
                View Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedMoment;
