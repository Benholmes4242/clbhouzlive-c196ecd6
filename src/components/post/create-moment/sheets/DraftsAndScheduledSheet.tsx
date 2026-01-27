// DraftsAndScheduledSheet - Combined bottom sheet with tabs for Drafts and Scheduled Posts
// Polished iOS-style design with proper height, drag handle, and refined cards

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow, format } from 'date-fns';
import { Trash2, FileText, AlertCircle, Clock, Calendar, Play, Pencil, Save, Image as ImageIcon } from 'lucide-react';
import { useDrafts } from '@/hooks/useDrafts';
import { useScheduledPosts, ScheduledPost } from '@/hooks/useScheduledPosts';
import type { DraftWithMedia } from '@/services/drafts';
import { cn } from '@/lib/utils';

interface DraftsAndScheduledSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: DraftWithMedia) => void;
  onEditScheduledPost?: (post: ScheduledPost) => void;
  onSaveDraft?: () => void;
  canSaveDraft?: boolean;
  defaultTab?: 'drafts' | 'scheduled';
}

export default function DraftsAndScheduledSheet({ 
  isOpen, 
  onClose, 
  onLoadDraft,
  onEditScheduledPost,
  onSaveDraft,
  canSaveDraft = false,
  defaultTab = 'drafts'
}: DraftsAndScheduledSheetProps) {
  const [activeTab, setActiveTab] = useState<'drafts' | 'scheduled'>(defaultTab);
  
  // Drafts state
  const { drafts, isLoading: isDraftsLoading, deleteDraft, deleteAllDrafts, isDeleting, maxDrafts } = useDrafts();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  
  // Scheduled posts state
  const { scheduledPosts, isLoading: isScheduledLoading, deletePost, publishNow, isDeleting: isScheduledDeleting, isPublishing } = useScheduledPosts();

  // Reset to default tab when sheet opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleLoadDraft = (draft: DraftWithMedia) => {
    onLoadDraft(draft);
    onClose();
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
    setConfirmDeleteId(null);
  };

  const handleDeleteAll = async () => {
    await deleteAllDrafts();
    setShowDeleteAllConfirm(false);
    onClose();
  };

  const handlePostNow = async (postId: string) => {
    await publishNow(postId);
  };

  const handleDeleteScheduled = async (postId: string) => {
    await deletePost(postId);
  };

  const getActorLabel = (actorType: string) => {
    switch (actorType) {
      case 'business':
        return 'Business';
      default:
        return 'Personal';
    }
  };

  const getThumbnail = (post: ScheduledPost): string | null => {
    if (!post.media || post.media.length === 0) return null;
    const firstMedia = post.media[0];
    return firstMedia.posterUrl || firstMedia.mediaUrl;
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent 
        className="min-h-[50vh] max-h-[85vh] bg-background border-t border-border rounded-t-3xl z-[10002]" 
        style={{ zIndex: 10002 }}
      >
        <VisuallyHidden>
          <DrawerTitle>Drafts & Scheduled</DrawerTitle>
          <DrawerDescription>Manage your drafts and scheduled posts</DrawerDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          
          {/* Header with tabs */}
          <div className="px-4 pb-0">
            <div className="flex gap-6 border-b border-border">
              <button
                onClick={() => setActiveTab('drafts')}
                className={cn(
                  "pb-3 text-base font-medium transition-colors relative",
                  activeTab === 'drafts' 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                Drafts
                {drafts.length > 0 && (
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    {drafts.length}
                  </span>
                )}
                {activeTab === 'drafts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('scheduled')}
                className={cn(
                  "pb-3 text-base font-medium transition-colors relative",
                  activeTab === 'scheduled' 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                Scheduled
                {scheduledPosts.length > 0 && (
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    {scheduledPosts.length}
                  </span>
                )}
                {activeTab === 'scheduled' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
                )}
              </button>
              
              {/* Actions moved inline */}
              <div className="ml-auto flex items-center gap-2 pb-3">
                {activeTab === 'drafts' && onSaveDraft && canSaveDraft && (
                  <button
                    onClick={onSaveDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
                {activeTab === 'drafts' && drafts.length > 1 && (
                  <button
                    onClick={() => setShowDeleteAllConfirm(true)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-red-500 text-sm font-medium hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {activeTab === 'drafts' ? (
              // Drafts content
              isDraftsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                </div>
              ) : drafts.length === 0 ? (
                <DraftsEmptyState />
              ) : (
                <div className="space-y-3 px-4">
                  {drafts.map((draft) => (
                    <DraftItem
                      key={draft.id}
                      draft={draft}
                      isConfirmingDelete={confirmDeleteId === draft.id}
                      isDeleting={isDeleting}
                      onLoad={() => handleLoadDraft(draft)}
                      onDelete={() => handleDeleteDraft(draft.id)}
                      onConfirmDelete={() => setConfirmDeleteId(draft.id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                      getActorLabel={getActorLabel}
                    />
                  ))}
                </div>
              )
            ) : (
              // Scheduled posts content
              isScheduledLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                </div>
              ) : scheduledPosts.length === 0 ? (
                <ScheduledEmptyState />
              ) : (
                <div className="space-y-3 px-4">
                  {scheduledPosts.map((post) => (
                    <ScheduledItem
                      key={post.id}
                      post={post}
                      thumbnail={getThumbnail(post)}
                      isDeleting={isScheduledDeleting}
                      isPublishing={isPublishing}
                      onPostNow={() => handlePostNow(post.id)}
                      onDelete={() => handleDeleteScheduled(post.id)}
                      onEdit={onEditScheduledPost ? () => onEditScheduledPost(post) : undefined}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Delete All Confirmation Overlay */}
          <AnimatePresence>
            {showDeleteAllConfirm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/98 backdrop-blur-xl p-6 rounded-t-3xl"
              >
                <AlertCircle size={40} className="text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Delete all drafts?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  This will permanently delete {drafts.length} draft{drafts.length !== 1 ? 's' : ''}.
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button
                    onClick={() => setShowDeleteAllConfirm(false)}
                    className="px-6 py-2.5 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Safe area padding */}
          <div className="pb-safe" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Empty state for Drafts tab
function DraftsEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No drafts yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-[240px]">
        Save posts as drafts to finish them later
      </p>
    </div>
  );
}

// Empty state for Scheduled tab
function ScheduledEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No scheduled posts
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-[240px]">
        Schedule posts to publish later at the perfect time
      </p>
    </div>
  );
}

// Draft item card component
interface DraftItemProps {
  draft: DraftWithMedia;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  getActorLabel: (actorType: string) => string;
}

function DraftItem({
  draft,
  isConfirmingDelete,
  isDeleting,
  onLoad,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  getActorLabel,
}: DraftItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="relative"
    >
      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {isConfirmingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/95 backdrop-blur-sm rounded-2xl"
          >
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onCancelDelete}
              className="px-4 py-2 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-center gap-3 active:bg-muted/50 transition-colors cursor-pointer"
        onClick={onLoad}
      >
        {/* Thumbnail - 16x16 rounded */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {draft.media && draft.media.length > 0 ? (
            <div className="relative w-full h-full">
              <img
                src={draft.media[0].posterUrl || draft.media[0].mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              {draft.media.length > 1 && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/70 text-white rounded">
                  +{draft.media.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {draft.content || <span className="text-muted-foreground italic">No caption</span>}
          </p>
          <p className="text-sm text-muted-foreground">
            {getActorLabel(draft.actorType)} · {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
          </p>
          {draft.categories && draft.categories.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {draft.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfirmDelete();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          aria-label="Delete draft"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

// Scheduled post item component
interface ScheduledItemProps {
  post: ScheduledPost;
  thumbnail: string | null;
  isDeleting: boolean;
  isPublishing: boolean;
  onPostNow: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

function ScheduledItem({
  post,
  thumbnail,
  isDeleting,
  isPublishing,
  onPostNow,
  onDelete,
  onEdit,
}: ScheduledItemProps) {
  const scheduledDate = new Date(post.scheduledAt);
  const formattedDate = format(scheduledDate, 'MMM d, yyyy');
  const formattedTime = format(scheduledDate, 'h:mm a');

  return (
    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Scheduled time badge */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate} at {formattedTime}</span>
          </div>

          {/* Caption */}
          <p className="text-sm text-foreground line-clamp-2">
            {post.content || "No caption"}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50"
          aria-label="Delete scheduled post"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onPostNow}
          disabled={isPublishing}
          className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Play className="w-3 h-3" />
          Post Now
        </button>
        {onEdit && (
          <button 
            onClick={onEdit}
            className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center gap-1.5"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
