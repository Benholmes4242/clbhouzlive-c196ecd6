// Apple-style Action Sheet for Discard Changes confirmation
// Three options: Discard, Save to Drafts, Keep Editing

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trash2, BookmarkPlus } from 'lucide-react';

interface DiscardActionSheetProps {
  open: boolean;
  onDiscard: () => void;
  onSaveToDrafts: () => void;
  onKeepEditing: () => void;
  isSaving?: boolean;
  canSaveDraft?: boolean;
}

export function DiscardActionSheet({
  open,
  onDiscard,
  onSaveToDrafts,
  onKeepEditing,
  isSaving = false,
  canSaveDraft = true,
}: DiscardActionSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
            onClick={isSaving ? undefined : onKeepEditing}
          />
          
          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 p-3 pb-safe mb-8"
          >
            {/* Main actions card */}
            <div 
              className="rounded-2xl overflow-hidden mb-2"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 -4px 40px -8px rgba(0,0,0,0.12)',
              }}
            >
              {/* Header */}
              <div className="px-4 py-3.5 text-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <h3 className="text-sm font-semibold text-gray-500">
                  Discard this moment?
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Your progress won't be saved
                </p>
              </div>
              
              {/* Discard - Destructive */}
              <button
                onClick={onDiscard}
                disabled={isSaving}
                className="w-full py-4 text-center text-lg font-normal flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:bg-gray-50"
                style={{ 
                  color: '#ef4444',
                  borderBottom: canSaveDraft ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <Trash2 className="h-4.5 w-4.5" />
                Discard
              </button>
              
              {/* Save to Drafts */}
              {canSaveDraft && (
                <button
                  onClick={onSaveToDrafts}
                  disabled={isSaving}
                  className="w-full py-4 text-center text-lg font-normal flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:bg-gray-50"
                  style={{ color: '#d97706' }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-4.5 w-4.5" />
                      Save to Drafts
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Keep Editing - Separate card, emphasized */}
            <div 
              className="rounded-2xl overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 2px 12px -4px rgba(0,0,0,0.08)',
              }}
            >
              <button
                onClick={onKeepEditing}
                disabled={isSaving}
                className="w-full py-4 text-center text-lg font-semibold disabled:opacity-50 transition-colors active:bg-gray-50"
                style={{ color: '#f59e0b' }}
              >
                Keep Editing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
