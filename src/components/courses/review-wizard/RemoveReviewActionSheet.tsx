// Frosted glass Action Sheet for Remove Review confirmation
// Matches amber theme with frosted glass cards

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trash2 } from 'lucide-react';

interface RemoveReviewActionSheetProps {
  open: boolean;
  onRemove: () => void;
  onCancel: () => void;
  isRemoving?: boolean;
}

export function RemoveReviewActionSheet({
  open,
  onRemove,
  onCancel,
  isRemoving = false,
}: RemoveReviewActionSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000]">
          {/* Backdrop — frosted */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
            onClick={isRemoving ? undefined : onCancel}
          />
          
          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 p-3 pb-safe mb-8"
          >
            {/* Main actions card — frosted glass */}
            <div
              className="rounded-2xl overflow-hidden mb-2 shadow-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
            >
              {/* Header */}
              <div className="px-4 py-3 text-center border-b border-gray-200/50">
                <h3 className="text-sm font-semibold text-gray-500">
                  Remove this review?
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  This action cannot be undone
                </p>
              </div>
              
              {/* Remove - Destructive */}
              <button
                onClick={onRemove}
                disabled={isRemoving}
                className="w-full py-4 text-center text-red-500 text-lg font-normal active:bg-gray-100 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Remove Review
                  </>
                )}
              </button>
            </div>
            
            {/* Cancel - Separate card, amber accent */}
            <div
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
            >
              <button
                onClick={onCancel}
                disabled={isRemoving}
                className="w-full py-4 text-center text-amber-500 text-lg font-semibold active:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
