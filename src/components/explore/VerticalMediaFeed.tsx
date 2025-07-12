import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Minimize2, Heart, MessageCircle, Share, Volume2, VolumeX, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostUpdate } from '@/hooks/usePostUpdate';
import { usePostData } from '@/hooks/usePostData';
import { ExploreContentItem } from './types';

import CoursePostBadge from '../posts/CoursePostBadge';
import EnhancedCreateMomentModal from '../post/EnhancedCreateMomentModal';
import TaggedText from '../posts/TaggedText';
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

  // Filter content by type and set initial index
  useEffect(() => {
    if (!isOpen || !initialItem) return;

    const mediaType = initialItem.type;
    const filtered = allContent.filter(item => item.type === mediaType);
    setFilteredContent(filtered);

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

        {filteredContent.map((item, index) => (
          <div
            key={item.id}
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
                  
                  {/* Golf Course Badge */}
                  {item.golfCourse && (
                    <div className="absolute top-4 right-8 z-10">
                      <CoursePostBadge 
                        course={{
                          id: item.golfCourse.id,
                          name: item.golfCourse.name,
                          country: item.golfCourse.country
                        }}
                      />
                    </div>
                  )}
                  
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
                  
                  {/* Golf Course Badge */}
                  {item.golfCourse && (
                    <div className="absolute top-4 right-8 z-10">
                      <CoursePostBadge 
                        course={{
                          id: item.golfCourse.id,
                          name: item.golfCourse.name,
                          country: item.golfCourse.country
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info & Caption - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-10 max-w-[60%]">
              {item.user && (
                <div className="flex items-center space-x-3 mb-2">
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-8 h-8 rounded-full border border-white/50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                  <div>
                    <div className="text-white font-semibold text-sm flex items-center">
                      {item.user.name}
                    </div>
                  </div>
                </div>
              )}
              
              {item.title && (
                <div className="text-white text-sm leading-relaxed bg-black/30 p-2 rounded">
                  <TaggedText 
                    text={item.title} 
                    tags={[]} 
                  />
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