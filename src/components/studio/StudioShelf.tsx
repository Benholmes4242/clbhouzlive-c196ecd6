import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { StudioEdits, StudioTool } from '@/types/studio';
import StudioToolRail from './StudioToolRail';
import StudioPanelMusic from './panels/StudioPanelMusic';
import StudioPanelText from './panels/StudioPanelText';
import StudioPanelFilter from './panels/StudioPanelFilter';
import StudioPanelEdit from './panels/StudioPanelEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { CropEditor } from '@/components/studio/CropEditor';
import { getFilterClass } from '@/utils/studioFilters';
import { aspectRatioToNumber } from '@/utils/studioEdit';
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
  /** @deprecated No longer used in fullscreen studio */
  isPositioningText?: boolean;
  /** @deprecated No longer used in fullscreen studio */
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
  activeOverlayId,
  onSelectOverlay
}: StudioShelfProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelAttempt();
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

  // Build transform for media
  const mediaTransform = useMemo(() => {
    const parts: string[] = [];
    if (edits.rotate) parts.push(`rotate(${edits.rotate}deg)`);
    if (edits.flipH) parts.push('scaleX(-1)');
    if (edits.flipV) parts.push('scaleY(-1)');
    return parts.length > 0 ? parts.join(' ') : undefined;
  }, [edits.rotate, edits.flipH, edits.flipV]);

  const filterClass = edits.filter && edits.filter !== 'normal' ? getFilterClass(edits.filter) : '';
  const filterIntensity = edits.filterIntensity ?? 100;
  const hasActiveFilter = !!(edits.filter && edits.filter !== 'normal');

  // Compare mode: filter panel can temporarily hide the filter on canvas
  const [isComparing, setIsComparing] = useState(false);

  // CropEditor aspect ratio
  const cropAspect = useMemo(() => {
    return edits.crop?.ratio ? aspectRatioToNumber(edits.crop.ratio) : undefined;
  }, [edits.crop?.ratio]);

  // Handle text overlay updates from the canvas renderer
  const handleTextOverlayChange = useCallback((overlays: any[]) => {
    updateEdits({ textOverlays: overlays });
  }, [updateEdits]);

  // CropEditor handlers
  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    updateEdits({
      crop: {
        ratio: edits.crop?.ratio || 'original',
        area: {
          x: croppedArea.x,
          y: croppedArea.y,
          width: croppedArea.width,
          height: croppedArea.height,
        },
        zoom: edits.crop?.zoom || 1,
      },
    });
  }, [edits.crop?.ratio, edits.crop?.zoom, updateEdits]);

  const handleCropZoomChange = useCallback((newZoom: number) => {
    updateEdits({
      crop: {
        ...edits.crop,
        ratio: edits.crop?.ratio || 'original',
        zoom: newZoom,
      },
    });
  }, [edits.crop, updateEdits]);

  const showCropOnCanvas = activeTool === 'edit' && activeMediaType === 'image' && !!activeMediaPreviewUrl;

  // Should we show the filter on canvas? Not during compare mode
  const showFilterOnCanvas = hasActiveFilter && !isComparing;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fullscreen overlay */}
          <motion.div
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Top bar — compact, sits in safe area above media */}
            <div
              className="flex-shrink-0 bg-black"
              style={{ paddingTop: '59px' }}
            >
              <div className="flex items-center justify-between px-4 h-11">
                <button
                  onClick={handleCancelAttempt}
                  className="flex items-center gap-1 -ml-1"
                >
                  <ArrowLeft className="w-5 h-5 text-white/90" />
                  <span className="text-sm font-medium text-white/90">Back</span>
                </button>
                <div className="flex items-center gap-3">
                  {hasChanges && (
                    <button
                      onClick={handleResetAll}
                      className="text-sm font-medium text-white/60"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => onClose()}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                    style={{ background: '#f59e0b' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>

            {/* Live Media Canvas */}
            <div
              ref={canvasRef}
              className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0"
              style={{ touchAction: 'none' }}
            >
              {/* Show CropEditor when crop tool is active for images */}
              {showCropOnCanvas ? (
                <div className="absolute inset-0">
                  <CropEditor
                    imageSrc={activeMediaPreviewUrl!}
                    aspectRatio={cropAspect}
                    initialZoom={edits.crop?.zoom || 1}
                    initialCrop={edits.crop?.area ? {
                      x: edits.crop.area.x,
                      y: edits.crop.area.y,
                    } : undefined}
                    onCropComplete={handleCropComplete}
                    onZoomChange={handleCropZoomChange}
                  />
                </div>
              ) : (
                <>
                  {/* Dual-layer media: base (unfiltered) + filtered overlay for intensity blending */}
                  <div className="relative flex items-center justify-center w-full h-full">
                    {/* Base layer: always unfiltered, always fully opaque */}
                    {activeMediaType === 'video' ? (
                      <video
                        src={activeMediaPreviewUrl || undefined}
                        poster={activeMediaThumbnailUrl || undefined}
                        className="max-w-full max-h-full object-contain"
                        style={{ transform: mediaTransform }}
                        autoPlay loop muted playsInline
                      />
                    ) : (
                      <img
                        src={activeMediaPreviewUrl || undefined}
                        className="max-w-full max-h-full object-contain"
                        style={{ transform: mediaTransform }}
                        alt="Studio preview"
                      />
                    )}

                    {/* Filter layer: overlaid with opacity = intensity for blending */}
                    {showFilterOnCanvas && (
                      <>
                        {activeMediaType === 'video' ? (
                          <video
                            src={activeMediaPreviewUrl || undefined}
                            poster={activeMediaThumbnailUrl || undefined}
                            className={`absolute inset-0 max-w-full max-h-full object-contain m-auto ${filterClass}`}
                            style={{
                              transform: mediaTransform,
                              opacity: filterIntensity / 100,
                            }}
                            autoPlay loop muted playsInline
                          />
                        ) : (
                          <img
                            src={activeMediaPreviewUrl || undefined}
                            className={`absolute inset-0 max-w-full max-h-full object-contain m-auto ${filterClass}`}
                            style={{
                              transform: mediaTransform,
                              opacity: filterIntensity / 100,
                            }}
                            alt=""
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Text overlays — draggable on the canvas */}
                  {edits.textOverlays && edits.textOverlays.length > 0 && (
                    <TextOverlayRenderer
                      textOverlays={edits.textOverlays}
                      isEditable={activeTool === 'text'}
                      onChange={handleTextOverlayChange}
                      containerRef={canvasRef as React.RefObject<HTMLDivElement>}
                      activeOverlayId={activeOverlayId}
                      onSelectOverlay={onSelectOverlay}
                      safeAreaContext="create"
                    />
                  )}
                </>
              )}
            </div>

            {/* Tool Rail */}
            <StudioToolRail activeTool={activeTool} setActiveTool={setActiveTool} />

            {/* Panel Area */}
            <div
              className="overflow-y-auto flex-shrink-0"
              style={{ height: '35vh', background: '#1A1A1A' }}
            >
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
                      onCompareStart={() => setIsComparing(true)}
                      onCompareEnd={() => setIsComparing(false)}
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
                      showCropCanvas={false}
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
                      <p className="text-sm font-medium text-white">
                        Choose a tool to enhance your moment
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#AEAEB2' }}>
                        Add music, text, filters, or fine-tune your clip
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
