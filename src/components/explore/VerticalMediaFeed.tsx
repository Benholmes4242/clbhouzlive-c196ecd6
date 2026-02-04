import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Minimize2, Heart, MessageCircle, Share, Volume2, VolumeX, MoreHorizontal, Edit, Trash2, MapPin, Check, UserPlus, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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
// import CreateMomentModal from '../post/CreateMomentModal'; // Temporarily removed
import TaggedText from '../posts/TaggedText';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import UnifiedVideoPlayer from '@/media/components/UnifiedVideoPlayer';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import SoundtrackStrip from '@/components/studio/SoundtrackStrip';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';

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
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredContent, setFilteredContent] = useState<ExploreContentItem[]>([]);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement }>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExploreContentItem | null>(null);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
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

  // Helper function to truncate text to 9 words
  const truncateToWords = (text: string, wordLimit: number = 9) => {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  // Filter content by type and set initial index - prevent flickering
  useEffect(() => {
    if (!isOpen || !initialItem) return;

    const mediaType = initialItem.type;
    const filtered = allContent.filter(item => item.type === mediaType);
    
    // Find the initial item's index BEFORE setting filtered content
    const initialIndex = filtered.findIndex(item => 
      item.id === initialItem.id && item.src === initialItem.src
    );
    
    console.log('VerticalMediaFeed - Exact item match:', {
      clickedId: initialItem.id,
      clickedSrc: initialItem.src,
      foundIndex: initialIndex,
      totalFiltered: filtered.length,
      matchedItem: initialIndex >= 0 ? filtered[initialIndex] : null
    });
    
    // Set both filtered content and current index together
    setFilteredContent(filtered);
    setCurrentIndex(initialIndex >= 0 ? initialIndex : 0);
  }, [isOpen, initialItem, allContent]);

  // Handle scroll positioning after content is set and components are mounted
  useEffect(() => {
    if (isOpen && filteredContent.length > 0 && scrollViewRef.current) {
      // Small delay to ensure video components are mounted
      const timeoutId = setTimeout(() => {
        if (scrollViewRef.current) {
          const itemHeight = window.innerHeight;
          // Ensure perfect alignment to show only the clicked post
          scrollViewRef.current.scrollTop = currentIndex * itemHeight;
          
          // Force immediate scroll behavior without smooth scrolling
          scrollViewRef.current.style.scrollBehavior = 'auto';
          scrollViewRef.current.scrollTo({
            top: currentIndex * itemHeight,
            behavior: 'auto'
          });
        }
      }, 50); // Reduced delay for faster positioning
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, filteredContent.length, currentIndex]);

  // Handle scroll to snap to items with improved smoothness
  const handleScroll = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollTop = scrollViewRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredContent.length) {
      setCurrentIndex(newIndex);
      // Note: MediaRuntime handles video pause/play automatically via intersection observers
    }
  }, [currentIndex, filteredContent.length]);

  // Auto-play/pause videos based on current index - simplified approach
  useEffect(() => {
    // Let the VideoPlayer component handle autoplay based on the autoplay prop
    // This removes the manual video ref management which was causing issues
  }, [currentIndex]);

  // Mute/unmute videos based on current index to prevent overlapping audio
  useEffect(() => {
    if (filteredContent.length === 0) return;

    // Pause all videos that are not the current one
    filteredContent.forEach((item, index) => {
      if (item.type === 'video' && index !== currentIndex) {
        const videoElements = document.querySelectorAll(`[data-video-id="vertical-${item.id}"]`);
        videoElements.forEach((videoEl) => {
          const video = videoEl as HTMLVideoElement;
          if (video && !video.paused) {
            video.pause();
          }
        });
      }
    });
  }, [currentIndex, filteredContent]);

  // Scroll to specific index with precise positioning
  const scrollToIndex = (index: number) => {
    if (!scrollViewRef.current) return;

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

  // Remove redundant scroll logic - now handled immediately in the filter effect

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
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
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
          
          {/* Display Name Only - Never show username */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-semibold text-base text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                {filteredContent[currentIndex]?.user?.name || 'Golfer'}
              </span>
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

        {filteredContent.map((item, index) => {
          // Get media array for this item
          const mediaItems = item.media && item.media.length > 0 ? item.media : [{
            id: `${item.id}-single`,
            media_type: item.type as 'video' | 'image',
            media_url: item.src
          }];
          
          const currentMediaIndex = mediaIndices[item.id] || 0;
          const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
           const hasMultipleMedia = mediaItems.length > 1;
           
          // Check if this post has music attached
          const studioEdits = (currentMedia as any)?.studio_edits;
          const musicData = studioEdits?.music;
          const postHasMusic = !!(musicData?.url || musicData?.r2Key);
          const audioMode = studioEdits?.audioMode || 'original';
          const shouldMuteVideoForMusic = audioMode === 'music_only' && postHasMusic;
          const videoMuted = isGloballyMuted || shouldMuteVideoForMusic;
          
          // Get filter class for current media
          const filterId = (currentMedia as any)?.filter_id || studioEdits?.filter;
          const filterClass = getFilterClass(filterId);

           // Navigation handlers for this specific item
           const handlePrevMedia = (e?: React.MouseEvent) => {
             e?.stopPropagation();
             setMediaIndices(prev => ({
               ...prev,
               [item.id]: currentMediaIndex > 0 ? currentMediaIndex - 1 : mediaItems.length - 1
             }));
           };

           const handleNextMedia = (e?: React.MouseEvent) => {
             e?.stopPropagation();
             setMediaIndices(prev => ({
               ...prev,
               [item.id]: currentMediaIndex < mediaItems.length - 1 ? currentMediaIndex + 1 : 0
             }));
           };

            // Touch handlers for media navigation
            const createTouchHandlers = () => {
              let startX = 0;
              let startY = 0;
              
              return {
                onTouchStart: (e: any) => {
                  startX = e.touches[0].clientX;
                  startY = e.touches[0].clientY;
                },
                onTouchEnd: (e: any) => {
                  if (!startX || !startY) return;
                  
                  const endX = e.changedTouches[0].clientX;
                  const endY = e.changedTouches[0].clientY;
                  const diffX = startX - endX;
                  const diffY = startY - endY;
                  
                  // Only handle horizontal swipes (ignore vertical scrolling)
                  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    e.preventDefault();
                    if (diffX > 0 && hasMultipleMedia) {
                      // Swiped left - next media
                      handleNextMedia();
                    } else if (diffX < 0 && hasMultipleMedia) {
                      // Swiped right - previous media
                      handlePrevMedia();
                    }
                  }
                  
                  startX = 0;
                  startY = 0;
                }
              };
            };

            const touchHandlers = hasMultipleMedia ? createTouchHandlers() : {};

           return (
             <div
               key={`${item.id}-${index}`}
               ref={(el) => {
                 if (el) itemRefs.current[index] = el;
               }}
               className="relative w-full h-screen snap-start snap-always flex items-center justify-center"
               style={{ 
                 minHeight: '100vh', 
                 maxHeight: '100vh',
                 scrollSnapAlign: 'start',
                 scrollSnapStop: 'always'
               }}
               {...touchHandlers}
             >
               {/* Media Content */}
               <div 
                 className="relative w-full h-full flex items-center justify-center"
                 onMouseEnter={() => setIsTextExpanded(true)}
                 onMouseLeave={() => setIsTextExpanded(false)}
                >
                  {currentMedia.media_type === 'video' ? (
                  <div className="relative w-full h-full bg-media-loading">
                     <UnifiedVideoPlayer
                       src={currentMedia.media_url}
                       autoplay={index === currentIndex}
                       muted={videoMuted}
                       loop={true}
                       className={cn("w-full h-full", filterClass)}
                       objectFit="contain"
                       surface="fullscreen"
                     />
                     
                     {/* Music player for posts with music */}
                     {postHasMusic && musicData && index === currentIndex && (
                       <div className="absolute bottom-20 left-4 z-40 max-w-[200px]">
                         <SoundtrackStrip
                           music={{
                             trackId: musicData.trackId || '',
                             title: musicData.title || 'Unknown Track',
                             artist: musicData.artist,
                             r2Key: musicData.r2Key,
                             url: musicData.url,
                             startAt: musicData.startAt,
                             volume: musicData.volume
                           }}
                           variant="published"
                         />
                       </div>
                     )}
                     {/* Text overlays from studio_edits */}
                     {studioEdits?.textOverlays?.length > 0 && (
                       <TextOverlayRenderer
                         textOverlays={studioEdits.textOverlays}
                         isEditable={false}
                       />
                     )}
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-media-loading">
                    <img
                      src={currentMedia.media_url}
                      alt={item.title}
                      className={cn("w-full h-full object-contain", filterClass)}
                      loading="eager" // Always load media to prevent grey placeholders
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=400&fit=crop&crop=center';
                      }}
                    />
                    
                    {/* Text overlays from studio_edits */}
                    {studioEdits?.textOverlays?.length > 0 && (
                      <TextOverlayRenderer
                        textOverlays={studioEdits.textOverlays}
                        isEditable={false}
                      />
                    )}
                  </div>
                )}

                {/* Navigation Dots - Bottom Center */}
                {hasMultipleMedia && (
                  <MediaNavigationDots
                    mediaCount={mediaItems.length}
                    currentIndex={currentMediaIndex}
                  />
                )}

                {/* Desktop Navigation Arrows */}
                {hasMultipleMedia && !isMobile && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={handlePrevMedia}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:scale-110 transition-all duration-200"
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="h-8 w-8 drop-shadow-lg" />
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={handleNextMedia}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:scale-110 transition-all duration-200"
                      aria-label="Next media"
                    >
                      <ChevronRight className="h-8 w-8 drop-shadow-lg" />
                    </button>
                  </>
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
                      <button className="w-6 h-6 rounded-sq-xs bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mr-2 transition-all duration-200 hover:bg-white/30">
                        <MapPin className="w-4 h-4 text-white" />
                      </button>
                      <div className="rounded-sq-xs bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium px-2 py-1 shadow-lg whitespace-nowrap">
                        {item.golfCourse.name}
                      </div>
                    </div>
                  ) : (
                    // Desktop: Single pill with map pin and golf club name together
                    <div className="inline-flex items-center rounded-sq-xs bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium px-3 py-1.5 shadow-lg whitespace-nowrap">
                      <MapPin className="w-5 h-5 text-white mr-2" />
                      {item.golfCourse.name}
                    </div>
                  )}
                </div>
              )}

              {/* Caption Text */}
              {item.title && removeGolfCourseFromContent(item.title) && (
                <div 
                  className="text-white text-body-lg font-semibold leading-relaxed cursor-default"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                >
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isTextExpanded 
                        ? 'whitespace-normal' 
                        : 'whitespace-normal'
                    }`}
                  >
                    <span className="text-body-lg font-semibold">
                      {isTextExpanded 
                        ? removeGolfCourseFromContent(item.title)
                        : truncateToWords(removeGolfCourseFromContent(item.title), 9)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Bottom Right */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-8">
              {/* Mute/Unmute toggle button - only show for video posts */}
              {currentMedia.media_type === 'video' && (
                <button 
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setGlobalMute(!isGloballyMuted)}
                >
                  {isGloballyMuted ? (
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

              {/* Three dots menu - only show for own posts */}
              {user && item.user?.id === user.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer hover:opacity-100 transition-opacity p-0 h-auto w-auto bg-transparent border-0"
                      onClick={() => {
                         console.log('🚨 THREE DOTS CLICKED IN VERTICAL FEED!', {
                           itemId: item.id,
                           userId: item.user?.id,
                           currentUserId: user?.id,
                           isOwnPost: item.user?.id === user?.id
                         });
                      }}
                    >
                      <MoreHorizontal className="h-8 w-8 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-44 rounded-xl shadow-xl border border-white/10 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm z-[1000000] overflow-hidden"
                    sideOffset={8}
                  >
                    <DropdownMenuItem 
                      onClick={() => {
                        console.log('🚨 EDIT CLICKED IN VERTICAL FEED!');
                        // TODO: Implement edit functionality
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer focus:bg-black/5 dark:focus:bg-white/10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        console.log('🚨 DELETE CLICKED IN VERTICAL FEED!');
                        // TODO: Implement delete functionality
                        const confirmed = window.confirm('Are you sure you want to delete this post?');
                        if (confirmed) {
                          console.log('Delete confirmed for post:', item.id);
                          // Add delete API call here
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
      </div>


      {/* Edit Modal - Temporarily disabled */}
      {/* TODO: Re-implement edit functionality with correct modal component */}

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