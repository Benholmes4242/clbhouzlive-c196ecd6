
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
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
  stats?: {
    likes: number;
    comments: number;
    views: number;
  };
}

interface FeaturedMomentsCarouselProps {
  userPosts?: UserPost[];
  loading?: boolean;
}

const FeaturedMomentsCarousel = ({ userPosts = [], loading = false }: FeaturedMomentsCarouselProps) => {
  // Filter for video posts and limit to show variety
  const videoMoments = userPosts
    .filter(post => post.post_media.some(media => media.media_type === 'video'))
    .slice(0, 12) // Show up to 12 videos for good variety
    .map(post => {
      const videoMedia = post.post_media.find(media => media.media_type === 'video');
      const displayName = post.user.display_name || post.user.business_name || post.user.username || 'User';
      const username = post.user.username || `user_${post.user.id.slice(0, 8)}`;
      
      // Generate title from content or use fallback
      const title = post.content 
        ? post.content.length > 60 
          ? post.content.substring(0, 60) + '...' 
          : post.content
        : 'Golf moment';
      
      return {
        id: post.id,
        title,
        user: username,
        displayName,
        timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
        videoUrl: videoMedia!.media_url,
        type: 'video' as const,
        duration: '0:30', // Default duration - could be enhanced with actual video duration
        userGenerated: true,
        userProfile: post.user,
        stats: post.stats
      };
    });

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Moments</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="bg-muted rounded-lg aspect-square animate-pulse" />
              <div className="bg-muted rounded h-4 animate-pulse" />
              <div className="bg-muted rounded h-3 w-3/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videoMoments.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Moments</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No video content available yet.</p>
          <p className="text-sm mt-1">Be the first to share your golf moments!</p>
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
          {videoMoments.map((moment) => (
            <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="cursor-pointer group space-y-3">
                {/* Thumbnail Container - Square aspect ratio for better consistency */}
                <div className="relative rounded-lg overflow-hidden bg-black aspect-square">
                  <VideoPreview
                    src={moment.videoUrl}
                    videoId={`featured-${moment.id}`}
                    className="w-full h-full"
                  />
                  
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded text-center font-medium">
                    {moment.duration}
                  </div>

                  {/* View count overlay if available */}
                  {moment.stats && moment.stats.views > 0 && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {moment.stats.views} views
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
                  
                  {/* Engagement stats */}
                  {moment.stats && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{moment.stats.likes} likes</span>
                      <span>{moment.stats.comments} comments</span>
                    </div>
                  )}
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
