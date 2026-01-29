import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { StudioEdits, StudioTool } from '@/types/studio';
import StudioToolRail from './StudioToolRail';
import StudioPanelMusic from './panels/StudioPanelMusic';
import StudioPanelText from './panels/StudioPanelText';
import StudioPanelFilter from './panels/StudioPanelFilter';
import StudioPanelEdit from './panels/StudioPanelEdit';

type StudioShelfProps = {
  open: boolean;
  onClose: () => void;
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
  activeMediaId: string;
  activeMediaType: 'image' | 'video';
  activeMediaPreviewUrl?: string | null;
  activeMediaThumbnailUrl?: string | null; // For filter thumbnails (videos need a poster image)
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  clearEdits: () => void;
  // Position mode state - lifted up so CreateMomentMediaStage can use it
  isPositioningText?: boolean;
  onTogglePositionMode?: () => void;
  // Active overlay selection (synced with renderer)
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
};

export default function StudioShelf({
  open,
  onClose,
  activeTool,
  setActiveTool,
  activeMediaId,
  activeMediaType,
  activeMediaPreviewUrl,
  activeMediaThumbnailUrl,
  edits,
  updateEdits,
  clearEdits,
  isPositioningText = false,
  onTogglePositionMode,
  activeOverlayId,
  onSelectOverlay
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

  // Determine if we should show collapsed mode
  const isCollapsed = activeTool === 'text' && isPositioningText;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop - Clbhouz style */}
          <motion.div
            className="fixed inset-0 z-[9998]"
            style={{
              background: isCollapsed ? 'transparent' : 'var(--cm-backdrop)',
              // Critical: when collapsed (Position Mode), don't block interactions with the media canvas
              pointerEvents: isCollapsed ? 'none' : 'auto',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={isCollapsed ? undefined : onClose}
          />

          {/* Studio Shelf - Clbhouz sheet styling */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-2xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--cm-surface-card)',
              boxShadow: 'var(--cm-shadow-soft)',
              height: isCollapsed ? 'auto' : '75vh',
              maxHeight: isCollapsed ? '20vh' : '75vh',
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

            {/* Header - hide when collapsed */}
            {!isCollapsed && (
              <div 
                className="flex items-center justify-between px-4 pb-2"
                style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
              >
                <div>
                  <h3 
                    className="text-base font-semibold"
                    style={{ color: 'var(--cm-text-primary)' }}
                  >
                    Studio
                  </h3>
                  <p 
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--cm-text-tertiary)' }}
                  >
                    Enhance your moment
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--cm-surface-alt)' }}
                  aria-label="Close Studio"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--cm-icon-primary)' }} />
                </button>
              </div>
            )}

            {/* Tool Rail - hide when collapsed */}
            {!isCollapsed && (
              <StudioToolRail activeTool={activeTool} setActiveTool={setActiveTool} />
            )}

            {/* Tool Panels - scrollable area with min-h-0 for proper flex scroll */}
            <div className={isCollapsed ? '' : 'flex-1 min-h-0 overflow-hidden'}>
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
                    className={isCollapsed ? '' : 'h-full'}
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
                      isPositioningText={isPositioningText}
                      onTogglePositionMode={onTogglePositionMode}
                      activeOverlayId={activeOverlayId}
                      onSelectOverlay={onSelectOverlay}
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
                      previewUrl={activeMediaThumbnailUrl || activeMediaPreviewUrl}
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
                      mediaType={activeMediaType}
                      mediaUrl={activeMediaPreviewUrl || undefined}
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
                    <div className="text-center px-6 py-8">
                      <motion.div 
                        className="text-3xl mb-2"
                        animate={{ 
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        ✨
                      </motion.div>
                      <p className="text-sm font-medium" style={{ color: 'var(--cm-text-primary)' }}>
                        Choose a tool to enhance your moment
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--cm-text-tertiary)' }}>
                        Add music, text, filters, or fine-tune your clip
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - unified design: outline cancel, dark done */}
            {!isCollapsed && (
              <div 
                className="px-5 pt-3 pb-4 flex gap-3 border-t border-border/30"
                style={{ 
                  paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 16px)',
                  background: 'var(--cm-surface-card)',
                }}
              >
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-colors border border-border/40 bg-background text-foreground hover:bg-muted/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all bg-foreground text-background hover:bg-foreground/90"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
