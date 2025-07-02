import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, Heart, MessageCircle, Share, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import HighQualityImage from '@/components/ui/high-quality-image';
import VideoPreview from './VideoPreview';
import CoursePostBadge from './CoursePostBadge';
import CommentsDrawer from './CommentsDrawer';
import { formatDistanceToNow } from 'date-fns';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface PostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
  post_tags?: any[];
  golfCourse?: {
    id: string;
    name: string;
    country: string;
    region?: string;
  };
}

interface PostViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPost: PostData;
  allUserPosts: PostData[];
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const PostViewerModal: React.FC<PostViewerModalProps> = ({
  isOpen,
  onClose,
  initialPost,
  allUserPosts,
  onNavigate
}) => {
  const isMobile = useIsMobile();
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Find initial post index
  useEffect(() => {
    const index = allUserPosts.findIndex(post => post.id === initialPost.id);
    setCurrentPostIndex(index >= 0 ? index : 0);
  }, [initialPost.id, allUserPosts]);

  const currentPost = allUserPosts[currentPostIndex] || initialPost;
  const displayName = currentPost.user.display_name || currentPost.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(currentPost.created_at), { addSuffix: true });

  const navigatePost = useCallback((direction: 'prev' | 'next') => {
    let newIndex = currentPostIndex;
    
    if (direction === 'next' && currentPostIndex < allUserPosts.length - 1) {
      newIndex = currentPostIndex + 1;
      setIsAtEnd(false);
    } else if (direction === 'prev' && currentPostIndex > 0) {
      newIndex = currentPostIndex - 1;
      setIsAtEnd(false);
    } else if (direction === 'next' && currentPostIndex === allUserPosts.length - 1) {
      setIsAtEnd(true);
      setTimeout(() => setIsAtEnd(false), 2000);
      return;
    }
    
    setCurrentPostIndex(newIndex);
    setCurrentMediaIndex(0);
    onNavigate?.(direction);
  }, [currentPostIndex, allUserPosts.length, onNavigate]);

  const navigateMedia = useCallback((direction: 'prev' | 'next') => {
    const mediaCount = currentPost.post_media?.length || 0;
    if (mediaCount <= 1) return;

    if (direction === 'next' && currentMediaIndex < mediaCount - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    } else if (direction === 'prev' && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  }, [currentMediaIndex, currentPost.post_media]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigatePost('next'),
    onSwipedRight: () => navigatePost('prev'),
    onSwipedUp: () => isMobile && setShowComments(true),
    preventScrollOnSwipe: true,
    trackMouse: !isMobile,
  });

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'ArrowLeft') navigatePost('prev');
    if (e.key === 'ArrowRight') navigatePost('next');
    if (e.key === 'Escape') onClose();
  }, [isOpen, navigatePost, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const currentMedia = currentPost.post_media?.[currentMediaIndex];
  const hasMultipleMedia = (currentPost.post_media?.length || 0) > 1;
  const hasMultiplePosts = allUserPosts.length > 1;

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className={`${
            isMobile 
              ? 'fixed inset-0 w-screen h-screen max-w-none m-0 p-0 rounded-none' 
              : 'max-w-6xl w-full h-[90vh] p-0'
          } bg-background border-0 shadow-2xl`}
          {...swipeHandlers}
        >
          {isMobile ? (
            // Mobile Layout - Full Screen
            <div className="flex flex-col h-full bg-black">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-background">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-3">
                  <HighQualityImage
                    src={currentPost.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={displayName}
                    className="w-8 h-8 rounded-full"
                    width={32}
                    height={32}
                  />
                  <span className="font-semibold text-sm">{displayName}</span>
                </div>
                <div className="w-10" />
              </div>

              {/* Media Content */}
              <div className="flex-1 relative bg-black">
                {currentMedia && (
                  <>
                    {currentMedia.media_type === 'video' ? (
                      <VideoPreview
                        src={currentMedia.media_url}
                        className="w-full h-full object-contain"
                        videoId={`post-viewer-${currentPost.id}-${currentMediaIndex}`}
                      />
                    ) : (
                      <HighQualityImage
                        src={currentMedia.media_url}
                        alt="Post content"
                        className="w-full h-full object-contain"
                      />
                    )}
                    
                    {/* Golf Course Badge */}
                    {currentPost.golfCourse && (
                      <div className="absolute top-4 right-4 z-10">
                        <CoursePostBadge 
                          course={currentPost.golfCourse}
                          className="m-0"
                        />
                      </div>
                    )}

                    {/* Media Navigation Dots */}
                    {hasMultipleMedia && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {currentPost.post_media.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* End of posts indicator */}
                {isAtEnd && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">You've reached the end</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" className="hover:text-red-500">
                      <Heart className="h-5 w-5 mr-1" />
                      Like
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowComments(true)}
                    >
                      <MessageCircle className="h-5 w-5 mr-1" />
                      Comment
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-5 w-5 mr-1" />
                      Share
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>
                
                {currentPost.content && (
                  <p className="text-sm">{currentPost.content}</p>
                )}
              </div>
            </div>
          ) : (
            // Desktop Layout - Instagram Style
            <div className="flex h-full rounded-lg overflow-hidden">
              {/* Left Side - Media */}
              <div className="flex-1 bg-black relative">
                {currentMedia && (
                  <>
                    {currentMedia.media_type === 'video' ? (
                      <VideoPreview
                        src={currentMedia.media_url}
                        className="w-full h-full object-contain"
                        videoId={`post-viewer-desktop-${currentPost.id}-${currentMediaIndex}`}
                      />
                    ) : (
                      <HighQualityImage
                        src={currentMedia.media_url}
                        alt="Post content"
                        className="w-full h-full object-contain"
                      />
                    )}

                    {/* Golf Course Badge */}
                    {currentPost.golfCourse && (
                      <div className="absolute top-4 right-4 z-10">
                        <CoursePostBadge 
                          course={currentPost.golfCourse}
                          className="m-0"
                        />
                      </div>
                    )}

                    {/* Media Navigation */}
                    {hasMultipleMedia && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-muted text-white hover:text-foreground"
                          onClick={() => navigateMedia('prev')}
                          disabled={currentMediaIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-muted text-white hover:text-foreground"
                          onClick={() => navigateMedia('next')}
                          disabled={currentMediaIndex === currentPost.post_media.length - 1}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </>
                )}

                {/* Post Navigation */}
                {hasMultiplePosts && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 bottom-4 bg-black/50 hover:bg-muted text-white hover:text-foreground"
                      onClick={() => navigatePost('prev')}
                      disabled={currentPostIndex === 0}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 bottom-4 bg-black/50 hover:bg-muted text-white hover:text-foreground"
                      onClick={() => navigatePost('next')}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Right Side - Comments & Info */}
              <div className="w-96 bg-background border-l flex flex-col">
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <HighQualityImage
                        src={currentPost.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt={displayName}
                        className="w-10 h-10 rounded-full"
                        width={40}
                        height={40}
                      />
                      <div>
                        <p className="font-semibold text-sm">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                  
                  {currentPost.content && (
                    <p className="text-sm mt-3">{currentPost.content}</p>
                  )}
                </div>

                {/* Comments Area */}
                <div className="flex-1 p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Comments coming soon...
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" className="hover:text-red-500">
                        <Heart className="h-5 w-5 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-5 w-5 mr-1" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share className="h-5 w-5 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile Comments Drawer */}
      {isMobile && (
        <CommentsDrawer
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          postId={currentPost.id}
        />
      )}
    </>
  );
};

export default PostViewerModal;