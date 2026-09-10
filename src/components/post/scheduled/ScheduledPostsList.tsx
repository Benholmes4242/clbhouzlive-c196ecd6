// ScheduledPostsList - Dark glass theme matching ScheduleSheet
import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Clock, Trash2, Calendar, Play, Pencil } from 'lucide-react';
import { formatMonthDayYearShort, formatTimeHm } from '@/i18n/format';
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
    /* BRIEF_SHEET_BACK_BEHAVIOUR §1a — primitive swap, vaul -> BottomSheet.
       CONTRADICTION REPORTED, BRIEF WINS ON THE PRIMITIVE: this sheet was
       written in LIGHT chrome (#F8FAFC canvas, #1e293b ink). BottomSheet owns
       the canonical dark surface and paints it after caller styles, so "keep
       the content untouched" and the background canon cannot both hold. The
       structure and copy are untouched; only the colour literals are remapped
       onto the dark scale so the ink stays legible. Its own 10px handle is
       gone — BottomSheet draws the canonical 36x4 grabber. */
    <BottomSheet open={isOpen} onClose={onClose} zIndexBase={10001}>
        <div className="flex flex-col h-full max-h-[85dvh]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[#F2F4F7]">Scheduled Posts</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#20242E] text-[rgba(242,244,247,0.55)] text-xs font-medium border border-white/10">
                {scheduledPosts.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-white/10 border-t-[#F2F4F7] rounded-full animate-spin" />
              </div>
            ) : scheduledPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-12 h-12 text-[rgba(242,244,247,0.38)] mb-3" />
                <p className="text-[rgba(242,244,247,0.55)]">No scheduled posts</p>
                <p className="text-xs text-[rgba(242,244,247,0.38)] mt-1">Schedule posts to publish later</p>
              </div>
            ) : (
              scheduledPosts.map((post) => {
                const scheduledDate = new Date(post.scheduledAt);
                const formattedDate = formatMonthDayYearShort(scheduledDate);
                const formattedTime = formatTimeHm(scheduledDate);

                const thumbnail = getThumbnail(post);

                return (
                  <div
                    key={post.id}
                    className="p-3 bg-[#1B1E27] rounded-2xl border border-white/10 space-y-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt="Post thumbnail"
                          className="w-14 h-14 rounded-xl object-cover bg-[#20242E] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[#20242E] flex-shrink-0 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-[rgba(242,244,247,0.38)]" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Scheduled time badge */}
                        <div className="flex items-center gap-1.5 text-[rgba(242,244,247,0.55)] text-xs font-medium mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formattedDate} at {formattedTime}</span>
                        </div>

                        {/* Caption */}
                        <p className="text-sm text-[#F2F4F7] line-clamp-2">
                          {post.content || "No caption"}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isDeleting}
                        className="w-8 h-8 rounded-xl bg-[#20242E] border border-white/10 flex items-center justify-center text-[rgba(242,244,247,0.38)] hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePostNow(post.id)}
                        disabled={isPublishing}
                        className="px-3 py-1.5 rounded-xl bg-[#F7931E] text-[#15171F] text-xs font-medium hover:bg-[#FFB45A] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        Post Now
                      </button>
                      {onEditPost && (
                        <button 
                          onClick={() => onEditPost(post)}
                          className="px-3 py-1.5 rounded-xl bg-[#20242E] text-[#F2F4F7] border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-1.5"
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
    </BottomSheet>
  );
};

export default ScheduledPostsList;
