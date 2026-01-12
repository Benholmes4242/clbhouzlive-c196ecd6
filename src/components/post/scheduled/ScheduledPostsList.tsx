import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Edit2, Trash2, Play, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ScheduledPostsListProps {
  isOpen: boolean;
  onClose: () => void;
  onEditPost?: (postId: string) => void;
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
    reschedule, 
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

  // Get first media thumbnail
  const getThumbnail = (post: typeof scheduledPosts[0]) => {
    if (post.media.length === 0) return null;
    const first = post.media[0];
    return first.posterUrl || first.mediaUrl;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Scheduled Posts
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : scheduledPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-foreground mb-1">No scheduled posts</h3>
              <p className="text-sm text-muted-foreground">
                Schedule posts to publish automatically at a specific time
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <ul className="divide-y divide-border">
                {scheduledPosts.map((post) => {
                  const thumbnail = getThumbnail(post);
                  
                  return (
                    <motion.li
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex items-start gap-3 p-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Clock className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2 mb-1">
                          {post.content || 'No caption'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {format(new Date(post.scheduledAt), 'MMM d, yyyy')} at{' '}
                            {format(new Date(post.scheduledAt), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-xs text-primary mt-0.5">
                          {formatDistanceToNow(new Date(post.scheduledAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-full hover:bg-muted transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handlePublishNow(post.id)}
                            disabled={isPublishing}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Post Now
                          </DropdownMenuItem>
                          {onEditPost && (
                            <DropdownMenuItem onClick={() => onEditPost(post.id)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(post.id)}
                            disabled={isDeleting}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.li>
                  );
                })}
              </ul>
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ScheduledPostsList;
