// DraftsListSheet - Premium glass bottom sheet for saved drafts
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, FileText, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDrafts } from '@/hooks/useDrafts';
import type { DraftWithMedia } from '@/services/drafts';

interface DraftsListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: DraftWithMedia) => void;
}

export default function DraftsListSheet({ isOpen, onClose, onLoadDraft }: DraftsListSheetProps) {
  const { drafts, isLoading, deleteDraft, deleteAllDrafts, isDeleting, maxDrafts } = useDrafts();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  useEffect(() => {
    console.log('[DraftsListSheet] isOpen:', isOpen);
  }, [isOpen]);

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

  const getActorLabel = (actorType: string) => {
    switch (actorType) {
      case 'business': return 'Business';
      case 'creator': return 'Creator';
      default: return 'Personal';
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent 
        className="max-h-[85vh] border-0 z-[10002]" 
        style={{ 
          background: 'var(--cm-surface-card)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
          zIndex: 10002,
        }}
      >
        <VisuallyHidden>
          <DrawerTitle>Your Drafts</DrawerTitle>
          <DrawerDescription>Manage your saved drafts</DrawerDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-300/60" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--cm-text-primary)' }}>
                Drafts
              </h2>
              {drafts.length > 0 && (
                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    background: 'var(--cm-surface-alt)',
                    color: 'var(--cm-text-secondary)',
                    border: '1px solid var(--cm-border-subtle)',
                  }}
                >
                  {drafts.length}/{maxDrafts}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {drafts.length > 1 && (
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={isDeleting}
                  className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Delete All
                </button>
              )}
              <button
                onClick={onClose}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "bg-slate-100/80 dark:bg-slate-800/80",
                  "backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50",
                  "transition-all duration-200 active:scale-95"
                )}
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--cm-surface-alt)' }}
                >
                  <FileText className="w-8 h-8" style={{ color: 'var(--cm-text-tertiary)' }} />
                </div>
                <p className="font-medium" style={{ color: 'var(--cm-text-secondary)' }}>
                  No drafts yet
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--cm-text-tertiary)' }}>
                  Your unfinished posts appear here
                </p>
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
                          className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-2xl backdrop-blur-md"
                          style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                        >
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            disabled={isDeleting}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-400 disabled:opacity-50 transition-all active:scale-95"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all active:scale-95"
                            style={{ background: 'var(--cm-surface-alt)', color: 'var(--cm-text-primary)' }}
                          >
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Draft Card */}
                    <div 
                      className="flex items-start gap-3 p-4 rounded-2xl transition-all active:scale-[0.99]"
                      style={{ 
                        background: 'var(--cm-surface-alt)',
                        border: '1px solid var(--cm-border-subtle)',
                      }}
                    >
                      {/* Thumbnail */}
                      <div 
                        className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden"
                        style={{ background: 'var(--cm-surface-card)' }}
                      >
                        {draft.media && draft.media.length > 0 ? (
                          <>
                            <img
                              src={draft.media[0].mediaType === 'video' 
                                ? (draft.media[0].posterUrl || draft.media[0].mediaUrl)
                                : draft.media[0].mediaUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {draft.media.length > 1 && (
                              <div 
                                className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-md"
                                style={{ background: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
                              >
                                +{draft.media.length - 1}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <FileText className="w-5 h-5" style={{ color: 'var(--cm-text-tertiary)' }} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => handleLoadDraft(draft)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm line-clamp-2" style={{ color: 'var(--cm-text-primary)' }}>
                          {draft.content || (
                            <span style={{ color: 'var(--cm-text-tertiary)' }} className="italic">No caption</span>
                          )}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--cm-text-tertiary)' }}>
                          {getActorLabel(draft.actorType)} · {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                        </p>
                        {draft.categories && draft.categories.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {draft.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                                style={{ 
                                  background: 'var(--cm-surface-card)',
                                  color: 'var(--cm-text-secondary)',
                                }}
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
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                          "transition-all active:scale-95"
                        )}
                        style={{ 
                          background: 'var(--cm-surface-card)',
                          border: '1px solid var(--cm-border-subtle)',
                        }}
                        aria-label="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: 'var(--cm-text-tertiary)' }} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Delete All Confirmation */}
          <AnimatePresence>
            {showDeleteAllConfirm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 rounded-t-[28px] backdrop-blur-md"
                style={{ background: 'rgba(255, 255, 255, 0.95)' }}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--cm-text-primary)' }}>
                  Delete all drafts?
                </h3>
                <p className="text-sm text-center mb-6" style={{ color: 'var(--cm-text-secondary)' }}>
                  This will permanently delete {drafts.length} draft{drafts.length !== 1 ? 's' : ''}.
                  <br />This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-6 py-3 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-400 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button
                    onClick={() => setShowDeleteAllConfirm(false)}
                    className="px-6 py-3 text-sm font-medium rounded-xl transition-all active:scale-95"
                    style={{ background: 'var(--cm-surface-alt)', color: 'var(--cm-text-primary)' }}
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
