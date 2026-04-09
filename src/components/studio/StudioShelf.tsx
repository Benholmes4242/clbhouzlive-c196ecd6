import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { StudioEdits, StudioTool } from '@/types/studio';
import StudioDial from './StudioDial';
import StudioPanelMusic from './panels/StudioPanelMusic';
import StudioPanelText from './panels/StudioPanelText';
import StudioPanelFilter from './panels/StudioPanelFilter';
import StudioPanelEdit from './panels/StudioPanelEdit';
import StudioPanelLight from './panels/StudioPanelLight';
import StudioPanelTrim from './panels/StudioPanelTrim';
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

// Design tokens — edit flow only
const E = {
  bg:      '#050505',
  surface: 'rgba(255,255,255,0.04)',
  border:  'rgba(255,255,255,0.07)',
  text:    'rgba(255,255,255,0.95)',
  mid:     'rgba(255,255,255,0.45)',
  dim:     'rgba(255,255,255,0.20)',
  ghost:   'rgba(255,255,255,0.08)',
};

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
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  // New props for media navigation
  allMediaItems?: Array<{
    id: string;
    mediaType: 'image' | 'video';
    previewUrl?: string | null;
    thumbnailUrl?: string | null;
  }>;
  activeMediaIndex?: number;
  onNavigateMedia?: (index: number) => void;
  // Trim support
  trimStart?: number;
  trimEnd?: number;
  duration?: number;
  onTrimChange?: (start: number, end: number) => void;
};

