import React, { useState, useRef, useEffect } from 'react';
import { Check, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { supabase } from '@/integrations/supabase/client';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';

interface SuggestedUsersProps {
  onUserFollow: (userId: string) => void;
}

const SuggestedUsers: React.FC<SuggestedUsersProps> = ({ onUserFollow }) => {
  const { users, loading } = useSuggestedUsers();
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleExpand = (userId: string) => {
    if (isExpanding) return;
    setIsExpanding(true);
    setExpandedCard(userId);
    setTimeout(() => setIsExpanding(false), 260); // Animation duration + buffer
  };

  const handleCollapse = () => {
    if (isExpanding) return;
    setIsExpanding(true);
    setExpandedCard(null);
    setTimeout(() => setIsExpanding(false), 260);
  };

  const handleFollow = async (userId: string) => {
    // Cancel expansion if in progress
    if (expandedCard === userId) {
      handleCollapse();
    }
    
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

  const handleDislike = (userId: string) => {
    // Remove from available suggestions
    setFollowedUsers(prev => new Set([...prev, userId]));
    if (expandedCard === userId) {
      handleCollapse();
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
          {availableUsers.map((user, index) => {
            const isExpanded = expandedCard === user.id;
            
            return (
              <div
                key={user.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(user.id, el);
                  else cardRefs.current.delete(user.id);
                }}
                className={cn(
                  "flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden relative transition-all duration-300 ease-out",
                  isExpanded 
                    ? "w-64 h-80" 
                    : "w-32 h-48"
                )}
              >
                {/* Video/Image Content */}
                <div className={cn(
                  "w-full relative bg-gray-100 transition-all duration-300 ease-out",
                  isExpanded ? "h-48" : "h-32"
                )}>
                  {user.lastPortraitVideo ? (
                    <EnhancedVideoPlayer
                      src={user.lastPortraitVideo}
                      autoplay={true}
                      muted={true}
                      loop={true}
                      className="w-full h-full object-cover"
                      objectFit="cover"
                      hideControls={true}
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

                {/* Control Rail - Edge Contained */}
                <div 
                  className={cn(
                    "absolute left-0 right-0 z-10 px-3 transition-all duration-220 ease-out",
                    isExpanded 
                      ? "top-3" 
                      : "bottom-3"
                  )}
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {/* Dislike Button */}
                    <button
                      onClick={() => handleDislike(user.id)}
                      className={cn(
                        "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center",
                        "bg-background/20 backdrop-blur-sm border border-white/20",
                        "shadow-sm transition-all duration-150",
                        "hover:bg-background/30 hover:scale-105",
                        "active:scale-95 active:bg-background/40",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                      )}
                      aria-label="Not interested"
                    >
                      <ThumbsDown className="w-4 h-4 text-foreground/80" />
                    </button>

                    {/* Details Button */}
                    <button
                      onClick={() => isExpanded ? handleCollapse() : handleExpand(user.id)}
                      className={cn(
                        "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center",
                        "bg-background/20 backdrop-blur-sm border border-white/20",
                        "shadow-sm transition-all duration-150",
                        "hover:bg-background/30 hover:scale-105",
                        "active:scale-95 active:bg-background/40",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
                      )}
                      aria-label={isExpanded ? "Hide details" : "Show details"}
                    >
                      <MoreHorizontal className={cn(
                        "w-4 h-4 text-foreground/80 transition-transform duration-150",
                        isExpanded && "rotate-90"
                      )} />
                    </button>

                    {/* Like/Follow Button */}
                    <button
                      onClick={() => handleFollow(user.id)}
                      disabled={followingInProgress.has(user.id)}
                      className={cn(
                        "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center",
                        "bg-primary/20 backdrop-blur-sm border border-primary/30",
                        "shadow-sm transition-all duration-150",
                        "hover:bg-primary/30 hover:scale-105 hover:shadow-lg hover:shadow-primary/25",
                        "active:scale-95 active:bg-primary/40",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
                        followingInProgress.has(user.id) && "opacity-50 cursor-not-allowed"
                      )}
                      aria-label="Follow user"
                    >
                      <ThumbsUp className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>

                {/* Maximized Content Panel */}
                {isExpanded && (
                  <div className="absolute inset-0 top-16 bg-background/90 backdrop-blur-md border-t border-border/20 rounded-b-xl">
                    <div className="p-4 space-y-1.5 text-center">
                      {/* Avatar */}
                      <div 
                        className="flex justify-center animate-fade-in"
                        style={{ animationDelay: '20ms' }}
                      >
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                          {user.profileImage ? (
                            <img 
                              src={user.profileImage} 
                              alt={user.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-muted-foreground">
                              {user.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display Name */}
                      <div 
                        className="animate-fade-in"
                        style={{ animationDelay: '40ms' }}
                      >
                        <h4 className="text-sm font-bold text-foreground leading-tight">
                          {user.displayName}
                        </h4>
                      </div>

                      {/* Handle */}
                      <div 
                        className="animate-fade-in"
                        style={{ animationDelay: '60ms' }}
                      >
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>

                      {/* Home Club */}
                      <div 
                        className="animate-fade-in"
                        style={{ animationDelay: '80ms' }}
                      >
                        <p className="text-xs text-muted-foreground truncate">
                          {user.bio || 'Golf enthusiast'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimized User Info (only when not expanded) */}
                {!isExpanded && (
                  <div className="p-2 pb-16 flex flex-col justify-between h-16">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {user.displayName}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {user.username}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsers;