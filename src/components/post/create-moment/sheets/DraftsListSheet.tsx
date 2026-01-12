// DraftsListSheet - Bottom sheet showing all saved drafts

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, FileEdit, AlertCircle } from 'lucide-react';
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
      <DrawerContent className="max-h-[85vh] bg-background">
        {/* Accessibility: Screen reader title */}
        <VisuallyHidden>
          <DrawerTitle>Your Drafts</DrawerTitle>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold">
              Drafts
              {drafts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({drafts.length}/{maxDrafts})
                </span>
              )}
            </h2>
            {drafts.length > 1 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={isDeleting}
                className="text-xs text-destructive hover:underline disabled:opacity-50"
              >
                Delete All
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FileEdit size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No saved drafts</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
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
                          className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/95 backdrop-blur-sm"
                        >
                          <button
                            onClick={() => handleDeleteDraft(draft.id)}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg disabled:opacity-50"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 py-2 text-sm font-medium bg-muted rounded-lg"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-start gap-3 p-4">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden">
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
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
                                +{draft.media.length - 1}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <FileEdit size={20} className="text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => handleLoadDraft(draft)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm line-clamp-2">
                          {draft.content || (
                            <span className="text-muted-foreground italic">No caption</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span>{getActorLabel(draft.actorType)}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                        {draft.categories && draft.categories.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {draft.categories.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className="px-1.5 py-0.5 text-[10px] bg-muted rounded"
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
                        className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete draft"
                      >
                        <Trash2 size={18} />
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
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6"
              >
                <AlertCircle size={40} className="text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Delete all drafts?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  This will permanently delete {drafts.length} draft{drafts.length !== 1 ? 's' : ''}.
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAll}
                    disabled={isDeleting}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-destructive rounded-xl disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All'}
                  </button>
                  <button
                    onClick={() => setShowDeleteAllConfirm(false)}
                    className="px-6 py-2.5 text-sm font-medium bg-muted rounded-xl"
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
