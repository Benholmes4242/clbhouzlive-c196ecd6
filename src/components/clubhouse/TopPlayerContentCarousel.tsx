
import React from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileActions } from '@/components/profile/actions/useProfileActions';
import { useNavigate } from 'react-router-dom';

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
    eg_handicap_index?: number | null;
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
  const { user: currentUser } = useSupabaseSession();

  // Get unique users with content, prioritizing those with display names
  const uniqueUsers = userPosts.reduce((acc, post) => {
    const userId = post.user.id;
    if (!acc[userId] && post.post_media.length > 0) {
      acc[userId] = {
        id: userId,
        name: post.user.display_name || post.user.username || 'User',
        // Use actual handicap from database
        handicap: post.user.eg_handicap_index !== null && post.user.eg_handicap_index !== undefined 
          ? Math.round(post.user.eg_handicap_index * 10) / 10 
          : null,
        avatar: post.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        contentImage: post.post_media[0].media_url,
        type: post.post_media[0].media_type,
        duration: post.post_media[0].media_type === 'video' ? '0:30' : undefined,
        userGenerated: true,
        username: post.user.username || `user_${userId.slice(0, 8)}`,
        user: post.user
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const userPlayers = Object.values(uniqueUsers);

  console.log('TopPlayerContentCarousel - userPlayers:', userPlayers);
  console.log('TopPlayerContentCarousel - currentUser:', currentUser);

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

  if (userPlayers.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Top Player Content</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No player content available yet.</p>
          <p className="text-sm mt-1">Be the first to share your golf content!</p>
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
          {userPlayers.map((player) => (
            <CarouselItem key={player.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <PlayerCard 
                player={player} 
                currentUserId={currentUser?.id} 
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
};

interface PlayerCardProps {
  player: any;
  currentUserId?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, currentUserId }) => {
  const navigate = useNavigate();
  const { handleFollow } = useProfileActions({
    targetUserId: player.id,
    currentUserId: currentUserId || ''
  });

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || currentUserId === player.id) return;
    
    console.log('Follow button clicked for user:', player.id);
    // Since we don't have follow status in this context, we'll assume not following and follow
    await handleFollow(false);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${player.username}`);
  };

  const displayHandicap = player.handicap !== null ? `${player.handicap} HCP` : 'No HCP';

  return (
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
          <img 
            src={player.avatar} 
            alt={player.name} 
            className="w-16 h-16 rounded-full object-cover object-center border-2 border-white cursor-pointer hover:border-white/80 transition-colors" 
            onClick={handleProfileClick}
          />
          <div className="flex-1 min-w-0">
            <h3 
              className="text-white font-semibold text-sm mb-1 cursor-pointer hover:text-white/80 transition-colors" 
              onClick={handleProfileClick}
            >
              {player.name}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <span>{displayHandicap}</span>
              <span>•</span>
              <span 
                className="cursor-pointer hover:text-white/60 transition-colors"
                onClick={handleProfileClick}
              >
                @{player.username}
              </span>
            </div>
          </div>
        </div>
        {currentUserId && currentUserId !== player.id && (
          <Button 
            size="sm" 
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
            onClick={handleFollowClick}
          >
            <UserPlus className="h-3 w-3 mr-2" />
            Follow
          </Button>
        )}
      </div>
    </div>
  );
};

export default TopPlayerContentCarousel;
