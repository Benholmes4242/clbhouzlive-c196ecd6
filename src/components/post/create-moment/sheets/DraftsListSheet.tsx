// DraftsListSheet - Bottom sheet showing all saved drafts
// Dark theme polished design

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, FileText, AlertCircle, X } from 'lucide-react';
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

  // Debug: log when open state changes
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
      case 'business':
        return 'Business';
      case 'creator':
        return 'Creator';
      default:
        return 'Personal';
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[85vh] bg-white border-t border-gray-200 z-[10002]" style={{ zIndex: 10002 }}>
        {/* Accessibility: Screen reader title and description */}
        <VisuallyHidden>
          <DrawerTitle>Your Drafts</DrawerTitle>
          <DrawerDescription>Manage your saved drafts</DrawerDescription>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Drafts</h2>
              {drafts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  {drafts.length}/{maxDrafts}
                </span>
              )}
            </div>
            {drafts.length > 1 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={isDeleting}
                className="text-red-500 text-sm font-medium hover:text-red-600 transition-colors disabled:opacity-50"
              >
                Delete All
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No saved drafts</p>
                <p className="text-xs text-gray-400 mt-1">Drafts are saved automatically</p>
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
                          className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl"
                        >
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-400 disabled:opacity-50 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
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
                            <FileText size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => handleLoadDraft(draft)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {draft.content || (
                            <span className="text-gray-400 italic">No caption</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getActorLabel(draft.actorType)} · {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                        </p>
                        {draft.categories && draft.categories.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {draft.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
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
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Delete draft"
                      >
                        <Trash2 size={16} />
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
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 rounded-t-3xl"
              >
                <AlertCircle size={40} className="text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete all drafts?</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                  This will permanently delete {drafts.length} draft{drafts.length !== 1 ? 's' : ''}.
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-400 disabled:opacity-50 transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button
                    onClick={() => setShowDeleteAllConfirm(false)}
                    className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
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