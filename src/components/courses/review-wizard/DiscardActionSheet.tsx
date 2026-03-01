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
                  {title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              </div>
              
              {/* Exit - Destructive */}
              <button
                onClick={onDiscard}
                className="w-full py-4 text-center text-lg font-normal flex items-center justify-center gap-2 transition-colors active:bg-gray-50"
                style={{ color: '#ef4444' }}
              >
                <Trash2 className="h-4.5 w-4.5" />
                Exit
              </button>
            </div>
            
            {/* Keep Editing - Separate card, matches Post Wizard exactly */}
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
                className="w-full py-4 text-center text-lg font-semibold transition-colors active:bg-gray-50 text-primary"
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
