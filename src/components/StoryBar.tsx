
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";
import { useStoryData } from './StoryBar/useStoryData';
import StoryItem from './StoryBar/StoryItem';
import StoryNavigation from './StoryBar/StoryNavigation';
import StoryBarSkeleton from './StoryBar/StoryBarSkeleton';

const StoryBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { stories, loading } = useStoryData();

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

  // Navigation functions for carousel
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(0, stories.length - 7) : Math.max(0, prevIndex - 1)
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      Math.min(stories.length - 7, prevIndex + 1)
    );
  };

  // Get visible stories (7 at a time)
  const visibleStories = stories.slice(currentIndex, currentIndex + 7);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + 7 < stories.length;

  if (loading) {
    return <StoryBarSkeleton />;
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex items-center">
          <StoryNavigation
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />

          {/* Stories container */}
          <div className="flex space-x-4 overflow-hidden mx-8">
            {visibleStories.map((story) => (
              <StoryItem
                key={story.id}
                story={story}
                onYourProfileClick={handleYourProfile}
                onOtherProfileClick={handleOtherProfile}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryBar;
