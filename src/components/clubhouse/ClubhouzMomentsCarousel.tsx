import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { UserPlus, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { toast } from 'sonner';

interface MomentUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Moment {
  id: string;
  user: MomentUser;
  videoUrl: string;
  isFollowing: boolean;
  golfClubTag?: string;
}

const MomentCard: React.FC<{ 
  moment: Moment; 
  onFollowToggle: (userId: string, isCurrentlyFollowing: boolean) => void;
}> = ({ moment, onFollowToggle }) => {
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay({
    enabled: true,
    threshold: 0.3
  });

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 h-[280px]">
      <div 
        ref={autoplayRef}
        className="relative h-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video Background */}
        <video
          src={moment.videoUrl}
          className="w-full h-full object-cover"
          autoPlay={shouldAutoplay}
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* User Info Overlay */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <img
            src={moment.user.avatar}
            alt={moment.user.name}
            className="w-8 h-8 rounded-full border-2 border-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            }}
          />
          <div>
            <p className="text-white text-sm font-medium">{moment.user.name}</p>
            <p className="text-white/80 text-xs">@{moment.user.username}</p>
          </div>
        </div>
        
        {/* Golf Club Tag and Follow Button */}
        <div className="absolute bottom-3 left-3 right-3 space-y-2">
          {moment.golfClubTag && (
            <div className="flex justify-center">
              <span className="bg-black/60 text-white rounded-full px-3 py-1 text-xs font-medium truncate max-w-full">
                {moment.golfClubTag}
              </span>
            </div>
          )}
          <Button 
            variant={moment.isFollowing ? "secondary" : "default"}
            size="sm"
            className={`w-full px-2 py-1 h-auto ${
              moment.isFollowing 
                ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30' 
                : 'bg-white text-black hover:bg-white/90'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onFollowToggle(moment.user.id, moment.isFollowing);
            }}
          >
            {moment.isFollowing ? (
              <>
                <UserCheck className="h-3 w-3 mr-1" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Follow
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const ClubhouzMomentsCarousel = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseSession();

  const fetchMoments = async () => {
    if (!user) return;

    try {
      // Fetch video posts with user data only (post_tags relationship doesn't exist yet)
      const { data: videoPosts, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          post_media!inner (
            media_url,
            media_type
          )
        `)
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching video posts:', error);
        return;
      }

      if (!videoPosts || videoPosts.length === 0) return;

      // Get unique user IDs
      const userIds = [...new Set(videoPosts.map(post => post.user_id))];
      
      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get user's following list
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = new Set(followingData?.map(f => f.following_id) || []);

      // Group posts by user to prevent duplicates
      const userPostsMap = new Map<string, any>();
      
      videoPosts
        .filter(post => post.user_id !== user.id) // Exclude own posts
        .forEach(post => {
          // Only keep the first post for each user (most recent due to ordering)
          if (!userPostsMap.has(post.user_id)) {
            userPostsMap.set(post.user_id, post);
          }
        });

      // Format moments data from unique users
      const formattedMoments: Moment[] = Array.from(userPostsMap.values())
        .map(post => {
          const userProfile = profiles?.find(profile => profile.id === post.user_id);
          if (!userProfile) return null;

          return {
            id: post.id,
            user: {
              id: post.user_id,
              name: userProfile.display_name || userProfile.username || 'User',
              username: userProfile.username || 'user',
              avatar: userProfile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            },
            videoUrl: post.post_media[0]?.media_url || '',
            isFollowing: followingIds.has(post.user_id)
          };
        })
        .filter(moment => moment !== null && moment.videoUrl !== '')
        .slice(0, 10); // Limit to 10 unique users

      setMoments(formattedMoments);
    } catch (error) {
      console.error('Error fetching moments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!user) return;

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;
        toast.success('Following successfully');
      }

      // Update local state
      setMoments(prev => prev.map(moment => 
        moment.user.id === userId 
          ? { ...moment, isFollowing: !isCurrentlyFollowing }
          : moment
      ));
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  useEffect(() => {
    fetchMoments();
  }, [user]);

  if (loading) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Moments you may like</h2>
        </div>
        <div className="flex space-x-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[200px] h-[280px] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (moments.length === 0) {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Moments you may like</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No video moments available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Moments you may like</h2>
        <div className="flex items-center space-x-2">
          <ChevronLeft className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
          <ChevronRight className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {moments.map((moment) => (
            <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-[200px] md:basis-[220px]">
              <MomentCard 
                moment={moment} 
                onFollowToggle={handleFollowToggle}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4" />
        <CarouselNext className="hidden md:flex -right-4" />
      </Carousel>
    </div>
  );
};

export default ClubhouzMomentsCarousel;