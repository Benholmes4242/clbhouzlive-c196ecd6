
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import { MapPin, Heart, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ClubhousePost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    user_type: 'individual' | 'club' | 'pro_shop' | 'academy' | 'tour_event' | 'other' | null;
    business_name: string | null;
    eg_handicap_index?: number | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
  post_tags: {
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
  stats?: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface FeaturedMomentsCarouselProps {
  userPosts: ClubhousePost[];
  loading: boolean;
}

const FeaturedMomentsCarousel: React.FC<FeaturedMomentsCarouselProps> = ({ 
  userPosts, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[#b66b41]" />
          <h2 className="text-xl font-bold">Featured Moments</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Sort posts by likes and get top featured ones
  const featuredPosts = userPosts
    .filter(post => post.post_media.length > 0)
    .sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
    .slice(0, 8);

  if (featuredPosts.length === 0) {
    return null;
  }

  const carouselItems = featuredPosts.map((post) => {
    const displayName = post.user.display_name || post.user.username || 'Golf Enthusiast';
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
    const golfClub = post.post_tags.find(tag => tag.entity_type === 'golf_club');
    const thumbnail = post.post_media[0]?.media_url;

    return (
      <Card key={post.id} className="min-w-[280px] group cursor-pointer hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={thumbnail}
              alt="Featured moment"
              className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay with post info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-t-lg" />
            
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                />
                <div>
                  <p className="font-semibold text-sm">{displayName}</p>
                  <p className="text-xs text-white/80">{timeAgo}</p>
                </div>
              </div>
              
              {golfClub && (
                <div className="flex items-center gap-1 text-xs text-white/90 mb-1">
                  <MapPin className="h-3 w-3" />
                  <span>{golfClub.name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-current text-red-400" />
                  <span>{post.stats?.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💬</span>
                  <span>{post.stats?.comments || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.content || 'Amazing golf moment shared with the community!'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-[#b66b41]" />
        <h2 className="text-xl font-bold">Featured Moments</h2>
        <span className="text-sm text-muted-foreground">Community Highlights</span>
      </div>
      
      <SwipeCarousel
        items={carouselItems}
        showDots={false}
        showArrows={true}
        className="px-1"
      />
    </div>
  );
};

export default FeaturedMomentsCarousel;
