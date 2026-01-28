// Apple-style Action Sheet for Leave Review confirmation
// Matches Post Wizard style - two options: Leave, Keep Editing

import { motion, AnimatePresence } from 'framer-motion';

interface DiscardActionSheetProps {
  open: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
  /** Whether user is editing an existing review (shows different copy) */
  isEditMode?: boolean;
}

export function DiscardActionSheet({
  open,
  onDiscard,
  onKeepEditing,
  isEditMode = false,
}: DiscardActionSheetProps) {
  // Context-aware copy
  const title = isEditMode ? 'Exit without saving?' : 'Exit review?';
  const subtitle = isEditMode
    ? 'Your changes will not be saved. Your existing review will remain unchanged.'
    : 'Your progress will not be saved.';

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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onKeepEditing}
          />
          
          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 p-3 pb-safe"
          >
            {/* Main actions card */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden mb-2 shadow-xl">
              {/* Header */}
              <div className="px-4 py-3 text-center border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {title}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {subtitle}
                </p>
              </div>
              
              {/* Exit - Destructive */}
              <button
                onClick={onDiscard}
                className="w-full py-4 text-center text-red-500 text-lg font-normal active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                Exit
              </button>
            </div>
            
            {/* Keep Editing - Separate card, emphasized */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl">
              <button
                onClick={onKeepEditing}
                className="w-full py-4 text-center text-blue-500 text-lg font-semibold active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
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
