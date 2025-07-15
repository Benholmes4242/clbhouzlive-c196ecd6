import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useClubhouseFeed } from '@/hooks/useClubhouseFeed';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useVideoPlaybackManager, useFullscreenVideoModal } from '@/hooks/useVideoPlaybackManager';
import { ChevronLeft, ChevronRight, Maximize2, Play } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import FeedVideoPlayer from '@/components/feed/FeedVideoPlayer';
import FullscreenVideoModal from '@/components/ui/fullscreen-video-modal';
import { useNavigate } from 'react-router-dom';

const ClubhouseFeed = () => {
  const { user } = useSupabaseSession();
  const { 
    posts, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch
  } = useClubhouseFeed();
  
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{[key: string]: number}>({});
  const navigate = useNavigate();
  const modalManager = useFullscreenVideoModal();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();

  // Media navigation handlers
  const handlePrevMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) - 1)
    }));
  };

  const handleNextMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.min(mediaLength - 1, (prev[postId] || 0) + 1)
    }));
  };

  const handleMaximizeClick = (post: any) => {
    const media = post.post_media[0];
    modalManager.openModal({
      src: media.media_url,
      user: {
        id: post.user.id,
        profile_photo_url: post.user.profile_photo_url || undefined,
        display_name: post.user.display_name || undefined,
        username: post.user.username || undefined
      },
      content: post.content
    });
  };

  // Infinite scroll implementation
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Listen for post completion events
  useEffect(() => {
    const handlePostCompleted = () => {
      setTimeout(() => {
        refetch();
      }, 1000);
    };

    window.addEventListener('postCompleted', handlePostCompleted);
    window.addEventListener('postUploadCompleted', handlePostCompleted);
    
    return () => {
      window.removeEventListener('postCompleted', handlePostCompleted);
      window.removeEventListener('postUploadCompleted', handlePostCompleted);
    };
  }, [refetch]);

  // Generate card types based on Pinterest style
  const getCardType = (index: number) => {
    const cardTypes = [
      'aspect-[2/3]',       // Tall portrait cards (2:3)
      'aspect-[4/5]',       // Medium cards (4:5) - most common
      'aspect-square',      // Short/square cards
    ];
    
    const random = (index * 7) % 10; // Pseudo-random but consistent
    if (random < 5) return cardTypes[1]; // 50% medium cards
    if (random < 8) return cardTypes[0]; // 30% tall cards  
    return cardTypes[2]; // 20% square cards
  };

  const renderMediaTile = (post: any, index: number) => {
    const media = post.post_media;
    const currentIndex = currentMediaIndex[post.id] || 0;
    const hasMultipleMedia = media.length > 1;
    
    // Video playback management
    const hasVideo = media.some((m: any) => m.media_type === 'video');
    const { videoRef, containerRef, isPlaying, shouldShowPlayIcon, togglePlayPause } = useVideoPlaybackManager({
      section: 'feed',
      videoId: post.id,
      autoplayAllowed: hasVideo,
      priority: -index
    });

    const aspectRatio = getCardType(index);
    const displayName = post.user.display_name || post.user.username;

    const handleTileClick = () => {
      handleMaximizeClick(post);
    };

    const handlePlayButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      togglePlayPause();
    };

    const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (post.user.username) {
        navigate(`/profile/${post.user.username}`);
      }
    };

    return (
      <div key={post.id} ref={containerRef} className="mosaic-tile group relative overflow-hidden rounded-xl bg-card">
        {/* Media Container */}
        <div className={`relative w-full overflow-hidden ${aspectRatio}`} onClick={handleTileClick}>
          {hasMultipleMedia ? (
            // Carousel for multiple media
            <div className="relative w-full h-full">
              <div 
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {media.map((mediaItem: any, index: number) => (
                  <div key={index} className="flex-shrink-0 w-full h-full">
                     {mediaItem.media_type === 'video' ? (
                       <FeedVideoPlayer
                         ref={index === currentIndex && hasVideo ? videoRef : undefined}
                         src={mediaItem.media_url}
                         className="w-full h-full object-cover rounded-xl"
                         muted={true}
                         loop={true}
                         playsInline
                         preload={index === currentIndex ? "metadata" : "none"}
                         onClick={handleTileClick}
                       />
                     ) : (
                       <img
                         src={mediaItem.media_url}
                         alt="Golf content"
                         className="w-full h-full object-cover rounded-xl"
                         loading="lazy"
                       />
                     )}
                  </div>
                ))}
              </div>
              
              {/* Carousel Navigation */}
              {media.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevMedia(post.id, media.length); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNextMedia(post.id, media.length); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    disabled={currentIndex === media.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                    {media.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Single media
            <div className="w-full h-full">
               {media[0]?.media_type === 'video' ? (
                 <FeedVideoPlayer
                   ref={videoRef}
                   src={media[0].media_url}
                   className="w-full h-full object-cover rounded-xl"
                   muted={true}
                   loop={true}
                   playsInline
                   preload="metadata"
                   onClick={handleTileClick}
                 />
               ) : (
                 <img
                   src={media[0]?.media_url}
                   alt="Golf content"
                   className="w-full h-full object-cover rounded-xl"
                   loading="lazy"
                 />
              )}
            </div>
          )}
          
          {/* Play button - top left (shows when video is paused) */}
          {hasVideo && shouldShowPlayIcon && (
            <div className="absolute top-2 left-2 z-20">
              <button 
                onClick={handlePlayButtonClick}
                className="rounded-full p-2 text-white bg-black/50 hover:bg-black/70 transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Maximize button - top right */}
          <div className="absolute top-2 right-2 z-20">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMaximizeClick(post);
              }}
              className="rounded-full p-2 text-white hover:bg-white/20 transition-colors opacity-100 hover:opacity-100 bg-black/30"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0">
                  <div className="flex items-end gap-2 mb-1">
                    <img
                      src={post.user.profile_photo_url || '/placeholder.svg'}
                      alt={displayName || 'User'}
                      className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80"
                      onClick={handleProfileClick}
                    />
                    <p 
                      className="text-white font-bold text-base truncate cursor-pointer hover:opacity-80"
                      onClick={handleProfileClick}
                    >
                      {displayName}
                    </p>
                  </div>
                   {post.content && (
                     <div className="text-white/90 text-sm mt-1">
                       <div className="line-clamp-2">{post.content}</div>
                     </div>
                   )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-3 mb-1">
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiHandsClapping className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <GoCommentDiscussion className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiShareFat className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-20">
        <div className="mosaic-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="mosaic-tile bg-muted rounded-xl animate-pulse">
              <div className="aspect-[3/4] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-4 pb-20">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            No posts from followed users yet
          </p>
          <p className="text-muted-foreground text-sm">
            Follow other users to see their posts in your clubhouse feed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20">
      {/* Mosaic Grid */}
      <div className="mosaic-grid">
        {posts.map((post, index) => {
          const isLastPost = index === posts.length - 1;
          
          return (
            <div
              key={post.id}
              ref={isLastPost ? lastPostElementRef : null}
            >
              {renderMediaTile(post, index)}
            </div>
          );
        })}
      </div>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm mt-2">Loading more posts...</p>
        </div>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-4" />

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        isOpen={modalManager.isOpen}
        onClose={modalManager.closeModal}
        videoData={modalManager.videoData}
      />
    </div>
  );
};

export default ClubhouseFeed;