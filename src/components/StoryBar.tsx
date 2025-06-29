
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import StoryItem from './StoryBar/StoryItem';
import { useStoryData } from './StoryBar/useStoryData';

const StoryBar = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { stories, loading } = useStoryData();

  // Fetch user profile data
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('profile_photo_url, display_name, username')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Function to handle "Your Profile" navigation
  const handleYourProfile = async () => {
    if (!user) {
      navigate('/auth');
    } else {
      // Check if profile exists
      const { data } = await supabase.from('user_profiles').select('id').eq('id', user.id).maybeSingle();
      if (data) {
        navigate('/profile');
      } else {
        navigate('/create-profile');
      }
    }
  };

  // Function to handle other users' profile navigation
  const handleOtherProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  // Function to handle "All Friends" navigation
  const handleAllFriends = () => {
    navigate('/friends');
  };

  if (loading) {
    return (
      <div className="sticky top-16 z-40 bg-background border-b border-border">
        <div className="px-4 py-4">
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-40 bg-background border-b border-border">
      <div className="px-4 py-4">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {stories.map((story) => (
              <CarouselItem key={story.id} className="basis-auto pl-2">
                <StoryItem
                  story={story}
                  onYourProfileClick={handleYourProfile}
                  onOtherProfileClick={handleOtherProfile}
                  hasProfile={!!userProfile}
                />
              </CarouselItem>
            ))}
            
            {/* All Friends Circle */}
            {user && (
              <CarouselItem className="basis-auto pl-2">
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={handleAllFriends}
                    className="focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full"
                    style={{ '--tw-ring-color': '#b66b41' } as React.CSSProperties}
                  >
                    <div 
                      className="w-16 h-16 rounded-full p-0.5 hover:scale-105 transition-transform flex items-center justify-center"
                      style={{ background: 'linear-gradient(to top right, #b66b41, #8b5a34)' }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <img
                          src="/lovable-uploads/15646f15-4cc1-41f9-bb31-e217d9bd0d99.png"
                          alt="All Friends"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </button>
                  <span className="text-xs text-center text-muted-foreground max-w-16 truncate">
                    All Friends
                  </span>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default StoryBar;
