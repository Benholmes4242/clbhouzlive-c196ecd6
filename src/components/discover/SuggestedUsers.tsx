import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestedUsersDiscover } from '@/hooks/useSuggestedUsersDiscover';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedVideoPlayer } from '@/media';

interface SuggestedUsersProps {
  onUserFollow: (userId: string) => void;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ onUserFollow }) => {
  const { users, loading } = useSuggestedUsersDiscover();
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  const handleFollow = async (userId: string) => {
    // Don't allow multiple follow attempts for the same user
    if (followingInProgress.has(userId)) return;
    
    setFollowingInProgress(prev => new Set([...prev, userId]));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Only create follow relationship for real users (not mock users)
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.isReal) {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) {
          console.error('Error following user:', error);
          return;
        }
      }

      // Update local state
      setFollowedUsers(prev => new Set([...prev, userId]));
      onUserFollow(userId);
      
    } catch (error) {
      console.error('Error in handleFollow:', error);
    } finally {
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Golf placeholder images for users without videos
  const golfPlaceholders = [
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=600&fit=crop&crop=center'
  ];

  // Filter out already followed users
  const availableUsers = users.filter(user => !followedUsers.has(user.id));

  if (loading) {
    return (
      <div className="px-4 pt-1 pb-3">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Suggested for you</h3>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
            {/* Loading skeletons */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-32 h-48 bg-white rounded-xl border border-gray-200 animate-pulse">
                <div className="w-full h-32 bg-gray-200 rounded-t-xl mb-2"></div>
                <div className="px-2 pb-2">
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (availableUsers.length === 0) {
    return null; // Hide section when no more suggestions
  }

  return (
    <div className="px-4 pt-1 pb-3">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Suggested for you</h3>
        </div>

        {/* Horizontal Scrollable Video Cards */}
        <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
          {availableUsers.map((user, index) => (
            <div
              key={user.id}
              className="flex-shrink-0 w-32 h-48 bg-white rounded-xl border border-gray-200 overflow-hidden relative"
            >
              {/* Video/Image Content */}
              <div className="w-full h-32 relative bg-gray-100">
                {user.lastPortraitVideo ? (
                  <UnifiedVideoPlayer
                    src={user.lastPortraitVideo}
                    autoplay={true}
                    muted={true}
                    loop={true}
                    className="w-full h-full"
                    objectFit="cover"
                  />
                ) : (
                  <img
                    src={golfPlaceholders[index % golfPlaceholders.length]}
                    alt="Golf content"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Verified badge overlay */}
                {user.isVerified && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="p-2 flex flex-col justify-between h-16">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {user.displayName}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {user.username}
                  </p>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(user.id)}
                  disabled={followingInProgress.has(user.id)}
                  className={cn(
                    "w-full py-1 px-2 text-xs font-medium rounded-md transition-colors duration-150",
                    followingInProgress.has(user.id) 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-black text-white hover:bg-gray-800"
                  )}
                >
                  {followingInProgress.has(user.id) ? 'Following...' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsers;