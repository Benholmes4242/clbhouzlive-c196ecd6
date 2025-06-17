
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import StoryItem from './StoryBar/StoryItem';
import StoryBarSkeleton from './StoryBar/StoryBarSkeleton';
import { StoryUser } from './StoryBar/types';

const StoryBar = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  // Mock data for demonstration
  const stories: StoryUser[] = [
    {
      id: 'add',
      type: 'add',
      user: 'Your Story',
      username: 'your-profile',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    {
      id: '1',
      type: 'friend',
      user: 'Charlotte Barrett',
      username: 'charlottebarrett',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b302?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
    {
      id: '2',
      type: 'friend',
      user: 'Nicola Anne',
      username: 'nicola_anne31',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
    {
      id: '3',
      type: 'friend',
      user: 'Leah Player',
      username: 'leahplayer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      hasStory: true,
    },
    {
      id: '4',
      type: 'suggested',
      user: 'Mike Johnson',
      username: 'mike_golf_pro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      hasStory: false,
    },
    {
      id: '5',
      type: 'suggested',
      user: 'Sarah Chen',
      username: 'sarah_golf',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      hasStory: false,
    },
    {
      id: '6',
      type: 'suggested',
      user: 'Alex Rodriguez',
      username: 'alex_links',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      hasStory: false,
    },
    {
      id: '7',
      type: 'suggested',
      user: 'Emma Thompson',
      username: 'emma_fairway',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      hasStory: false,
    },
  ];

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

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {stories.map((story) => (
              <CarouselItem key={story.id} className="pl-2 md:pl-4 basis-auto">
                <StoryItem
                  story={story}
                  onYourProfileClick={handleYourProfile}
                  onOtherProfileClick={handleOtherProfile}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default StoryBar;
