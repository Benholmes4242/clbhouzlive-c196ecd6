import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { StudioEdits, StudioTool } from '@/types/studio';
import StudioToolRail from './StudioToolRail';
import StudioPanelMusic from './panels/StudioPanelMusic';
import StudioPanelText from './panels/StudioPanelText';
import StudioPanelFilter from './panels/StudioPanelFilter';
import StudioPanelEdit from './panels/StudioPanelEdit';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type StudioShelfProps = {
  open: boolean;
  onClose: () => void;
  activeTool: StudioTool;
  setActiveTool: (tool: StudioTool) => void;
  activeMediaId: string;
  activeMediaType: 'image' | 'video';
  activeMediaPreviewUrl?: string | null;
  activeMediaThumbnailUrl?: string | null;
  edits: StudioEdits;
  updateEdits: (patch: Partial<StudioEdits>) => void;
  clearEdits: () => void;
  isPositioningText?: boolean;
  onTogglePositionMode?: () => void;
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Detect if user has made any changes
  const hasChanges = useMemo(() => {
    if (!edits) return false;
    return !!(
      (edits.filter && edits.filter !== 'normal') ||
      (edits.filterIntensity !== undefined && edits.filterIntensity !== 100) ||
      (edits.textOverlays && edits.textOverlays.length > 0) ||
      edits.music ||
      edits.crop ||
      (edits.rotate && edits.rotate !== 0) ||
      edits.flipH ||
      edits.flipV
    );
  }, [edits]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelAttempt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, hasChanges]);

  const handleCancelAttempt = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    clearEdits();
    setShowCancelConfirm(false);
    onClose();
  };

  const handleApply = () => {
    setActiveTool(null);
  };

  const handleReset = () => {
    if (activeTool === 'music') {
      updateEdits({ music: null });
    } else if (activeTool === 'text') {
      updateEdits({ textOverlays: [] });
    } else if (activeTool === 'filter') {
      updateEdits({ filter: 'normal', filterIntensity: 100 });
    } else if (activeTool === 'edit') {
      updateEdits({ crop: undefined, rotate: 0, flipH: false, flipV: false });
    }
  };

  const handleResetAll = () => {
    clearEdits();
  };

  const isCollapsed = activeTool === 'text' && isPositioningText;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40"
            style={{
              pointerEvents: isCollapsed ? 'none' : 'auto',
              opacity: isCollapsed ? 0 : undefined,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={isCollapsed ? undefined : handleCancelAttempt}
          />

          {/* Studio Shelf */}
          <motion.div
            className="light fixed inset-x-0 bottom-0 z-[9999] rounded-t-2xl overflow-hidden flex flex-col bg-card shadow-xl"
            style={{
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
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {!isCollapsed && (
              <div className="flex items-center justify-between px-4 pb-2 border-b border-border/60">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Studio
                  </h3>
                  <p className="text-[11px] mt-0.5 text-muted-foreground">
                    Enhance your moment
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      onClick={handleResetAll}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive/70 hover:bg-destructive/5 transition-colors"
                      aria-label="Reset all edits"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                  <button
                    onClick={handleCancelAttempt}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors bg-muted/50 hover:bg-muted"
                    aria-label="Close Studio"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Tool Rail */}
            {!isCollapsed && (
              <StudioToolRail activeTool={activeTool} setActiveTool={setActiveTool} />
            )}

            {/* Tool Panels */}
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
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        ✨
                      </motion.div>
                      <p className="text-sm font-medium text-foreground">
                        Choose a tool to enhance your moment
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Add music, text, filters, or fine-tune your clip
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!isCollapsed && (
              <div 
                className="px-5 pt-3 pb-4 flex gap-3 border-t border-border/30 bg-card"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 16px)' }}
              >
                <button
                  onClick={handleCancelAttempt}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-colors border border-border/40 bg-background text-foreground hover:bg-muted/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onClose()}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>

          {/* Cancel Confirmation Dialog */}
          <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
            <AlertDialogContent className="z-[10001]" overlayClassName="z-[10000]">
              <AlertDialogHeader>
                <AlertDialogTitle>Discard studio changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved edits that will be lost if you close the studio.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>
                  Keep editing
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleConfirmDiscard}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
}