export default function StudioShelf({
  open,
  onClose,
  activeTool: externalActiveTool,
  setActiveTool: externalSetActiveTool,
  activeMediaId,
  activeMediaType,
  activeMediaPreviewUrl,
  activeMediaThumbnailUrl,
  edits,
  updateEdits,
  clearEdits,
  activeOverlayId,
  onSelectOverlay,
  allMediaItems,
  activeMediaIndex = 0,
  onNavigateMedia,
  trimStart = 0,
  trimEnd = 0,
  duration = 0,
  onTrimChange,
}: StudioShelfProps) {
  // Internal active tool — defaults to 'filter', never null
  const activeTool = externalActiveTool || 'filter';
  const setActiveTool = (t: StudioTool) => externalSetActiveTool(t || 'filter');

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
      edits.flipV ||
      (edits.exposure !== undefined && edits.exposure !== 50) ||
      (edits.contrast !== undefined && edits.contrast !== 50) ||
      (edits.highlights !== undefined && edits.highlights !== 50) ||
      (edits.shadows !== undefined && edits.shadows !== 50) ||
      (edits.saturation !== undefined && edits.saturation !== 50)
    );
  }, [edits]);

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
    setActiveTool('filter');
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
    } else if (activeTool === 'light') {
      updateEdits({ exposure: 50, contrast: 50, highlights: 50, shadows: 50, saturation: 50 });
    }
  };

  const handleResetAll = () => {
    clearEdits();
  };

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

  const [isComparing, setIsComparing] = useState(false);

  const cropAspect = useMemo(() => {
    return edits.crop?.ratio ? aspectRatioToNumber(edits.crop.ratio) : undefined;
  }, [edits.crop?.ratio]);

  const handleTextOverlayChange = useCallback((overlays: any[]) => {
    updateEdits({ textOverlays: overlays });
  }, [updateEdits]);

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
  const showFilterOnCanvas = hasActiveFilter && !isComparing;

  const FILTER_LABELS: Record<string, string> = {
    vivid: 'Fresh Cut', cool: 'Early Tee', warm: 'Late Round', pop: 'Sharp',
    matte: 'Overcast', fade: 'Mist', vintage: 'Heritage', dramatic: 'Depth', bw: 'Classic',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col"
            style={{
              background: E.bg,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Top bar ── */}
            <div
              className="flex-shrink-0"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)', background: E.bg }}
            >
              <div className="flex items-center justify-between px-4 h-11">
                {/* Back */}
                <button
                  onClick={handleCancelAttempt}
                  className="flex items-center justify-center min-h-[44px]"
                  style={{ width: 36 }}
                >
                  <ArrowLeft className="w-5 h-5" style={{ color: E.text }} />
                </button>

                {/* Thumbnail navigator — centre */}
                <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', maxWidth: '60%' }}>
                  {(allMediaItems || [{ id: activeMediaId, mediaType: activeMediaType, previewUrl: activeMediaPreviewUrl, thumbnailUrl: activeMediaThumbnailUrl }]).map((m, i) => {
                    const on = i === activeMediaIndex;
                    return (
                      <button
                        key={m.id}
                        onClick={() => onNavigateMedia?.(i)}
                        style={{
                          padding: 0, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, overflow: 'hidden',
                          border: on ? '1.5px solid rgba(255,255,255,0.90)' : '1.5px solid rgba(255,255,255,0.12)',
                          opacity: on ? 1 : 0.5,
                          transition: 'all 0.15s',
                        }}>
                          {m.thumbnailUrl || m.previewUrl ? (
                            <img src={m.thumbnailUrl || m.previewUrl || ''} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" style={{ background: E.ghost }} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right — Reset + Done */}
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      onClick={handleResetAll}
                      style={{ fontSize: 12, fontWeight: 600, color: E.mid, minHeight: 44, display: 'flex', alignItems: 'center' }}
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => onClose()}
                    style={{
                      height: 32, padding: '0 16px', borderRadius: 20,
                      border: `1px solid ${E.border}`,
                      background: 'transparent',
                      color: E.text, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>

            {/* ── Media Canvas ── */}
            <div
              ref={canvasRef}
              className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0"
              style={{ touchAction: 'none', margin: '12px 16px 0', position: 'relative' }}
            >
              {/* Ambient glow */}
              <div style={{
                position: 'absolute', inset: -40,
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)`,
                pointerEvents: 'none', zIndex: 0,
              }} />

              {/* Photo/video card */}
              <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: '100%', maxHeight: '100%',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}>
                {showCropOnCanvas ? (
                  <div style={{ width: '100%', height: '100%', minHeight: 200 }}>
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
                    <div className="relative flex items-center justify-center">
                      {activeMediaType === 'video' ? (
                        <video
                          src={activeMediaPreviewUrl || undefined}
                          poster={activeMediaThumbnailUrl || undefined}
                          className="max-w-full max-h-full object-contain"
                          style={{ transform: mediaTransform, maxHeight: '55vh' }}
                          autoPlay loop muted playsInline
                        />
                      ) : (
                        <img
                          src={activeMediaPreviewUrl || undefined}
                          className="max-w-full max-h-full object-contain"
                          style={{ transform: mediaTransform, maxHeight: '55vh' }}
                          alt="Studio preview"
                        />
                      )}

                      {showFilterOnCanvas && (
                        <>
                          {activeMediaType === 'video' ? (
                            <video
                              src={activeMediaPreviewUrl || undefined}
                              poster={activeMediaThumbnailUrl || undefined}
                              className={`absolute inset-0 max-w-full max-h-full object-contain m-auto ${filterClass}`}
                              style={{ transform: mediaTransform, opacity: filterIntensity / 100, maxHeight: '55vh' }}
                              autoPlay loop muted playsInline
                            />
                          ) : (
                            <img
                              src={activeMediaPreviewUrl || undefined}
                              className={`absolute inset-0 max-w-full max-h-full object-contain m-auto ${filterClass}`}
                              style={{ transform: mediaTransform, opacity: filterIntensity / 100, maxHeight: '55vh' }}
                              alt=""
                            />
                          )}
                        </>
                      )}
                    </div>

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

                    {/* Filter badge — top-left */}
                    {hasActiveFilter && !isComparing && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        color: E.text, border: `1px solid ${E.border}`,
                        fontSize: 10, fontWeight: 600, borderRadius: 16, padding: '3px 10px',
                        pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap',
                      }}>
                        {FILTER_LABELS[edits.filter!] || edits.filter} · {filterIntensity}%
                      </div>
                    )}

                    {/* Music badge — bottom-left */}
                    {edits.music && (
                      <div style={{
                        position: 'absolute', bottom: 10, left: 10,
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        color: E.mid, border: `1px solid ${E.border}`,
                        fontSize: 10, fontWeight: 500, borderRadius: 16, padding: '3px 10px',
                        pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap',
                      }}>
                        ♫ {edits.music.title}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Intensity pill — floats below photo, only for filter tool */}
              {hasActiveFilter && activeTool === 'filter' && (
                <div style={{
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: `1px solid ${E.border}`, borderRadius: 24, padding: '6px 14px',
                  zIndex: 30,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: E.mid }}>Intensity</span>
                  <input
                    type="range"
                    min={0} max={100} step={1}
                    value={filterIntensity}
                    onChange={(e) => updateEdits({ filterIntensity: Number(e.target.value) })}
                    className="appearance-none cursor-pointer
                      [&::-webkit-slider-runnable-track]:h-[2px]
                      [&::-webkit-slider-runnable-track]:rounded-full
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.5)]
                      [&::-webkit-slider-thumb]:-mt-[5px]
                      [&::-moz-range-track]:h-[2px]
                      [&::-moz-range-track]:rounded-full
                      [&::-moz-range-thumb]:w-3
                      [&::-moz-range-thumb]:h-3
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:bg-white"
                    style={{
                      width: 90,
                      background: `linear-gradient(to right, #ffffff ${filterIntensity}%, rgba(255,255,255,0.10) ${filterIntensity}%)`,
                    }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 700, color: E.text, fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>
                    {filterIntensity}%
                  </span>
                </div>
              )}
            </div>

            {/* ── The Dial ── */}
            <StudioDial
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              activeMediaType={activeMediaType}
            />

            {/* ── Panel Area ── */}
            <div
              className="overflow-y-auto flex-shrink-0"
              style={{ maxHeight: '30vh', background: E.bg }}
            >
              <AnimatePresence mode="wait">
                {activeTool === 'music' && (
                  <motion.div key="music" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    <StudioPanelMusic edits={edits} updateEdits={updateEdits} onApply={handleApply} onReset={handleReset} />
                  </motion.div>
                )}

                {activeTool === 'text' && (
                  <motion.div key="text" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    <StudioPanelText edits={edits} updateEdits={updateEdits} onApply={handleApply} onReset={handleReset} activeOverlayId={activeOverlayId} onSelectOverlay={onSelectOverlay} />
                  </motion.div>
                )}

                {activeTool === 'filter' && (
                  <motion.div key="filter" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    <StudioPanelFilter
                      edits={edits} updateEdits={updateEdits} onApply={handleApply} onReset={handleReset}
                      previewUrl={activeMediaThumbnailUrl || activeMediaPreviewUrl}
                      onCompareStart={() => setIsComparing(true)}
                      onCompareEnd={() => setIsComparing(false)}
                    />
                  </motion.div>
                )}

                {activeTool === 'edit' && (
                  <motion.div key="edit" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    <StudioPanelEdit edits={edits} updateEdits={updateEdits} mediaType={activeMediaType} mediaUrl={activeMediaPreviewUrl || undefined} showCropCanvas={false} />
                  </motion.div>
                )}

                {activeTool === 'light' && (
                  <motion.div key="light" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    <StudioPanelLight edits={edits} updateEdits={updateEdits} />
                  </motion.div>
                )}

                {activeTool === 'trim' && activeMediaType === 'video' && (
                  <motion.div key="trim" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    <StudioPanelTrim
                      trimStart={trimStart}
                      trimEnd={trimEnd}
                      duration={duration}
                      onTrimChange={onTrimChange || (() => {})}
                    />
                  </motion.div>
                )}

                {activeTool === 'trim' && activeMediaType === 'image' && (
                  <motion.div key="trim-na" className="h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ fontSize: 13, color: E.mid, textAlign: 'center', padding: 24 }}>
                      Trim is only available for video clips
                    </p>
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
