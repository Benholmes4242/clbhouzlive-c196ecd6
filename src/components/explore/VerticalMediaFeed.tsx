import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minimize2, Heart, MessageCircle, Share, Volume2, VolumeX, MoreHorizontal, Edit, Trash2, MapPin, Check, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePostUpdate } from '@/hooks/usePostUpdate';
import { usePostData } from '@/hooks/usePostData';
import { ExploreContentItem } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import CoursePostBadge from '../posts/CoursePostBadge';
import EnhancedCreateMomentModal from '../post/EnhancedCreateMomentModal';
import TaggedText from '../posts/TaggedText';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import VideoPlayer from '@/components/ui/video-player';

interface VerticalMediaFeedProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem: ExploreContentItem;
  allContent: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
}

const VerticalMediaFeed: React.FC<VerticalMediaFeedProps> = ({
  isOpen,
  onClose,
  initialItem,
  allContent,
  onLike,
  onFollow
}) => {
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const { updatePost, isUpdating } = usePostUpdate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredContent, setFilteredContent] = useState<ExploreContentItem[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExploreContentItem | null>(null);
  const [editCourse, setEditCourse] = useState<any>(null);
  const queryClient = useQueryClient();

  // Check if current user follows the displayed user
  const { data: isFollowing, isLoading: isFollowingLoading } = useQuery({
    queryKey: ['user-follows', user?.id, filteredContent[currentIndex]?.user?.id],
    queryFn: async () => {
      if (!user?.id || !filteredContent[currentIndex]?.user?.id || user.id === filteredContent[currentIndex]?.user?.id) {
        return null; // Don't show follow button for own posts
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', filteredContent[currentIndex]?.user?.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!filteredContent[currentIndex]?.user?.id && user.id !== filteredContent[currentIndex]?.user?.id
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
      // Update the query cache
      queryClient.setQueryData(
        ['user-follows', user?.id, variables.targetUserId],
        variables.action === 'follow'
      );
    },
    onError: (error) => {
      console.error('Follow/unfollow error:', error);
    }
  });

  const handleFollowToggle = () => {
    const targetUserId = filteredContent[currentIndex]?.user?.id;
    if (!targetUserId || !user?.id || targetUserId === user.id) return;
    
    followMutation.mutate({
      targetUserId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  // Filter content by type and set initial index
  useEffect(() => {
    if (!isOpen || !initialItem) return;

    const mediaType = initialItem.type;
    const filtered = allContent.filter(item => item.type === mediaType);
    setFilteredContent(filtered);

    // Debug logging for golf course data
    console.log('VerticalMediaFeed - Filtered content with golf courses:', 
      filtered.map(item => ({ id: item.id, title: item.title, golfCourse: item.golfCourse }))
    );

    // Find the initial item's index in the filtered array
    const initialIndex = filtered.findIndex(item => item.id === initialItem.id);
    setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
  }, [isOpen, initialItem, allContent]);

  // Handle scroll to snap to items
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredContent.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, filteredContent.length]);

  // Auto-play/pause videos based on current index
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const index = parseInt(key);
      const video = videoRefs.current[index];
      
      if (video) {
        if (index === currentIndex) {
          // Play current video
          video.play().catch(console.error);
        } else {
          // Pause other videos
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current || !itemRefs.current[index]) return;

    const itemHeight = window.innerHeight;
    scrollViewRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

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
          if (currentIndex < filteredContent.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            scrollToIndex(newIndex);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentIndex, filteredContent.length, onClose]);

  // Scroll to initial item when modal opens
  useEffect(() => {
    if (isOpen && filteredContent.length > 0 && currentIndex >= 0) {
      setTimeout(() => scrollToIndex(currentIndex), 100);
    }
  }, [isOpen, filteredContent.length, currentIndex]);

  const handleLike = (item: ExploreContentItem) => {
    onLike(item.id);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share clicked');
  };

  const handleComment = () => {
    // Implement comment functionality
    console.log('Comment clicked');
  };

  const handleEdit = (item: ExploreContentItem) => {
    setEditingItem(item);
    setEditCourse(item.golfCourse || null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (data: {
    caption: string;
    files: File[];
    tags: any[];
    course?: any;
  }) => {
    if (!editingItem) return;
    
    const existingMediaUrls = [editingItem.src];
    const result = await updatePost(editingItem.id, data, existingMediaUrls);
    
    if (result.success) {
      // Update the local state to reflect changes immediately
      setFilteredContent(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, title: data.caption, golfCourse: data.course }
          : item
      ));
      
      // Close edit modal
      setEditModalOpen(false);
      setEditingItem(null);
      setEditCourse(null);
      
      // Close the main modal to return to the page the user was on
      onClose();
    }
  };

  const handleDelete = (item: ExploreContentItem) => {
    // Implement delete functionality
    console.log('Delete clicked for:', item.id);
  };

  if (!isOpen || filteredContent.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
    >
      {/* Scrollable Content */}
      <div
        ref={scrollViewRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 cursor-pointer hover:opacity-100 transition-opacity text-white opacity-90"
          aria-label="Close"
        >
          <Minimize2 className="h-8 w-8" />
        </button>

        {/* User Profile - Top Left */}
        <div className="absolute top-4 left-4 z-30 flex items-center space-x-3">
          {/* Profile Photo */}
          <div className="relative">
            <img
              src={filteredContent[currentIndex]?.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={filteredContent[currentIndex]?.user?.name || 'User'}
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
                {filteredContent[currentIndex]?.user?.name || 'Unknown User'}
              </span>
              {filteredContent[currentIndex]?.user?.username && (
                <span className="text-sm text-white/70" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  @{filteredContent[currentIndex]?.user?.username}
                </span>
              )}
            </div>
            
            {/* Follow pill - only show if not own post and user is logged in */}
            {user?.id && filteredContent[currentIndex]?.user?.id && user.id !== filteredContent[currentIndex]?.user?.id && (
              <button 
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || isFollowingLoading}
                className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {filteredContent.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            ref={(el) => {
              if (el) itemRefs.current[index] = el;
            }}
            className="relative w-full h-screen snap-start flex items-center justify-center"
          >
            {/* Media Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              {item.type === 'video' ? (
                <div className="relative w-full h-full">
                  <VideoPlayer
                    src={item.src}
                    autoplay={index === currentIndex}
                    muted={isMuted}
                    loop={true}
                    className="w-full h-full"
                    showVideoIcon={false}
                    showOverlayControls={false}
                    videoId={`vertical-${item.id}`}
                  />
                  
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Caption and Golf Course Tag - Bottom Left */}
            <div className="absolute bottom-5 left-3 right-20 z-20">
              {/* Golf Course Badge - Above Caption */}
              {item.golfCourse && (
                <div className="mb-2">
                  {isMobile ? (
                    // Mobile: Map pin that expands to show golf club name
                    <div className="flex items-center">
                      <button className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-2 transition-all duration-200">
                        <MapPin className="w-4 h-4 text-white" />
                      </button>
                      <div className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                        {item.golfCourse.name}
                      </div>
                    </div>
                  ) : (
                    // Desktop: Single pill with map pin and golf club name together
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
                  className="text-white text-base font-bold leading-[1.4]"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                >
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="text-base font-bold">
                      {removeGolfCourseFromContent(item.title)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Bottom Right */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-8">
              {/* Mute/Unmute toggle button - only show for video posts */}
              {item.type === 'video' && (
                <button 
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-8 h-8 text-white" />
                  ) : (
                    <Volume2 className="w-8 h-8 text-white" />
                  )}
                </button>
              )}

              {/* Heart Button */}
              <button
                onClick={() => handleLike(item)}
                className="cursor-pointer hover:opacity-100 transition-opacity"
              >
                <Heart className="h-8 w-8 text-white" />
              </button>

              {/* Message Button */}
              <button
                onClick={handleComment}
                className="cursor-pointer hover:opacity-100 transition-opacity"
              >
                <MessageCircle className="h-8 w-8 text-white" />
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="cursor-pointer hover:opacity-100 transition-opacity"
              >
                <Share className="h-8 w-8 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* Edit Modal */}
      <EnhancedCreateMomentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
          setEditCourse(null);
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={isUpdating}
        editMode={true}
        initialCaption={editingItem?.title || ''}
        existingMediaUrls={editingItem ? [editingItem.src] : []}
        selectedCourse={editCourse}
        onCourseSelect={setEditCourse}
      />

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

export default VerticalMediaFeed;