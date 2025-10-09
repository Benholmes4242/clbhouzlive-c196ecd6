import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { StudioEdits, StudioTool } from '@/types/studio';
import StudioToolRail from './StudioToolRail';
import StudioPanelMusic from './panels/StudioPanelMusic';
import StudioPanelText from './panels/StudioPanelText';
import StudioPanelFilter from './panels/StudioPanelFilter';
import StudioPanelEdit from './panels/StudioPanelEdit';
import { useEffect } from 'react';

type StudioShelfProps = {
  open: boolean;
  onClose: () => void;
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
  activeMediaId: string;
  activeMediaType: 'image' | 'video';
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  clearEdits: () => void;
};

export default function StudioShelf({
  open,
  onClose,
  activeTool,
  setActiveTool,
  activeMediaId,
  activeMediaType,
  edits,
  updateEdits,
  clearEdits
}: StudioShelfProps) {
  // Focus trap and keyboard handling
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleApply = () => {
    // Tool-specific apply logic is handled in panels
    // Just close the tool panel
    setActiveTool(null);
  };

  const handleReset = () => {
    // Reset current tool's edits
    if (activeTool === 'music') {
      updateEdits({ music: null });
    } else if (activeTool === 'text') {
      updateEdits({ textOverlays: [] });
    } else if (activeTool === 'filter') {
      updateEdits({ filter: 'normal' });
    } else if (activeTool === 'edit') {
      updateEdits({ crop: undefined, rotate: 0 });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={onClose}
          />

          {/* Studio Shelf */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[9999] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '75vh',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring',
              damping: 30,
              stiffness: 300,
              duration: 0.24 
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
              <h3 className="text-lg font-semibold text-zinc-900">Studio</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                aria-label="Close Studio"
              >
                <X className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {/* Tool Rail */}
            <StudioToolRail activeTool={activeTool} setActiveTool={setActiveTool} />

            {/* Tool Panels */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTool === 'music' && (
                  <motion.div
                    key="music"
                    className="h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <StudioPanelMusic
                      edits={edits}
                      updateEdits={updateEdits}
                      onApply={handleApply}
                      onReset={handleReset}
                    />
                  </motion.div>
                )}

                {activeTool === 'text' && (
                  <motion.div
                    key="text"
                    className="h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <StudioPanelText
                      edits={edits}
                      updateEdits={updateEdits}
                      onApply={handleApply}
                      onReset={handleReset}
                    />
                  </motion.div>
                )}

                {activeTool === 'filter' && (
                  <motion.div
                    key="filter"
                    className="h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <StudioPanelFilter
                      edits={edits}
                      updateEdits={updateEdits}
                      onApply={handleApply}
                      onReset={handleReset}
                    />
                  </motion.div>
                )}

                {activeTool === 'edit' && (
                  <motion.div
                    key="edit"
                    className="h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <StudioPanelEdit
                      edits={edits}
                      updateEdits={updateEdits}
                      onApply={handleApply}
                      onReset={handleReset}
                      mediaType={activeMediaType}
                    />
                  </motion.div>
                )}

                {!activeTool && (
                  <motion.div
                    key="empty"
                    className="h-full flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-center px-6 py-12">
                      <div className="text-4xl mb-3">✨</div>
                      <p className="text-zinc-600 font-medium">Select a tool to get started</p>
                      <p className="text-sm text-zinc-500 mt-1">Add music, text, filters, or edit your media</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 bg-white flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
