import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { supabase } from '@/integrations/supabase/client';

interface SuggestedUsersProps {
  onUserFollow: (userId: string) => void;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ onUserFollow }) => {
  const { users, loading } = useSuggestedUsers();
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

  // Filter out already followed users
  const availableUsers = users.filter(user => !followedUsers.has(user.id));

  if (loading) {
    return (
      <div className="px-4 pt-1 pb-8">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Suggested for you</h3>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
            {/* Loading skeletons */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-28 bg-white rounded-lg border border-gray-200 p-3 text-center animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
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
    <div className="px-4 pt-1 pb-8">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Suggested for you</h3>
        </div>

        {/* Horizontal Scrollable User Cards */}
        <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-2">
          {availableUsers.map((user) => (
            <div
              key={user.id}
              className="flex-shrink-0 w-28 bg-white rounded-lg border border-gray-200 p-3 text-center"
            >
              {/* Profile Image */}
              <div className="relative mb-2">
                <img
                  src={user.profileImage}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-full mx-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=100&h=100&fit=crop&crop=face';
                  }}
                />
                {user.isVerified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-900 truncate mb-1">
                  {user.displayName}
                </h4>
                <p className="text-xs text-gray-500 truncate mb-2">
                  {user.username}
                </p>
                <span className="text-xs text-gray-400">
                  {formatFollowers(user.followersCount)} followers
                </span>
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleFollow(user.id)}
                disabled={followingInProgress.has(user.id)}
                className={cn(
                  "text-black text-xs font-medium transition-colors duration-150",
                  followingInProgress.has(user.id) 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "hover:text-gray-700"
                )}
              >
                {followingInProgress.has(user.id) ? 'Following...' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsers;
