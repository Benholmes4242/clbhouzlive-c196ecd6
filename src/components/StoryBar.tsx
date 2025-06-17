
import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/integrations/supabase/client";

type StoryUser = {
  id: string;
  type?: 'add' | 'friend' | 'suggested';
  user: string;
  username: string;
  avatar: string;
  hasStory?: boolean;
  display_name?: string;
};

const StoryBar = () => {
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  useEffect(() => {
    const fetchStoriesData = async () => {
      if (!user) {
        // Show static data for non-authenticated users
        setStories([
          {
            id: 'add',
            type: 'add',
            user: 'Your Profile',
            username: 'your-profile',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        // Start with "Your Profile" story
        const newStories: StoryUser[] = [
          {
            id: 'add',
            type: 'add',
            user: 'Your Profile',
            username: 'your-profile',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ];

        // Fetch friends (accepted friend relationships)
        const { data: friendsData } = await supabase
          .from('user_friends')
          .select(`
            friend_id,
            user_profiles!user_friends_friend_id_fkey (
              id,
              username,
              display_name,
              profile_photo_url
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .limit(10);

        if (friendsData) {
          friendsData.forEach((friendship: any) => {
            const profile = friendship.user_profiles;
            if (profile) {
              newStories.push({
                id: profile.id,
                type: 'friend',
                user: profile.display_name || profile.username || 'Friend',
                username: profile.username || profile.id,
                avatar: profile.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                hasStory: true,
              });
            }
          });
        }

        // Fetch suggested players (public profiles that aren't friends)
        const friendIds = friendsData?.map((f: any) => f.friend_id) || [];
        const excludeIds = [user.id, ...friendIds];

        const { data: suggestedData } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url')
          .eq('is_public', true)
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(5);

        if (suggestedData) {
          suggestedData.forEach((profile: any) => {
            newStories.push({
              id: profile.id,
              type: 'suggested',
              user: profile.display_name || profile.username || 'Player',
              username: profile.username || profile.id,
              avatar: profile.profile_photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
              hasStory: false, // Suggested players don't have stories yet
            });
          });
        }

        setStories(newStories);
      } catch (error) {
        console.error('Error fetching stories data:', error);
        // Fallback to static data on error
        setStories([
          {
            id: 'add',
            type: 'add',
            user: 'Your Profile',
            username: 'your-profile',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStoriesData();
  }, [user]);

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

  if (loading) {
    return (
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {/* Loading skeleton */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-1 min-w-0">
                <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center space-y-1 min-w-0">
              <div className="relative">
                {story.type === 'add' ? (
                  <button
                    type="button"
                    onClick={handleYourProfile}
                    aria-label="Create or view your profile"
                  >
                    <div className="w-16 h-16 bg-muted border-2 border-dashed border-amber-700 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Plus className="h-6 w-6 text-amber-700" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOtherProfile(story.username)}
                    aria-label={`View ${story.user}'s profile`}
                    className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full"
                  >
                    <div className={`w-16 h-16 rounded-full p-0.5 ${
                      story.hasStory 
                        ? 'bg-gradient-to-tr from-green-500 to-green-700' 
                        : story.type === 'suggested' 
                        ? 'bg-gradient-to-tr from-blue-500 to-blue-700' 
                        : ''
                    } hover:scale-105 transition-transform`}>
                      <img
                        src={story.avatar}
                        alt={story.user}
                        className="w-full h-full rounded-full object-cover border-2 border-background"
                      />
                    </div>
                  </button>
                )}
              </div>
              <span className="text-xs text-center text-muted-foreground max-w-16 truncate">
                {story.user}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryBar;
