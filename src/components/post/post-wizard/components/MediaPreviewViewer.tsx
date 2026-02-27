import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Wand2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderedMediaItem } from '../types';
import type { StudioEdits } from '@/types/studio';
import { getFilterClass } from '@/utils/studioFilters';
import { getPixelLayerStyle, getCropWrapperClass } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { cn } from '@/lib/utils';

interface MediaPreviewViewerProps {
  items: OrderedMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onStudio: (itemId: string) => void;
  onSetCover?: (index: number) => void;
  coverIndex: number;
  studioEditsByMediaId?: Record<string, StudioEdits>;
}

export function MediaPreviewViewer({ items, initialIndex, onClose, onStudio, onSetCover, coverIndex, studioEditsByMediaId }: MediaPreviewViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  const item = items[currentIndex];
  const isCover = currentIndex === coverIndex;
  const edits = studioEditsByMediaId?.[item?.id];

  const filterClass = edits?.filter && edits.filter !== 'normal'
    ? getFilterClass(edits.filter)
    : '';
  const pixelStyle = getPixelLayerStyle(edits);
  const cropClass = getCropWrapperClass(edits?.crop);

  // Reset playback state on slide change
  useEffect(() => {
    setIsPlaying(true);
    setIsMuted(false);
    setShowPlayIcon(false);
  }, [currentIndex]);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(items.length - 1, idx)));
  }, [items.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (dy > 100 && Math.abs(dx) < 80) {
      onClose();
      return;
    }

    if (Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      if (dx < 0 && currentIndex < items.length - 1) {
        goTo(currentIndex + 1);
      } else if (dx > 0 && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    }
  }, [currentIndex, items.length, goTo, onClose]);

  const handleStudio = useCallback(() => {
    if (item) onStudio(item.id);
  }, [item, onStudio]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[10002] flex flex-col bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 pb-2 flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
          aria-label="Close preview"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          {items.length > 1 && !isCover && (
            <button
              onClick={() => onSetCover?.(currentIndex)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              }}
            >
              Set as Cover
            </button>
          )}

          <button
            onClick={handleStudio}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
            aria-label="Edit in studio"
          >
            <Wand2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Media display */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex items-center justify-center relative"
          >
            <div className={cn('relative w-full h-full flex items-center justify-center', cropClass)}>
              {item.type === 'video' ? (
                <div className="relative w-full h-full flex items-center justify-center" onClick={togglePlayback}>
                  <video
                    ref={videoRef}
                    src={item.previewUrl}
                    poster={item.thumbnailUrl}
                    autoPlay
                    playsInline
                    className={cn('max-w-full max-h-full object-contain', filterClass)}
                    style={pixelStyle}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Tap-to-play/pause animated icon */}
                  <AnimatePresence>
                    {showPlayIcon && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            background: 'rgba(0,0,0,0.45)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}
                        >
                          {isPlaying ? (
                            <Play className="w-7 h-7 text-white ml-1" />
                          ) : (
                            <Pause className="w-7 h-7 text-white" />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mute/unmute button — bottom right */}
                  <button
                    onClick={toggleMute}
                    className="absolute bottom-4 right-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(24px) saturate(180%)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                    }}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>

                  {/* Text overlays */}
                  {edits?.textOverlays && edits.textOverlays.length > 0 && (
                    <TextOverlayRenderer
                      textOverlays={edits.textOverlays}
                      isEditable={false}
                      safeAreaContext="feed"
                    />
                  )}
                </div>
              ) : (
                <>
                  <img
                    src={item.previewUrl}
                    className={cn('max-w-full max-h-full object-contain', filterClass)}
                    style={pixelStyle}
                    alt=""
                    draggable={false}
                  />

                  {/* Text overlays (non-editable) */}
                  {edits?.textOverlays && edits.textOverlays.length > 0 && (
                    <TextOverlayRenderer
                      textOverlays={edits.textOverlays}
                      isEditable={false}
                      safeAreaContext="feed"
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Video scrubber — above dots, only for videos */}
      {item.type === 'video' && (
        <div className="flex-shrink-0 px-4 relative" style={{ height: 3 }}>
          <VideoScrubber
            videoEl={videoRef.current}
            variant="wizard"
            height={3}
          />
        </div>
      )}

      {/* Pagination dots */}
      {items.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5 pt-3 flex-shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        >
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className="w-2 h-2 rounded-full transition-all duration-200"
              style={{
                backgroundColor: idx === currentIndex ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                transform: idx === currentIndex ? 'scale(1.2)' : 'scale(1)',
              }}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Bottom safe area spacer when no dots */}
      {items.length <= 1 && (
        <div className="flex-shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }} />
      )}
    </motion.div>
  );
}
