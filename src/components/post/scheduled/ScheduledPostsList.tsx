// ScheduledPostsList - Dark glass theme matching ScheduleSheet
import React from 'react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Clock, Trash2, Calendar, Play, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { useScheduledPosts, ScheduledPost } from '@/hooks/useScheduledPosts';

interface ScheduledPostsListProps {
  isOpen: boolean;
  onClose: () => void;
  onEditPost?: (post: ScheduledPost) => void;
}

const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({
  isOpen,
  onClose,
  onEditPost,
}) => {
  const { scheduledPosts, isLoading, deletePost, publishNow, isDeleting, isPublishing } = useScheduledPosts();

  const handlePostNow = async (postId: string) => {
    await publishNow(postId);
  };

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
  };

  // Get the first media thumbnail
  const getThumbnail = (post: ScheduledPost): string | null => {
    if (!post.media || post.media.length === 0) return null;
    const firstMedia = post.media[0];
    return firstMedia.posterUrl || firstMedia.mediaUrl;
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent 
        className="max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-[10002]" 
        style={{ zIndex: 10002 }}
      >
        <VisuallyHidden>
          <DrawerTitle>Scheduled Posts</DrawerTitle>
          <DrawerDescription>Manage your scheduled posts</DrawerDescription>
        </VisuallyHidden>

        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-9 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Scheduled Posts</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
                {scheduledPosts.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">No scheduled posts</p>
                <p className="text-xs text-slate-500 mt-1">Schedule posts to publish later</p>
              </div>
            ) : (
              scheduledPosts.map((post) => {
                const scheduledDate = new Date(post.scheduledAt);
                const formattedDate = format(scheduledDate, 'MMM d, yyyy');
                const formattedTime = format(scheduledDate, 'h:mm a');
                const thumbnail = getThumbnail(post);

                return (
                  <div
                    key={post.id}
                    className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/8 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt="Post thumbnail"
                          className="w-14 h-14 rounded-xl object-cover bg-slate-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-slate-500" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Scheduled time badge */}
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formattedDate} at {formattedTime}</span>
                        </div>

                        {/* Caption */}
                        <p className="text-sm text-white line-clamp-2">
                          {post.content || "No caption"}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isDeleting}
                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-400/20 transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action buttons - Slate style, no orange */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePostNow(post.id)}
                        disabled={isPublishing}
                        className="px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/10 text-xs font-medium hover:bg-white/15 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        Post Now
                      </button>
                      {onEditPost && (
                        <button 
                          onClick={() => onEditPost(post)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-1.5"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ScheduledPostsList;
