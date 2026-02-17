// Frosted glass Action Sheet for Exit Review confirmation
// Matches Post Wizard — amber accent, frosted glass cards

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface DiscardActionSheetProps {
  open: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
  isEditMode?: boolean;
}

export function DiscardActionSheet({
  open,
  onDiscard,
  onKeepEditing,
  isEditMode = false,
}: DiscardActionSheetProps) {
  const title = isEditMode ? 'Exit without saving?' : 'Discard this review?';
  const subtitle = isEditMode 
    ? 'Your changes will not be saved.'
    : "Your progress won't be saved";

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
            onClick={onKeepEditing}
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
                  {title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              </div>
              
              {/* Exit - Destructive */}
              <button
                onClick={onDiscard}
                className="w-full py-4 text-center text-red-500 text-lg font-normal active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Exit
              </button>
            </div>
            
            {/* Keep Editing - Separate card, amber accent */}
            <div 
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
            >
              <button
                onClick={onKeepEditing}
                className="w-full py-4 text-center text-primary text-lg font-semibold active:bg-gray-100 transition-colors"
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
