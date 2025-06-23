
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
import { featuredMoments } from '@/data/clubhouseFeedData';
import { formatDistanceToNow } from 'date-fns';

interface UserPost {
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
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
}

interface FeaturedMomentsCarouselProps {
  userPosts?: UserPost[];
  loading?: boolean;
}

const FeaturedMomentsCarousel = ({ userPosts = [], loading = false }: FeaturedMomentsCarouselProps) => {
  // Convert user posts with videos to featured moments format
  const userVideoMoments = userPosts
    .filter(post => post.post_media.some(media => media.media_type === 'video'))
    .slice(0, 3) // Limit to first 3 user videos
    .map(post => {
      const videoMedia = post.post_media.find(media => media.media_type === 'video');
      const displayName = post.user.display_name || post.user.username || 'User';
      const username = post.user.username || 'user';
      
      return {
        id: `user-${post.id}`,
        title: post.content || '',
        user: username,
        timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
        image: videoMedia!.media_url,
        type: 'video' as const,
        duration: '0:30', // Default duration for user videos
        userGenerated: true,
        userProfile: post.user
      };
    });

  // Combine user content with static featured moments, prioritizing user content
  const allMoments = [...userVideoMoments, ...featuredMoments].slice(0, 6);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Moments</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="bg-muted rounded-lg h-40 animate-pulse" />
              <div className="bg-muted rounded h-4 animate-pulse" />
              <div className="bg-muted rounded h-3 w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Featured Moments</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {allMoments.map((moment) => (
            <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="cursor-pointer group space-y-3">
                {/* Thumbnail Container */}
                <div className="relative rounded-lg overflow-hidden bg-black">
                  {moment.type === 'video' ? (
                    <VideoPreview
                      src={moment.image}
                      videoId={`featured-${moment.id}`}
                      className="w-full h-40"
                    />
                  ) : (
                    <img 
                      src={moment.image} 
                      alt={moment.title} 
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                  )}
                  
                  {/* Duration badge for videos */}
                  {moment.type === 'video' && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded text-center font-medium">
                      {moment.duration}
                    </div>
                  )}
                </div>
                
                {/* Content below thumbnail */}
                <div className="space-y-1">
                  {moment.title && (
                    <h3 className="text-sm font-medium line-clamp-2 leading-snug">
                      {moment.title}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>@{moment.user}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{moment.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
};

export default FeaturedMomentsCarousel;
