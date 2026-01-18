// DraftsAndScheduledSheet - Combined bottom sheet with tabs for Drafts and Scheduled Posts
// Light mode theme (#F8FAFC background)

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow, format } from 'date-fns';
import { Trash2, FileText, AlertCircle, Clock, Calendar, Play, Pencil, Save } from 'lucide-react';
import { useDrafts } from '@/hooks/useDrafts';
import { useScheduledPosts, ScheduledPost } from '@/hooks/useScheduledPosts';
import type { DraftWithMedia } from '@/services/drafts';

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
        className="max-h-[85vh] bg-[#F8FAFC] border-t border-slate-200 z-[10002]" 
        style={{ zIndex: 10002 }}
      >
        <VisuallyHidden>
          <DrawerTitle>Drafts & Scheduled</DrawerTitle>
          <DrawerDescription>Manage your drafts and scheduled posts</DrawerDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header with tabs */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200">
            {/* Tabs */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('drafts')}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  activeTab === 'drafts' 
                    ? 'text-slate-900 border-blue-500' 
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                Drafts
                {drafts.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                    {drafts.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                  activeTab === 'scheduled' 
                    ? 'text-slate-900 border-blue-500' 
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                Scheduled
                {scheduledPosts.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                    {scheduledPosts.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {activeTab === 'drafts' && onSaveDraft && canSaveDraft && (
                <button
                  onClick={onSaveDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 text-sm font-medium hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft
                </button>
              )}
              {activeTab === 'drafts' && drafts.length > 1 && (
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-red-600 text-sm font-medium hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Delete All
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'drafts' ? (
              // Drafts content
              isDraftsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                </div>
              ) : drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-500">No saved drafts</p>
                  <p className="text-xs text-slate-400 mt-1">Use "Save Draft" to save your work</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <motion.div
                      key={draft.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      {/* Delete confirmation overlay */}
                      <AnimatePresence>
                        {confirmDeleteId === draft.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl"
                          >
                            <button
                              onClick={() => handleDeleteDraft(draft.id)}
                              disabled={isDeleting}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-start gap-3 p-3 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0 w-12 h-12 bg-slate-100 rounded-xl overflow-hidden">
                          {draft.media && draft.media.length > 0 ? (
                            <>
                              {draft.media[0].mediaType === 'video' ? (
                                <img
                                  src={draft.media[0].posterUrl || draft.media[0].mediaUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={draft.media[0].mediaUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {draft.media.length > 1 && (
                                <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 text-[9px] font-medium bg-black/70 text-white rounded">
                                  +{draft.media.length - 1}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <FileText size={16} className="text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <button
                          onClick={() => handleLoadDraft(draft)}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm text-slate-900 line-clamp-1">
                            {draft.content || (
                              <span className="text-slate-400 italic">No caption</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {getActorLabel(draft.actorType)} · {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                          </p>
                          {draft.categories && draft.categories.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {draft.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat}
                                  className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded border border-slate-200"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setConfirmDeleteId(draft.id)}
                          className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                          aria-label="Delete draft"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              // Scheduled posts content
              isScheduledLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-500">No scheduled posts</p>
                  <p className="text-xs text-slate-400 mt-1">Schedule posts to publish later</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledPosts.map((post) => {
                    const scheduledDate = new Date(post.scheduledAt);
                    const formattedDate = format(scheduledDate, 'MMM d, yyyy');
                    const formattedTime = format(scheduledDate, 'h:mm a');
                    const thumbnail = getThumbnail(post);

                    return (
                      <div
                        key={post.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Thumbnail */}
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt="Post thumbnail"
                              className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-slate-400" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Scheduled time badge */}
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formattedDate} at {formattedTime}</span>
                            </div>

                            {/* Caption */}
                            <p className="text-sm text-slate-900 line-clamp-2">
                              {post.content || "No caption"}
                            </p>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteScheduled(post.id)}
                            disabled={isScheduledDeleting}
                            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex-shrink-0 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handlePostNow(post.id)}
                            disabled={isPublishing}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Play className="w-3 h-3" />
                            Post Now
                          </button>
                          {onEditScheduledPost && (
                            <button 
                              onClick={() => onEditScheduledPost(post)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Delete All Confirmation */}
          <AnimatePresence>
            {showDeleteAllConfirm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F8FAFC]/98 backdrop-blur-xl p-6 rounded-t-3xl"
              >
                <AlertCircle size={40} className="text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete all drafts?</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
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
                    className="px-6 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}