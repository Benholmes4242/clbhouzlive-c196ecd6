import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowLeft, Heart, MessageCircle, Share, ChevronLeft, ChevronRight, X, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import HighQualityImage from '@/components/ui/high-quality-image';
import VideoPreview from './VideoPreview';
import CoursePostBadge from './CoursePostBadge';
import CommentsDrawer from './CommentsDrawer';
import EnhancedCreateMomentModal from '../post/EnhancedCreateMomentModal';
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
  const { user } = useSupabaseSession();
  const isMobile = useIsMobile();
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);

  // Find initial post index
  useEffect(() => {
    const index = allUserPosts.findIndex(post => post.id === initialPost.id);
    setCurrentPostIndex(index >= 0 ? index : 0);
  }, [initialPost.id, allUserPosts]);

  const currentPost = allUserPosts[currentPostIndex] || initialPost;
  const displayName = currentPost.user.display_name || currentPost.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(currentPost.created_at), { addSuffix: true });

  // Extract golf course from either golfCourse field or post_tags
  const getGolfCourse = () => {
    if (currentPost.golfCourse) {
      return currentPost.golfCourse;
    }
    
    // Look for golf course in post_tags - handle both formats
    const golfCourseTag = currentPost.post_tags?.find(tag => {
      // Handle the format from profile activity posts
      if (tag.entity_type === 'golf_club') {
        return true;
      }
      // Handle the format from other sources
      if (tag.tagged_entity?.entity_type === 'golf_club') {
        return true;
      }
      return false;
    });
    
    if (golfCourseTag) {
      // Profile activity format
      if (golfCourseTag.entity_type === 'golf_club') {
        return {
          id: golfCourseTag.entity_id,
          name: golfCourseTag.name,
          country: '',
          region: ''
        };
      }
      // Other format
      if (golfCourseTag.tagged_entity) {
        return {
          id: golfCourseTag.tagged_entity.entity_id,
          name: golfCourseTag.tagged_entity.name,
          country: '',
          region: ''
        };
      }
    }
    
    return null;
  };

  const golfCourse = getGolfCourse();

  const handleEdit = (post: PostData) => {
    setEditCourse(golfCourse);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (data: {
    caption: string;
    files: File[];
    tags: any[];
    course?: any;
  }) => {
    setIsEditSubmitting(true);
    try {
      // TODO: Implement actual post update logic here
      console.log('Updating post:', currentPost.id, data);
      
      // Close modal after successful update
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = (post: PostData) => {
    // Implement delete functionality
    console.log('Delete clicked for:', post.id);
  };

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
      {isMobile ? (
        // Mobile Layout - Optimized for mobile viewport
        isOpen && (
          <div className="fixed inset-0 w-full bg-black z-50 overflow-hidden" 
               style={{ height: '100vh', maxHeight: '90vh' }}
               {...swipeHandlers}>
            {/* Close Button - Top Left */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Media Content - Centered Full Screen */}
            <div className="w-full h-full flex items-center justify-center">
              {currentMedia && (
                <>
                  {currentMedia.media_type === 'video' ? (
                    <VideoPreview
                      src={currentMedia.media_url}
                      className="w-full h-full object-contain"
                      videoId={`post-viewer-mobile-${currentPost.id}-${currentMediaIndex}`}
                    />
                  ) : (
                    <HighQualityImage
                      src={currentMedia.media_url}
                      alt="Post content"
                      className="w-full h-full object-contain"
                    />
                  )}
                </>
              )}
            </div>

            {/* Golf Course Badge - Top Right */}
            {golfCourse && (
              <div className="absolute top-4 right-4 z-10">
                <CoursePostBadge 
                  course={golfCourse}
                  className="m-0"
                />
              </div>
            )}

            {/* Media Navigation Dots - Bottom Center */}
            {hasMultipleMedia && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                {currentPost.post_media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* User Info & Caption - Bottom Left */}
            <div className="absolute bottom-4 left-4 z-10 max-w-[60%]">
              <div className="flex items-center space-x-3 mb-2">
                <HighQualityImage
                  src={currentPost.user.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                  alt={displayName}
                  className="w-8 h-8 rounded-full border border-white/50"
                  width={32}
                  height={32}
                />
                <div>
                  <div className="text-white font-semibold text-sm">
                    {displayName}
                  </div>
                  <div className="text-white/70 text-xs">
                    {timeAgo}
                  </div>
                </div>
              </div>
              
              {currentPost.content && (
                <p className="text-white text-sm leading-relaxed bg-black/30 p-2 rounded max-w-full">
                  {currentPost.content}
                </p>
              )}
            </div>

            {/* Action Buttons - Right Side */}
            <div className="absolute right-4 bottom-20 z-10 flex flex-col space-y-4">
              {/* Like Button */}
              <button className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform">
                <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-full">
                  <Heart className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">0</span>
              </button>

              {/* Comment Button */}
              <button 
                onClick={() => setShowComments(true)}
                className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-full">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">0</span>
              </button>

              {/* Share Button */}
              <button className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform">
                <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-full">
                  <Share className="h-6 w-6" />
                </div>
              </button>

              {/* More Options Button - Only show for own posts */}
              {user && currentPost.user.id === user.id && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform">
                      <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-full">
                        <MoreHorizontal className="h-6 w-6" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48 bg-background border shadow-lg z-[100]"
                    sideOffset={8}
                  >
                    <DropdownMenuItem 
                      onClick={() => handleEdit(currentPost)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(currentPost)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Post Navigation - Bottom Edge (for multiple posts) */}
            {hasMultiplePosts && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
                <button
                  onClick={() => navigatePost('prev')}
                  disabled={currentPostIndex === 0}
                  className="flex items-center justify-center w-8 h-8 bg-black/50 rounded-full text-white disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigatePost('next')}
                  disabled={currentPostIndex === allUserPosts.length - 1}
                  className="flex items-center justify-center w-8 h-8 bg-black/50 rounded-full text-white disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* End of posts indicator */}
            {isAtEnd && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                <div className="bg-background rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">You've reached the end</p>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        // Desktop Layout - Instagram Style
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-background border-0 shadow-2xl">
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
                    {golfCourse && (
                      <div className="absolute top-4 right-4 z-10">
                        <CoursePostBadge 
                          course={golfCourse}
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
                    
                    {/* More Options - Only show for own posts */}
                    {user && currentPost.user.id === user.id && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48 bg-background border shadow-lg z-[100]"
                          sideOffset={8}
                        >
                          <DropdownMenuItem 
                            onClick={() => handleEdit(currentPost)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(currentPost)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Comments Drawer */}
      {isMobile && (
        <CommentsDrawer
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          postId={currentPost.id}
        />
      )}

      {/* Edit Modal */}
      <EnhancedCreateMomentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditCourse(null);
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={isEditSubmitting}
        editMode={true}
        initialCaption={currentPost.content || ''}
        existingMediaUrls={currentPost.post_media?.map(m => m.media_url) || []}
        selectedCourse={editCourse}
        onCourseSelect={setEditCourse}
      />
    </>
  );
};

export default PostViewerModal;