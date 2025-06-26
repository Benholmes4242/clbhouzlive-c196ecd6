
import React from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
import { topPlayers } from '@/data/clubhouseFeedData';

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

interface TopPlayerContentCarouselProps {
  userPosts?: UserPost[];
  loading?: boolean;
}

const TopPlayerContentCarousel = ({ userPosts = [], loading = false }: TopPlayerContentCarouselProps) => {
  // Get unique users with content, prioritizing those with display names
  const uniqueUsers = userPosts.reduce((acc, post) => {
    const userId = post.user.id;
    if (!acc[userId] && post.post_media.length > 0) {
      acc[userId] = {
        id: `user-${userId}`,
        name: post.user.display_name || post.user.username || 'User',
        bio: post.user.user_type === 'individual' ? 'Golf Enthusiast' : 
             post.user.business_name || 'Golf Business',
        avatar: post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        contentImage: post.post_media[0].media_url,
        type: post.post_media[0].media_type,
        duration: post.post_media[0].media_type === 'video' ? '0:30' : undefined,
        userGenerated: true,
        username: post.user.username || 'user'
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const userPlayers = Object.values(uniqueUsers).slice(0, 3);
  
  // Combine user players with static top players, prioritizing user content
  const allPlayers = [...userPlayers, ...topPlayers].slice(0, 6);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Top Player Content</h2>
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
        <h2 className="text-xl font-semibold">Top Player Content</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {allPlayers.map((player) => (
            <CarouselItem key={player.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                {player.type === 'video' ? (
                  <VideoPreview
                    src={player.contentImage}
                    videoId={`player-${player.id}`}
                    className="w-full h-48 object-cover object-center"
                  />
                ) : (
                  <img src={player.contentImage} alt={player.name} className="w-full h-48 object-cover object-center" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {player.type === 'video' && player.duration && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {player.duration}
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full object-cover object-center border-2 border-white" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{player.name}</h3>
                      <p className="text-white/80 text-xs">{player.bio}</p>
                      {player.userGenerated && (
                        <span className="text-xs bg-green-500/80 px-2 py-1 rounded mt-1 inline-block">
                          @{player.username}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                    <UserPlus className="h-3 w-3 mr-2" />
                    {player.userGenerated ? 'Follow' : 'Follow'}
                  </Button>
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

export default TopPlayerContentCarousel;
