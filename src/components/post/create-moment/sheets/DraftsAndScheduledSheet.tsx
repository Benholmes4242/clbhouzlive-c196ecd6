// DraftsAndScheduledSheet - Combined bottom sheet with tabs for Drafts and Scheduled Posts
// A* polished: theme tokens, badge consistency, staggered animations, contextual actions

import React, { useState, useEffect } from 'react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow, format } from 'date-fns';
import { Trash2, FileText, AlertCircle, Clock, Calendar, Play, Pencil, Save, Image as ImageIcon, X } from 'lucide-react';
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
  /** When set, shows an overwrite confirmation overlay before loading this draft */
  pendingOverwriteDraft?: DraftWithMedia | null;
  onConfirmOverwrite?: () => void;
  onCancelOverwrite?: () => void;
}

export default function DraftsAndScheduledSheet({ 
  isOpen, 
  onClose, 
  onLoadDraft,
  onEditScheduledPost,
  onSaveDraft,
  canSaveDraft = false,
  defaultTab = 'drafts',
  pendingOverwriteDraft,
  onConfirmOverwrite,
  onCancelOverwrite,
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
    analyticsEvents.track('draft_deleted', {});
  };

  const handleDeleteAll = async () => {
    await deleteAllDrafts();
    setShowDeleteAllConfirm(false);
    analyticsEvents.track('draft_all_deleted', { count: drafts.length });
    onClose();
  };

  const handlePostNow = async (postId: string) => {
    await publishNow(postId);
    analyticsEvents.track('scheduled_post_published_now', {});
  };

  const handleDeleteScheduled = async (postId: string) => {
    await deletePost(postId);
    analyticsEvents.track('scheduled_post_deleted', {});
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
        className="light min-h-[50vh] max-h-[85vh] bg-background border-t border-border rounded-t-3xl z-[10002]" 
        style={{ zIndex: 10002 }}
      >
        <VisuallyHidden>
          <DrawerDescription>Manage your drafts and scheduled posts</DrawerDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header with title and close button */}
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <DrawerTitle className="text-lg font-semibold text-foreground">
              Your posts
            </DrawerTitle>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="px-4 pb-0">
            <div className="flex gap-6 border-b border-border/30">
              <button
                onClick={() => setActiveTab('drafts')}
                className={cn(
                  "pb-3 text-base font-medium transition-colors duration-200 relative",
                  activeTab === 'drafts' 
                    ? "text-foreground font-semibold" 
                    : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  Drafts
                  {drafts.length > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center">
                      {drafts.length}
                    </span>
                  )}
                </span>
                {activeTab === 'drafts' && (
                  <motion.div 
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                  />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('scheduled')}
                className={cn(
                  "pb-3 text-base font-medium transition-colors duration-200 relative",
                  activeTab === 'scheduled' 
                    ? "text-foreground font-semibold" 
                    : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  Scheduled
                  {scheduledPosts.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center">
                      {scheduledPosts.length}
                    </span>
                  )}
                </span>
                {activeTab === 'scheduled' && (
                  <motion.div 
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" 
                  />
                )}
              </button>
              
              {/* Inline actions */}
              <div className="ml-auto flex items-center gap-2 pb-3">
                {activeTab === 'drafts' && onSaveDraft && canSaveDraft && (
                  <button
                    onClick={onSaveDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-primary text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
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
                  {/* Save current post shortcut */}
                  {onSaveDraft && canSaveDraft && (
                    <button
                      onClick={onSaveDraft}
                      className="w-full flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl text-left hover:bg-primary/10 active:bg-primary/15 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Save className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Save current post as draft</p>
                        <p className="text-xs text-muted-foreground">Resume editing later</p>
                      </div>
                    </button>
                  )}
                  
                  {drafts.map((draft, index) => (
                    <DraftItem
                      key={draft.id}
                      draft={draft}
                      index={index}
                      isConfirmingDelete={confirmDeleteId === draft.id}
                      isDeleting={isDeleting}
                      onLoad={() => handleLoadDraft(draft)}
                      onDelete={() => handleDeleteDraft(draft.id)}
                      onConfirmDelete={() => setConfirmDeleteId(draft.id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                      getActorLabel={getActorLabel}
                    />
                  ))}
                  
                  {/* Clear all drafts */}
                  {drafts.length >= 2 && (
                    <button
                      onClick={() => setShowDeleteAllConfirm(true)}
                      disabled={isDeleting}
                      className="w-full py-3 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                    >
                      Clear all drafts
                    </button>
                  )}
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
                  {scheduledPosts.map((post, index) => (
                    <ScheduledItem
                      key={post.id}
                      post={post}
                      index={index}
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
                <AlertCircle size={40} className="text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Delete all drafts?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  This will permanently delete {drafts.length} draft{drafts.length !== 1 ? 's' : ''}.
                  This can't be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-6 py-2.5 text-sm font-medium text-destructive-foreground bg-destructive rounded-xl hover:bg-destructive/90 disabled:opacity-50 transition-colors"
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

          {/* Overwrite Confirmation Overlay */}
          <AnimatePresence>
            {pendingOverwriteDraft && onConfirmOverwrite && onCancelOverwrite && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/98 backdrop-blur-xl p-6 rounded-t-3xl"
              >
                <AlertCircle size={40} className="text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Replace current post?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Loading this draft will replace your current post content.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onConfirmOverwrite}
                    className="px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={onCancelOverwrite}
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
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.10)' }}>
        <FileText className="w-7 h-7" style={{ color: '#f59e0b' }} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No drafts yet
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-[240px]">
        Posts you're working on will appear here
      </p>
    </div>
  );
}

// Empty state for Scheduled tab
function ScheduledEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(245,158,11,0.10)' }}>
        <Calendar className="w-7 h-7" style={{ color: '#f59e0b' }} />
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
  index: number;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  getActorLabel: (actorType: string) => string;
}

const DraftItem = React.memo(function DraftItem({
  draft,
  index,
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
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
              className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-xl hover:bg-destructive/90 disabled:opacity-50 transition-colors"
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
        className="p-3 bg-card rounded-2xl border border-border shadow-sm flex items-center gap-3 active:bg-muted/40 transition-colors duration-100 cursor-pointer"
        onClick={onLoad}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {draft.media && draft.media.length > 0 ? (
            <div className="relative w-full h-full">
              <img
                src={draft.media[0].posterUrl || draft.media[0].mediaUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Show fallback icon (parent bg-muted is already visible)
                }}
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
            {getActorLabel(draft.actorType)} · Saved {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
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
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
          aria-label="Delete draft"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
});

// Scheduled post item component
interface ScheduledItemProps {
  post: ScheduledPost;
  index: number;
  thumbnail: string | null;
  isDeleting: boolean;
  isPublishing: boolean;
  onPostNow: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

const ScheduledItem = React.memo(function ScheduledItem({
  post,
  index,
  thumbnail,
  isDeleting,
  isPublishing,
  onPostNow,
  onDelete,
  onEdit,
}: ScheduledItemProps) {
  const [confirmAction, setConfirmAction] = useState<'publish' | 'delete' | null>(null);
  const scheduledDate = new Date(post.scheduledAt);
  const formattedDate = format(scheduledDate, 'MMM d, yyyy');
  const formattedTime = format(scheduledDate, 'h:mm a');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="relative"
    >
      {/* Confirmation overlay */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/95 backdrop-blur-sm rounded-2xl"
          >
            <span className="text-sm font-medium text-foreground mr-2">
              {confirmAction === 'publish' ? 'Publish now?' : 'Delete this post?'}
            </span>
            <button
              onClick={() => {
                if (confirmAction === 'publish') onPostNow();
                else onDelete();
                setConfirmAction(null);
              }}
              disabled={isPublishing || isDeleting}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50",
                confirmAction === 'delete'
                  ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  : "text-primary-foreground bg-primary hover:bg-primary/90"
              )}
            >
              {confirmAction === 'publish' 
                ? (isPublishing ? 'Posting…' : 'Publish') 
                : (isDeleting ? 'Deleting…' : 'Delete')}
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 text-sm font-medium bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 bg-card rounded-2xl border border-border shadow-sm space-y-3 active:bg-muted/40 transition-colors duration-100">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
            <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Scheduled for {formattedDate} at {formattedTime}</span>
            </div>

            {/* Caption */}
            <p className="text-sm text-foreground line-clamp-2">
              {post.content || "No caption"}
            </p>
          </div>

          {/* Delete button */}
          <button
            onClick={() => setConfirmAction('delete')}
            disabled={isDeleting}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0 disabled:opacity-50"
            aria-label="Delete scheduled post"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setConfirmAction('publish')}
            disabled={isPublishing}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
    </motion.div>
  );
});
