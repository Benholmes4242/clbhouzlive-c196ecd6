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
          {/* Backdrop - Clbhouz style */}
          <motion.div
            className="fixed inset-0 z-[9998]"
            style={{ background: 'var(--cm-backdrop)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={onClose}
          />

          {/* Studio Shelf - Clbhouz sheet styling */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[9999] h-[75vh] rounded-t-2xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--cm-surface-card)',
              boxShadow: 'var(--cm-shadow-soft)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring',
              damping: 28,
              stiffness: 300,
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ background: 'var(--cm-border)' }}
              />
            </div>

            {/* Header - Clbhouz style */}
            <div 
              className="flex items-center justify-between px-4 pb-3"
              style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
            >
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--cm-text-primary)' }}
              >
                Studio
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--cm-surface-alt)' }}
                aria-label="Close Studio"
              >
                <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
              </button>
            </div>

            {/* Tool Rail */}
            <StudioToolRail activeTool={activeTool} setActiveTool={setActiveTool} />

            {/* Tool Panels - scrollable area with min-h-0 for proper flex scroll */}
            <div className="flex-1 min-h-0 overflow-hidden">
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
                      <p className="font-medium" style={{ color: 'var(--cm-text-primary)' }}>
                        Select a tool to get started
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--cm-text-secondary)' }}>
                        Add music, text, filters, or edit your media
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - Clbhouz style with safe area */}
            <div 
              className="px-4 pt-3 flex gap-3"
              style={{ 
                borderTop: '1px solid var(--cm-border-subtle)',
                paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
                background: 'var(--cm-surface-card)',
              }}
            >
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-medium transition-colors"
                style={{ 
                  background: 'var(--cm-surface-alt)',
                  border: '1px solid var(--cm-border-subtle)',
                  color: 'var(--cm-text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                }}
                className="flex-1 py-3 rounded-xl font-semibold transition-colors"
                style={{ 
                  background: 'var(--cm-surface-slate)',
                  color: 'white',
                }}
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