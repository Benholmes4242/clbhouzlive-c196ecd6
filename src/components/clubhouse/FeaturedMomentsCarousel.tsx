
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
        title: post.content || 'Golf Moment',
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
            <div key={i} className="bg-muted rounded-lg h-48 animate-pulse" />
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
              <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer group">
                {moment.type === 'video' ? (
                  <VideoPreview
                    src={moment.image}
                    videoId={`featured-${moment.id}`}
                    className="w-full h-48"
                  />
                ) : (
                  <img src={moment.image} alt={moment.title} className="w-full h-48 object-cover" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {moment.type === 'video' && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {moment.duration}
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-base font-semibold mb-1">{moment.title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span>@{moment.user}</span>
                    <Clock className="h-3 w-3" />
                    <span>{moment.timeAgo}</span>
                  </div>
                  {(moment as any).userGenerated && (
                    <div className="mt-1">
                      <span className="text-xs bg-blue-500/80 px-2 py-1 rounded">Community</span>
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
