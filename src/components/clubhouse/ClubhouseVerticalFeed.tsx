// ClubhouseVerticalFeed - Audio control system implemented
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, MapPin, UserPlus, UserCheck, Loader2, Volume2, VolumeX } from 'lucide-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { RiShareForward2Fill } from 'react-icons/ri';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExploreContentItem } from '@/components/explore/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';

import ManagedVideoPlayer from './ManagedVideoPlayer';
import PostComments from './PostComments';

interface ClubhouseVerticalFeedProps {
  posts: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onScroll?: (scrollDirection: 'up' | 'down') => void;
}

const ClubhouseVerticalFeed: React.FC<ClubhouseVerticalFeedProps> = ({
  posts,
  onLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onScroll
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  const queryClient = useQueryClient();

  // Audio control state - always starts muted
  const [isGloballyMuted, setIsGloballyMuted] = useState(() => {
    // Always start muted, but check session storage for preference
    const savedPreference = sessionStorage.getItem('clubhouse-audio-preference');
    return savedPreference !== 'unmuted';
  });

  // Check if current user follows the displayed user
  const { data: isFollowing, isLoading: isFollowingLoading } = useQuery({
    queryKey: ['user-follows', user?.id, posts[currentIndex]?.user?.id],
    queryFn: async () => {
      if (!user?.id || !posts[currentIndex]?.user?.id || user.id === posts[currentIndex]?.user?.id) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', posts[currentIndex]?.user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id
  });

  // Check which posts the user has liked
  const { data: likedPosts } = useQuery({
    queryKey: ['post-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const postIds = posts.map(post => post.id);
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      if (error) {
        console.error('Error fetching liked posts:', error);
        return [];
      }
      
      return data.map(like => like.post_id);
    },
    enabled: !!user?.id && posts.length > 0
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: string; action: 'follow' | 'unfollow' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'follow') {
        const { data, error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['user-follows', user?.id, variables.targetUserId],
        variables.action === 'follow'
      );
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
    }
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      if (action === 'like') {
        const { data, error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      // Update the liked posts cache
      queryClient.setQueryData(['post-likes', user?.id], (oldData: string[] | undefined) => {
        if (!oldData) return variables.action === 'like' ? [variables.postId] : [];
        
        if (variables.action === 'like') {
          return [...oldData, variables.postId];
        } else {
          return oldData.filter(id => id !== variables.postId);
        }
      });
    },
    onError: (error) => {
      console.error('Like/unlike error:', error);
    }
  });

  const handleFollowToggle = () => {
    const targetUserId = posts[currentIndex]?.user?.id;
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    
    followMutation.mutate({
      targetUserId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  const handleLike = (postId: string) => {
    if (!user?.id) return;
    
    const isLiked = likedPosts?.includes(postId);
    likeMutation.mutate({
      postId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  // Helper function to truncate text to 9 words
  const truncateToWords = (text: string, wordLimit: number = 9) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Track previous scroll position for direction detection
  const prevScrollTopRef = useRef(0);

  // Handle scroll to snap to items
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const scrollDirection = scrollTop > prevScrollTopRef.current ? 'down' : 'up';
    
    const itemHeight = window.innerHeight - 64; // Match the calc(100vh - 64px)
    const newIndex = Math.round(scrollTop / itemHeight);
    
    // Call parent onScroll callback for header visibility - only show when at first post
    if (onScroll) {
      // Header should only be visible when at the first post (index 0)
      if (newIndex === 0) {
        onScroll('down'); // Show header
      } else {
        onScroll('up'); // Hide header
      }
    }
    
    prevScrollTopRef.current = scrollTop;
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);
      
      // Load more posts when near the end
      if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    }
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore, onScroll]);

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current) return;

    const itemHeight = window.innerHeight - 64; // Match the calc(100vh - 64px)
    scrollViewRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < posts.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
            
            // Load more if near end
            if (newIndex >= posts.length - 3 && hasMore && !isLoadingMore) {
              onLoadMore();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length, hasMore, isLoadingMore, onLoadMore]);



  const handleShare = () => {
    console.log('Share clicked');
  };

  const handleComment = () => {
    console.log('Comment clicked');
  };

  // Audio toggle handler
  const handleAudioToggle = useCallback(() => {
    const newMutedState = !isGloballyMuted;
    setIsGloballyMuted(newMutedState);
    
    // Persist preference in session storage
    sessionStorage.setItem('clubhouse-audio-preference', newMutedState ? 'muted' : 'unmuted');
  }, [isGloballyMuted]);

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 z-10 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#f7931e' }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 bg-black overflow-hidden">
      {/* Scrollable Content */}
      <div
        ref={scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {/* User Profile - Top Left - Hidden for first post to avoid header interference */}
        {currentIndex !== 0 && (
          <div className="absolute top-4 left-4 z-30 flex items-center space-x-3">
            {/* Profile Photo */}
            <div className="relative">
              <img
                src={posts[currentIndex]?.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={posts[currentIndex]?.user?.name || 'User'}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                }}
              />
            </div>
            
            {/* Username */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-semibold text-base text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  {posts[currentIndex]?.user?.name || 'Unknown User'}
                </span>
                {posts[currentIndex]?.user?.username && (
                  <span className="text-sm text-white/70" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    @{posts[currentIndex]?.user?.username}
                  </span>
                )}
              </div>
              
              {/* Follow pill - only show if not own post and user is logged in */}
              {user?.id && posts[currentIndex]?.user?.id && user.id !== posts[currentIndex]?.user?.id && (
                <button 
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || isFollowingLoading}
                  className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {posts.map((item, index) => {
          // Get media array for this item
          const mediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
          const hasMultipleMedia = mediaItems.length > 1;

          // Navigation handlers for this specific item
          const handlePrevMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1
            }));
          };

          const handleNextMedia = (e: React.MouseEvent) => {
            e.stopPropagation();
            setMediaIndices(prev => ({
              ...prev,
              [item.id]: currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0
            }));
          };

          return (
            <div
              key={`${item.id}-${index}`}
              ref={(el) => {
                if (el) itemRefs.current[index] = el;
              }}
              className="relative w-full snap-start snap-always flex items-center justify-center"
              style={{ 
                height: 'calc(100vh - 64px)', // Just the nav bar height (h-16 = 64px)
                minHeight: 'calc(100vh - 64px)',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always'
              }}
            >
              {/* Media Content */}
              <div 
                className="relative w-full h-full flex items-center justify-center"
                onMouseEnter={() => setIsTextExpanded(true)}
                onMouseLeave={() => setIsTextExpanded(false)}
              >
                {currentMedia.media_type === 'video' ? (
                  <ManagedVideoPlayer
                    id={`${item.id}-${currentMediaIndex}`}
                    src={currentMedia.media_url}
                    className="w-full h-full"
                    disableAudio={false} // Always enable audio management
                    isInView={index === currentIndex && !isGloballyMuted}
                  />
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <img
                      src={currentMedia.media_url}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
                      }}
                    />
                  </div>
                )}

                {/* Navigation Dots - Bottom Center */}
                {hasMultipleMedia && (
                  <MediaNavigationDots
                    mediaCount={mediaItems.length}
                    currentIndex={currentMediaIndex}
                  />
                )}
              </div>

              {/* Caption and Golf Course Tag - Bottom Left */}
              <div className="absolute bottom-8 left-3 right-20 z-20">
                {/* Golf Course Badge - Above Caption */}
                {item.golfCourse && (
                  <div className="mb-2">
                     {isMobile ? (
                       <div className="inline-flex items-center bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                         <MapPin className="w-4 h-4 text-white mr-2" />
                         {item.golfCourse.name}
                       </div>
                     ) : (
                       <div className="inline-flex items-center bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                         <MapPin className="w-5 h-5 text-white mr-2" />
                         {item.golfCourse.name}
                       </div>
                     )}
                  </div>
                )}

                {/* Caption Text */}
                {item.title && removeGolfCourseFromContent(item.title) && (
                  <div 
                    className="text-white text-base font-bold leading-[1.4] cursor-default"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                  >
                    <div className="transition-all duration-300 ease-in-out whitespace-normal">
                      <span className="text-base font-bold">
                        {isTextExpanded 
                          ? removeGolfCourseFromContent(item.title)
                          : truncateToWords(removeGolfCourseFromContent(item.title), 9)
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="mt-4">
                  <PostComments 
                    postId={item.id} 
                    totalComments={Math.floor(Math.random() * 50) + 5} // Mock comment count between 5-54
                  />
                </div>
              </div>

              {/* Action Buttons - Bottom Right */}
              <div className="absolute bottom-10 right-4 z-10 flex flex-col space-y-6">
                {/* Audio Toggle Button - Above Heart */}
                {currentMedia.media_type === 'video' && (
                  <div className="flex flex-col items-center">
                    <button
                      onClick={handleAudioToggle}
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                    >
                      {isGloballyMuted ? (
                        <VolumeX className="h-8 w-8 text-white" />
                      ) : (
                        <Volume2 className="h-8 w-8 text-white" />
                      )}
                    </button>
                  </div>
                )}

                {/* Heart Button with Like Count */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleLike(item.id)}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    disabled={likeMutation.isPending}
                  >
                    {likedPosts?.includes(item.id) ? (
                      <FaHeart className="h-8 w-8 text-red-500" />
                    ) : (
                      <FaRegHeart className="h-8 w-8 text-white" />
                    )}
                  </button>
                  <span className="text-white text-sm font-medium mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {Math.floor(Math.random() * 1000) + 10}
                  </span>
                </div>

                {/* Message Button with Comment Count */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleComment}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  >
                    <MessageCircle className="h-8 w-8 text-white" />
                  </button>
                  <span className="text-white text-sm font-medium mt-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {Math.floor(Math.random() * 50) + 5}
                  </span>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                >
                  <RiShareForward2Fill className="h-8 w-8 text-white" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Loading indicator at the bottom */}
        {isLoadingMore && (
          <div className="h-screen flex items-center justify-center">
            <div className="text-white/70">Loading more posts...</div>
          </div>
        )}
      </div>

      <style>{`
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .snap-y {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .snap-y::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default ClubhouseVerticalFeed;