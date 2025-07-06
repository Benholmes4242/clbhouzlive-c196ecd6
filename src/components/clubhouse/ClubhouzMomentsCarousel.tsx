import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import VideoPlayer from '@/components/ui/video-player';
import LazyImage from '@/components/ui/lazy-image';

interface MomentUser {
  id: string;
  display_name: string;
  username: string;
  profile_photo_url: string;
  is_following: boolean;
  video_url: string;
  golf_course?: {
    name: string;
  };
}

const ClubhouzMomentsCarousel: React.FC = () => {
  console.log('ClubhouzMomentsCarousel: Component starting to render');
  
  const { user } = useSupabaseSession();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<MomentUser[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  console.log('ClubhouzMomentsCarousel: State initialized, user:', user?.id);

  const cardsPerView = isMobile ? 2 : 4;

  useEffect(() => {
    console.log('ClubhouzMomentsCarousel: useEffect triggered, user:', user?.id);
    
    const fetchData = async () => {
      if (!user) {
        console.log('ClubhouzMomentsCarousel: No user, skipping fetch');
        setIsLoading(false);
        return;
      }
      
      console.log('ClubhouzMomentsCarousel: Starting data fetch');
      
      try {
        // Get posts with videos
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            user_id,
            post_media!inner(media_url, media_type),
            post_tags(taggable_entities(name, entity_type))
          `)
          .eq('post_media.media_type', 'video')
          .limit(12);

        if (!posts) return;

        // Get profiles and follows
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const [{ data: profiles }, { data: follows }] = await Promise.all([
          supabase.from('user_profiles').select('*').in('id', userIds),
          supabase.from('user_follows').select('following_id').eq('follower_id', user.id)
        ]);

        const followingIds = new Set(follows?.map(f => f.following_id) || []);
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const momentUsers: MomentUser[] = [];
        const seen = new Set();

        for (const post of posts) {
          if (seen.has(post.user_id) || post.user_id === user.id) continue;
          seen.add(post.user_id);

          const profile = profilesMap.get(post.user_id);
          if (!profile) continue;

          const golfTag = post.post_tags?.find(t => t.taggable_entities?.entity_type === 'golf_club');
          
          momentUsers.push({
            id: post.user_id,
            display_name: profile.display_name || profile.username || 'User',
            username: profile.username || 'user',
            profile_photo_url: profile.profile_photo_url || '',
            is_following: followingIds.has(post.user_id),
            video_url: post.post_media[0].media_url,
            golf_course: golfTag ? { name: golfTag.taggable_entities.name } : undefined
          });
        }

        setUsers(momentUsers);
        setFollowingStates(Object.fromEntries(momentUsers.map(u => [u.id, u.is_following])));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleFollow = async (userId: string) => {
    const isFollowing = followingStates[userId];
    setFollowingStates(prev => ({ ...prev, [userId]: !isFollowing }));

    try {
      if (isFollowing) {
        await supabase.from('user_follows').delete().match({ follower_id: user?.id, following_id: userId });
      } else {
        await supabase.from('user_follows').insert({ follower_id: user?.id, following_id: userId });
      }
    } catch (error) {
      setFollowingStates(prev => ({ ...prev, [userId]: isFollowing }));
      toast({ title: "Error", description: "Failed to update follow status", variant: "destructive" });
    }
  };

  const goNext = () => setCurrentIndex(i => (i + 1) % Math.max(1, users.length - cardsPerView + 1));
  const goPrev = () => setCurrentIndex(i => i > 0 ? i - 1 : Math.max(0, users.length - cardsPerView));

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: goPrev,
    preventScrollOnSwipe: true
  });

  if (isLoading) {
    return (
      <div className="w-full mb-6">
        <h2 className="text-lg font-semibold mb-4">Clubhouz Moments</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(cardsPerView).fill(0).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="w-full mb-6">
        <h2 className="text-lg font-semibold mb-4">Clubhouz Moments</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>No moments available</p>
        </div>
      </div>
    );
  }

  const visibleUsers = users.slice(currentIndex, currentIndex + cardsPerView);

  return (
    <div className="w-full mb-6">
      <h2 className="text-lg font-semibold mb-4">Clubhouz Moments</h2>
      
      <div className="relative">
        {!isMobile && users.length > cardsPerView && (
          <>
            <Button variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        <div className="overflow-hidden" {...(isMobile ? swipeHandlers : {})}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visibleUsers.map((user) => (
              <div key={user.id} className="aspect-[3/4] bg-card rounded-lg overflow-hidden relative group">
                <VideoPlayer
                  src={user.video_url}
                  autoplay={true}
                  muted={true}
                  loop={true}
                  className="w-full h-full"
                  showOverlayControls={false}
                  showMuteButton={false}
                  videoId={`moment-${user.id}`}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-3">
                  <div className="flex items-center space-x-2">
                    <LazyImage
                      src={user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                      alt={user.display_name}
                      className="w-8 h-8 rounded-md object-cover border border-white/20"
                      width={32}
                      height={32}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{user.display_name}</div>
                      <div className="text-white/70 text-xs truncate">@{user.username}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user.golf_course && (
                      <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-white text-xs font-medium">📍 {user.golf_course.name}</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={followingStates[user.id] ? "secondary" : "default"}
                      className="w-full h-7 text-xs font-medium"
                      onClick={() => handleFollow(user.id)}
                    >
                      {followingStates[user.id] ? "Following" : "Follow"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubhouzMomentsCarousel;