import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Edit2, Trash2, Play, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduledPosts, type ScheduledPost } from '@/hooks/useScheduledPosts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface ScheduledPostsListProps {
  isOpen: boolean;
  onClose: () => void;
  onEditPost?: (post: ScheduledPost) => void;
}

export const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({
  isOpen,
  onClose,
  onEditPost,
}) => {
  const { 
    scheduledPosts, 
    isLoading, 
    publishNow, 
    deletePost,
    isPublishing,
    isDeleting 
  } = useScheduledPosts();

  const handlePublishNow = async (postId: string) => {
    try {
      await publishNow(postId);
      toast.success('Post published!');
    } catch (error) {
      toast.error('Failed to publish post');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success('Scheduled post deleted');
    } catch (error) {
      toast.error('Failed to delete scheduled post');
    }
  };

  const handleEdit = (post: ScheduledPost) => {
    onClose();
    // Small delay to let sheet close animation complete
    setTimeout(() => {
      onEditPost?.(post);
    }, 150);
  };

  // Get first media thumbnail
  const getThumbnail = (post: ScheduledPost) => {
    if (post.media.length === 0) return null;
    const first = post.media[0];
    return first.posterUrl || first.mediaUrl;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0 bg-slate-900 border-t border-slate-700">
        <SheetHeader className="px-4 py-3 border-b border-slate-700">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-amber-500" />
            Scheduled Posts
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full pb-20 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : scheduledPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="font-semibold text-white mb-1">No scheduled posts</h3>
              <p className="text-sm text-slate-400">
                Schedule posts to publish automatically at a specific time
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {scheduledPosts.map((post) => {
                  const thumbnail = getThumbnail(post);
                  
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg bg-slate-700 overflow-hidden flex-shrink-0">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white line-clamp-1 mb-1">
                            {post.content || 'No caption'}
                          </p>
                          
                          {/* Scheduled time - prominent */}
                          <div className="flex items-center gap-1.5 text-amber-500 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {format(new Date(post.scheduledAt), 'MMM d, yyyy')} at{' '}
                              {format(new Date(post.scheduledAt), 'h:mm a')}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDistanceToNow(new Date(post.scheduledAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          disabled={isPublishing}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 inline mr-1" />
                          Post Now
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={isDeleting}
                          className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ScheduledPostsList;